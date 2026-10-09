import { NextResponse } from "next/server";
import { z } from "zod";
import { requireGuestStaff } from "@/lib/guests/auth";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireGuestStaff(),
      { id } = await params,
      p = z
        .object({ referralCode: z.string().trim().min(1).max(100) })
        .safeParse(await request.json());
    if (!p.success) throw new HttpError(400, "Referral code required");
    const referral = await prisma.$transaction(async (tx) => {
      const referrer = await tx.guest.findUnique({
        where: { referralCode: p.data.referralCode },
      });
      if (!referrer || referrer.mergedIntoId)
        throw new HttpError(404, "Referral code not found");
      for (const guestId of [id, referrer.id].sort())
        await tx.$queryRaw`SELECT id FROM guests WHERE id=${guestId} FOR UPDATE`;
      const guest = await tx.guest.findUnique({
        where: { id },
        include: { referredBy: true },
      });
      if (!guest || guest.mergedIntoId)
        throw new HttpError(404, "Guest not found");
      if (referrer.id === id)
        throw new HttpError(400, "Self-referrals are not allowed");
      if (guest.referredBy)
        throw new HttpError(409, "Guest already has referral attribution");
      if (
        await tx.booking.count({
          where: {
            guestId: id,
            status: "completed",
            checkOutDate: { lte: new Date() },
          },
        })
      )
        throw new HttpError(
          400,
          "Referrals must be attributed before the first completed stay",
        );
      if (
        await tx.booking.count({ where: { guestId: id, status: "confirmed" } })
      )
        throw new HttpError(
          400,
          "Record referral attribution before making the first reservation",
        );
      const r = await tx.guestReferral.create({
        data: { referrerId: referrer.id, referredGuestId: id },
      });
      await tx.guestActivity.create({
        data: {
          guestId: id,
          kind: "referral",
          summary: `Referred by ${referrer.name}`,
          actorId: user.id,
        },
      });
      return r;
    });
    return NextResponse.json({ referral }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
