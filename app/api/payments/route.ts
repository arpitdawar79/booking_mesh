import { HttpError, toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { paymentCreateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const payments = await prisma.payment.findMany({
    where: { bookingId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = paymentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`) }, { status: 400 });
  }

  const data = parsed.data;
  const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${booking.id} FOR UPDATE`;

      // Idempotent retry: a payment with this key was already recorded
      if (data.idempotencyKey) {
        const existingPayment = await tx.payment.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (existingPayment) {
          const current = await tx.booking.findUniqueOrThrow({
            where: { id: booking.id },
          });
          return {
            payment: existingPayment,
            balance: Number(current.balanceAmount),
            paymentStatus: current.paymentStatus,
            deduplicated: true,
          };
        }
      }

      if (data.isRefund) {
        const [paidAgg, refundAgg] = await Promise.all([
          tx.payment.aggregate({
            _sum: { amount: true },
            where: { bookingId: booking.id, isRefund: false },
          }),
          tx.payment.aggregate({
            _sum: { amount: true },
            where: { bookingId: booking.id, isRefund: true },
          }),
        ]);
        const collected =
          Number(booking.amountPaidOnline) +
          Number(paidAgg._sum.amount || 0) -
          Number(refundAgg._sum.amount || 0);
        if (data.amount > collected) {
          throw new HttpError(
            400,
            `Refund exceeds amount collected (${booking.currency} ${collected.toLocaleString("en-IN")})`,
          );
        }
      }

      const payment = await tx.payment.create({
        data: {
          bookingId: data.bookingId,
          amount: data.amount,
          method: data.method,
          date: data.date ? new Date(data.date) : undefined,
          referenceNumber: data.referenceNumber || null,
          recordedBy: data.recordedBy || null,
          isRefund: data.isRefund,
          refundReason: data.refundReason || null,
          idempotencyKey: data.idempotencyKey || null,
        },
      });

      const [paymentsAgg, refundsAgg] = await Promise.all([
        tx.payment.aggregate({
          _sum: { amount: true },
          where: { bookingId: data.bookingId, isRefund: false },
        }),
        tx.payment.aggregate({
          _sum: { amount: true },
          where: { bookingId: data.bookingId, isRefund: true },
        }),
      ]);
      const totalPaid =
        Number(booking.amountPaidOnline) + Number(paymentsAgg._sum.amount || 0);
      const totalRefunded = Number(refundsAgg._sum.amount || 0);
      const balance = Math.round(
        (Number(booking.totalAmount) - totalPaid + totalRefunded) * 100,
      ) / 100;
      const paymentStatus =
        balance <= 0 ? "paid_in_full" : totalPaid > 0 ? "partially_paid" : "pending";

      await tx.booking.update({
        where: { id: data.bookingId },
        data: { balanceAmount: balance, paymentStatus },
      });

      return { payment, balance, paymentStatus };
    });

    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err, "payment create");
  }
}
