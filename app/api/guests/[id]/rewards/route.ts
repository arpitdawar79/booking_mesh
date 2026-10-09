import { NextResponse } from "next/server";
import { z } from "zod";
import { requireGuestStaff } from "@/lib/guests/auth";
import { redemptionSchema } from "@/lib/guests/validation";
import {
  getProgram,
  expirePoints,
  redeem,
  reconcileBooking,
  reverseBenefit,
} from "@/lib/guests/rewards";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
const adjustment = z.object({
  points: z
    .number()
    .int()
    .min(-100000)
    .max(100000)
    .refine((n) => n !== 0),
  reason: z.string().trim().min(5).max(500),
  idempotencyKey: z.uuid(),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireGuestStaff(true),
      { id } = await params,
      body = await request.json();
    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest || guest.mergedIntoId)
      throw new HttpError(404, "Guest not found");
    if (body.action === "reverse_benefit") {
      if (typeof body.bookingId !== "string")
        throw new HttpError(400, "Booking required");
      return NextResponse.json(
        await reverseBenefit(id, body.bookingId, user.id),
      );
    }
    if (body.action === "reconcile") {
      const bookings = await prisma.booking.findMany({
        where: { guestId: id },
        select: { id: true },
      });
      for (const b of bookings) await reconcileBooking(b.id);
      return NextResponse.json({ success: true });
    }
    if (body.action === "adjust") {
      const p = adjustment.safeParse(body);
      if (!p.success)
        throw new HttpError(
          400,
          "Provide nonzero integer points, a reason, and an idempotency key",
        );
      const reward = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM guests WHERE id=${id} FOR UPDATE`;
        const previous = await tx.guestReward.findUnique({
          where: { eventKey: p.data.idempotencyKey },
        });
        if (previous) {
          if (previous.guestId !== id)
            throw new HttpError(
              409,
              "Idempotency key belongs to another guest",
            );
          return previous;
        }
        const balance = await expirePoints(tx, id),
          program = await getProgram(tx);
        if (balance + p.data.points < 0)
          throw new HttpError(400, "Adjustment exceeds available points");
        return tx.guestReward.create({
          data: {
            guestId: id,
            points: p.data.points,
            reason: p.data.reason,
            kind: "adjustment",
            actorId: user.id,
            eventKey: p.data.idempotencyKey,
            expiresAt:
              p.data.points > 0
                ? new Date(Date.now() + program.expiryDays * 86400000)
                : null,
          },
        });
      });
      return NextResponse.json({ reward });
    }
    const p = redemptionSchema.safeParse(body);
    if (!p.success) throw new HttpError(400, "Invalid redemption");
    return NextResponse.json({ redemption: await redeem(id, p.data, user.id) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
