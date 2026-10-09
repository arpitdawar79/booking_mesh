import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../http-error";
import {
  DEFAULT_PROGRAM,
  discountQuote,
  guestTier,
  netPaid,
  qualifyPoints,
  rewardLots,
  roundMoney,
  type GuestProgram,
} from "./core";
import { programSchema } from "./validation";

export async function getProgram(
  db: Prisma.TransactionClient = prisma,
): Promise<GuestProgram> {
  const record = await db.appConfig.findUnique({
    where: { key: "guest.program" },
  });
  if (!record) return { ...DEFAULT_PROGRAM };
  const parsed = programSchema.safeParse(JSON.parse(record.value));
  if (!parsed.success)
    throw new HttpError(503, "Guest program settings need attention");
  return parsed.data;
}
export async function expirePoints(
  tx: Prisma.TransactionClient,
  guestId: string,
  now = new Date(),
) {
  const entries = await tx.guestReward.findMany({
    where: { guestId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const lots = rewardLots(entries, now);
  for (const lot of lots.expired) {
    const original = entries.find((e) => e.id === lot.id)!;
    await tx.guestReward.create({
      data: {
        guestId,
        bookingId: original.bookingId,
        points: -lot.points,
        kind: "expiry",
        reason: "Unspent points expired",
        eventKey: `expire:${lot.id}`,
      },
    });
  }
  return lots.balance;
}
export async function wallet(guestId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM guests WHERE id=${guestId} FOR UPDATE`;
    const balance = await expirePoints(tx, guestId);
    const ledger = await tx.guestReward.findMany({
      where: { guestId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
    return { balance, ledger };
  });
}
export async function reconcileBooking(bookingId: string) {
  const initial = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true },
  });
  if (!initial?.guestId) return;
  const referral = await prisma.guestReferral.findUnique({
    where: { referredGuestId: initial.guestId },
  });
  await prisma.$transaction(async (tx) => {
    for (const id of [
      ...new Set([
        initial.guestId!,
        ...(referral ? [referral.referrerId] : []),
      ]),
    ].sort())
      await tx.$queryRaw`SELECT id FROM guests WHERE id=${id} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM bookings WHERE id=${bookingId} FOR UPDATE`;
    const b = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { payments: true },
    });
    if (b.guestId !== initial.guestId)
      throw new HttpError(409, "Guest identity changed during reconciliation");
    const program = await getProgram(tx);
    // Disable earning without discarding previously earned balances; cancellations still reverse.
    const entries = await tx.guestReward.findMany({
      where: {
        bookingId,
        guestId: b.guestId!,
        kind: { in: ["earn", "reversal", "expiry"] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const earned = entries
      .filter((e) => e.kind !== "expiry")
      .reduce((s, e) => s + e.points, 0);
    await expirePoints(tx, b.guestId!);
    const rate =
      entries.find((e) => e.kind === "earn" && e.earningRate !== null)
        ?.earningRate ?? program.pointsPer100;
    const target = qualifyPoints(b, {
      ...program,
      enabled: program.enabled || entries.some((e) => e.kind === "earn"),
      pointsPer100: rate,
      minimumSpend: entries.some((e) => e.kind === "earn")
        ? 0
        : program.minimumSpend,
    });
    const expired = await tx.guestReward.aggregate({
      where: { bookingId, guestId: b.guestId!, kind: "expiry" },
      _sum: { points: true },
    });
    const delta =
      target >= earned
        ? target - earned
        : -Math.max(0, earned - target + Number(expired._sum.points || 0));
    if (delta)
      await tx.guestReward.create({
        data: {
          guestId: b.guestId!,
          bookingId,
          points: delta,
          earningRate: delta > 0 ? rate : null,
          kind: delta > 0 ? "earn" : "reversal",
          reason:
            delta > 0
              ? `Completed settled stay ${b.bookingId}`
              : `Stay eligibility changed for ${b.bookingId}`,
          eventKey: `stay:${bookingId}:${randomUUID()}`,
          expiresAt:
            delta > 0
              ? new Date(Date.now() + program.expiryDays * 86400000)
              : null,
        },
      });
    const redemption = await tx.guestRedemption.findUnique({
      where: { bookingId },
    });
    if (b.status === "cancelled" && redemption && !redemption.reversedAt) {
      await reverseRedemptionIn(tx, redemption);
    }

    if (referral) {
      const current = await tx.guestReferral.findUniqueOrThrow({
        where: { id: referral.id },
      });
      if (
        current.status === "pending" &&
        target > 0 &&
        program.referralPoints > 0 &&
        b.createdAt >= current.createdAt
      ) {
        const earlier = await tx.booking.count({
          where: {
            guestId: b.guestId!,
            id: { not: b.id },
            status: "completed",
            checkOutDate: { lte: b.checkOutDate },
          },
        });
        if (!earlier) {
          await expirePoints(tx, current.referrerId);
          await tx.guestReward.create({
            data: {
              guestId: current.referrerId,
              bookingId,
              points: program.referralPoints,
              kind: "referral",
              reason: `Referral first stay ${b.bookingId}`,
              eventKey: `referral:${current.id}`,
              expiresAt: new Date(Date.now() + program.expiryDays * 86400000),
            },
          });
          await tx.guestReferral.update({
            where: { id: current.id },
            data: {
              status: "rewarded",
              rewardBookingId: bookingId,
              awardedPoints: program.referralPoints,
              rewardedAt: new Date(),
            },
          });
        }
      } else if (
        current.status === "rewarded" &&
        current.rewardBookingId === bookingId &&
        (b.status === "cancelled" || netPaid(b) < Number(b.totalAmount))
      ) {
        await expirePoints(tx, current.referrerId);
        const award = await tx.guestReward.findUnique({
          where: { eventKey: `referral:${current.id}` },
        });
        const expiredAward = award
          ? await tx.guestReward.findUnique({
              where: { eventKey: `expire:${award.id}` },
            })
          : null;
        const points = Math.max(
          0,
          current.awardedPoints + (expiredAward?.points || 0),
        );
        if (points)
          await tx.guestReward.create({
            data: {
              guestId: current.referrerId,
              bookingId,
              points: -points,
              kind: "referral_reversal",
              reason: `Referred stay refunded/cancelled ${b.bookingId}`,
              eventKey: `referral-reverse:${current.id}`,
            },
          });
        await tx.guestReferral.update({
          where: { id: current.id },
          data: { status: "reversed" },
        });
      }
    }
  });
}
export async function redeem(
  guestId: string,
  input: {
    bookingId: string;
    points: number;
    offerCode?: string;
    tierBenefit: boolean;
    idempotencyKey: string;
  },
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM guests WHERE id=${guestId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM bookings WHERE id=${input.bookingId} FOR UPDATE`;
    const repeat = await tx.guestRedemption.findUnique({
      where: { eventKey: input.idempotencyKey },
    });
    if (repeat) {
      if (repeat.guestId !== guestId || repeat.bookingId !== input.bookingId)
        throw new HttpError(
          409,
          "Idempotency key belongs to another redemption",
        );
      return repeat;
    }
    const guest = await tx.guest.findUnique({ where: { id: guestId } });
    const b = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { payments: true },
    });
    if (!guest || guest.mergedIntoId || !b || b.guestId !== guestId)
      throw new HttpError(404, "Guest booking not found");
    if (
      b.status !== "confirmed" ||
      b.checkInDate <= new Date() ||
      b.currency !== "INR"
    )
      throw new HttpError(
        400,
        "Rewards apply to upcoming confirmed INR bookings",
      );
    if (await tx.guestRedemption.findUnique({ where: { bookingId: b.id } }))
      throw new HttpError(409, "This booking already has a guest benefit");
    const program = await getProgram(tx),
      balance = await expirePoints(tx, guestId);
    const bookings = await tx.booking.findMany({
      where: { guestId },
      include: { payments: true },
    });
    const settled = bookings.filter(
      (s) =>
        s.status === "completed" &&
        s.checkOutDate <= new Date() &&
        netPaid(s) >= Number(s.totalAmount),
    ).length;
    let percent = input.tierBenefit ? guestTier(settled, program).percent : 0;
    let offer = null;
    if (input.offerCode) {
      if (input.tierBenefit || input.points)
        throw new HttpError(
          400,
          "Offers cannot stack with points or tier discounts",
        );
      offer = await tx.guestOffer.findUnique({
        where: { code: input.offerCode.trim().toUpperCase() },
      });
      if (!offer) throw new HttpError(404, "Offer not found");
      await tx.$queryRaw`SELECT id FROM guest_offers WHERE id=${offer.id} FOR UPDATE`;
      offer = await tx.guestOffer.findUniqueOrThrow({
        where: { id: offer.id },
      });
      const now = new Date();
      if (
        !offer.enabled ||
        offer.startsAt > now ||
        offer.expiresAt <= now ||
        Number(b.totalAmount) < Number(offer.minAmount) ||
        settled < offer.minStays
      )
        throw new HttpError(400, "Booking is not eligible for this offer");
      const used = await tx.guestRedemption.count({
        where: { offerId: offer.id },
      });
      if (
        used >= offer.maxUses ||
        (await tx.guestRedemption.findFirst({
          where: { offerId: offer.id, guestId },
        }))
      )
        throw new HttpError(409, "Offer usage limit reached");
      percent = offer.percent;
    }
    let quote;
    try {
      quote = discountQuote(
        {
          total: Number(b.totalAmount),
          netPaid: netPaid(b),
          points: input.points,
          balance,
          percent,
          offerCap: offer ? Number(offer.maxAmount) : undefined,
        },
        program,
      );
    } catch (err) {
      throw new HttpError(
        400,
        err instanceof Error ? err.message : "Invalid discount",
      );
    }
    if (quote.amount <= 0)
      throw new HttpError(400, "No eligible discount available");
    const total = roundMoney(Number(b.totalAmount) - quote.amount),
      due = roundMoney(total - netPaid(b));
    const gstRate = total >= 7500 ? 18 : 12,
      tax = roundMoney(total - total / (1 + gstRate / 100)),
      cgst = roundMoney(tax / 2);
    const redemption = await tx.guestRedemption.create({
      data: {
        guestId,
        bookingId: b.id,
        offerId: offer?.id,
        points: quote.points,
        amount: quote.amount,
        originalTotal: b.totalAmount,
        eventKey: input.idempotencyKey,
        ruleSnapshot: {
          percent,
          rupeesPerPoint: program.rupeesPerPoint,
          maxDiscountPercent: program.maxDiscountPercent,
          offerCode: offer?.code || null,
          actorId,
        },
      },
    });
    if (quote.points)
      await tx.guestReward.create({
        data: {
          guestId,
          bookingId: b.id,
          points: -quote.points,
          kind: "redeem",
          reason: `Applied to ${b.bookingId}`,
          actorId,
          eventKey: `redeem:${redemption.id}`,
        },
      });
    await tx.booking.update({
      where: { id: b.id },
      data: {
        totalAmount: total,
        balanceAmount: due,
        paymentStatus:
          due <= 0
            ? "paid_in_full"
            : netPaid(b) > 0
              ? "partially_paid"
              : "pending",
        gstRate,
        cgstAmount: Number(b.igstAmount || 0) > 0 ? 0 : cgst,
        sgstAmount: Number(b.igstAmount || 0) > 0 ? 0 : roundMoney(tax - cgst),
        igstAmount: Number(b.igstAmount || 0) > 0 ? tax : 0,
      },
    });
    await tx.bookingAmendment.create({
      data: {
        bookingId: b.id,
        type: "guest_benefit",
        changedBy: actorId,
        summary: `Guest benefit ₹${quote.amount}; ${quote.points} points; ${offer?.code || "loyalty"}`,
      },
    });
    await tx.guestActivity.create({
      data: {
        guestId,
        kind: "benefit",
        summary: `₹${quote.amount} benefit on ${b.bookingId}`,
        actorId,
      },
    });
    return redemption;
  });
}

export async function reverseRedemptionIn(
  tx: Prisma.TransactionClient,
  redemption: NonNullable<
    Awaited<ReturnType<typeof tx.guestRedemption.findUnique>>
  >,
  actorId?: string,
) {
  if (redemption.reversedAt) return;
  const booking = await tx.booking.findUniqueOrThrow({
    where: { id: redemption.bookingId },
    include: { payments: true },
  });
  const program = await getProgram(tx);
  if (redemption.points)
    await tx.guestReward.create({
      data: {
        guestId: redemption.guestId,
        bookingId: booking.id,
        points: redemption.points,
        kind: "redemption_reversal",
        reason: `Benefit reversed for ${booking.bookingId}`,
        actorId,
        eventKey: `redemption-reverse:${redemption.id}`,
        expiresAt: new Date(Date.now() + program.expiryDays * 86400000),
      },
    });
  const total = roundMoney(
      Number(booking.totalAmount) + Number(redemption.amount),
    ),
    due = roundMoney(total - netPaid(booking));
  const gstRate = total >= 7500 ? 18 : 12,
    tax = roundMoney(total - total / (1 + gstRate / 100)),
    cgst = roundMoney(tax / 2),
    igst = Number(booking.igstAmount || 0) > 0;
  await tx.booking.update({
    where: { id: booking.id },
    data: {
      totalAmount: total,
      balanceAmount: due,
      paymentStatus:
        due <= 0
          ? "paid_in_full"
          : netPaid(booking) > 0
            ? "partially_paid"
            : "pending",
      gstRate,
      cgstAmount: igst ? 0 : cgst,
      sgstAmount: igst ? 0 : roundMoney(tax - cgst),
      igstAmount: igst ? tax : 0,
    },
  });
  await tx.guestRedemption.update({
    where: { id: redemption.id },
    data: { reversedAt: new Date() },
  });
  await tx.bookingAmendment.create({
    data: {
      bookingId: booking.id,
      type: "guest_benefit_reversal",
      changedBy: actorId,
      summary: `Reversed ₹${redemption.amount} guest benefit and returned ${redemption.points} points`,
    },
  });
}
export async function reverseBenefit(
  guestId: string,
  bookingId: string,
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM guests WHERE id=${guestId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM bookings WHERE id=${bookingId} FOR UPDATE`;
    const redemption = await tx.guestRedemption.findUnique({
      where: { bookingId },
    });
    if (!redemption || redemption.guestId !== guestId)
      throw new HttpError(404, "Benefit not found");
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });
    if (booking.status === "completed")
      throw new HttpError(409, "Use the refund workflow for completed stays");
    await reverseRedemptionIn(tx, redemption, actorId);
    return { success: true };
  });
}
