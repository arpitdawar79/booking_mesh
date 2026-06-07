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

  const payment = await prisma.payment.create({
    data: {
      bookingId: data.bookingId,
      amount: data.amount,
      method: data.method,
      referenceNumber: data.referenceNumber || null,
      recordedBy: data.recordedBy || null,
      isRefund: data.isRefund,
      refundReason: data.refundReason || null,
    },
  });

  // Recompute booking balance
  const paymentsAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { bookingId: data.bookingId, isRefund: false },
  });
  const refundsAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { bookingId: data.bookingId, isRefund: true },
  });
  const totalPaid = Number(paymentsAgg._sum.amount || 0);
  const totalRefunded = Number(refundsAgg._sum.amount || 0);
  const balance = Number(booking.totalAmount) - totalPaid + totalRefunded;
  const paymentStatus = balance <= 0 ? "paid_in_full" : totalPaid > 0 ? "partially_paid" : "pending";

  await prisma.booking.update({
    where: { id: data.bookingId },
    data: {
      balanceAmount: balance,
      paymentStatus,
    },
  });

  return NextResponse.json({ payment, balance, paymentStatus });
}
