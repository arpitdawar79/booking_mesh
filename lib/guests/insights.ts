import { matchesDiscovery, discoverySegments } from "./discovery";
import { prisma } from "../prisma";
import { guestStats, guestTier, nextActions, rewardLots } from "./core";
import { getProgram } from "./rewards";
import type { Prisma } from "@prisma/client";
export const guestInclude = {
  contacts: true,
  bookings: { include: { payments: true }, orderBy: { checkInDate: "desc" } },
  feedback: { orderBy: { createdAt: "desc" } },
  rewards: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  leads: {
    select: {
      id: true,
      status: true,
      phoneNumber: true,
      source: true,
      sourceGroupName: true,
    },
  },
} satisfies Prisma.GuestInclude;
export type RichGuest = Prisma.GuestGetPayload<{
  include: typeof guestInclude;
}>;
export function summarizeGuest(
  g: RichGuest,
  program: Awaited<ReturnType<typeof getProgram>>,
  now = new Date(),
) {
  const stats = guestStats(g.bookings, now),
    lots = rewardLots(g.rewards, now);
  const openFeedback = g.feedback.filter(
    (f) => f.status === "open" && (f.followUp || f.rating <= 3),
  ).length;
  const settled = g.bookings.filter(
    (b) =>
      b.status === "completed" &&
      b.checkOutDate <= now &&
      Number(b.totalAmount) > 0 &&
      Number(b.amountPaidOnline) +
        b.payments.reduce(
          (s, p) => s + Number(p.amount) * (p.isRefund ? -1 : 1),
          0,
        ) >=
        Number(b.totalAmount),
  ).length;
  const tier = guestTier(settled, program);
  const actions = nextActions(
    {
      ...g,
      stats,
      wallet: lots.balance,
      openFeedback,
      expiringPoints: lots.expiring.reduce((s, l) => s + l.points, 0),
    },
    program,
    now,
  );
  const segments = [
    stats.lifecycle,
    ...(actions.some((a) => a.kind === "win_back") ? ["win_back"] : []),
    ...(actions.some((a) => a.kind === "birthday") ? ["birthday"] : []),
    ...(openFeedback ? ["service_recovery"] : []),
    ...(lots.balance > 0 ? ["rewards"] : []),
  ];
  const reachable =
    g.whatsappConsent &&
    !g.doNotContact &&
    !!g.phone &&
    !g.leads.some((l) => l.status !== "active");
  const cooldown =
    !!g.lastMarketingAt &&
    now.getTime() - g.lastMarketingAt.getTime() <
      program.cooldownDays * 86400000;
  return {
    stats,
    tier,
    wallet: lots.balance,
    expiringPoints: lots.expiring.reduce((s, l) => s + l.points, 0),
    openFeedback,
    actions,
    segments: [
      ...segments,
      ...discoverySegments({
        ...g,
        expiringPoints: lots.expiring.reduce((s, l) => s + l.points, 0),
        marketingEligible: reachable && !cooldown,
      }),
    ],
    marketingEligible: reachable && !cooldown,
    exclusionReason: g.doNotContact
      ? "Do not contact"
      : !g.whatsappConsent
        ? "WhatsApp consent missing"
        : !g.phone
          ? "Phone missing"
          : !reachable
            ? "Contact suppressed"
            : cooldown
              ? "Contact cooldown"
              : null,
  };
}
export async function guestDirectory(
  where: Prisma.GuestWhereInput = {},
  now = new Date(),
  search = "",
) {
  const program = await getProgram();
  const guests = await prisma.guest.findMany({
    where: { ...where, mergedIntoId: null },
    include: guestInclude,
    orderBy: { updatedAt: "desc" },
  });
  return {
    program,
    guests: guests
      .filter((g) => matchesDiscovery(g, search))
      .map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        email: g.email,
        city: g.city,
        tags: g.tags,
        birthday: g.birthday,
        referralCode: g.referralCode,
        createdAt: g.createdAt,
        _count: { bookings: g.bookings.length },
        ...summarizeGuest(g, program, now),
      })),
  };
}
