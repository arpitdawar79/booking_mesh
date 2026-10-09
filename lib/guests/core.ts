import { normalizeContactPhone } from "../phone-normalize";

export const DEFAULT_PROGRAM = {
  enabled: false,
  pointsPer100: 10,
  rupeesPerPoint: 0.1,
  referralPoints: 500,
  minimumSpend: 1000,
  expiryDays: 365,
  maxDiscountPercent: 15,
  silverStays: 2,
  goldStays: 5,
  platinumStays: 10,
  silverPercent: 2,
  goldPercent: 5,
  platinumPercent: 8,
  winBackDays: 120,
  secondStayDays: 45,
  cooldownDays: 14,
  benefits: ["Personalized welcome", "Priority room preference"],
};
export type GuestProgram = typeof DEFAULT_PROGRAM;
export interface Stay {
  id: string;
  status: string;
  currency: string;
  checkInDate: Date;
  checkOutDate: Date;
  nightCount: number;
  roomType: string;
  totalAmount: unknown;
  amountPaidOnline: unknown;
  payments: { amount: unknown; isRefund: boolean }[];
}
export const roundMoney = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() || null;
export function netPaid(b: Pick<Stay, "amountPaidOnline" | "payments">) {
  return roundMoney(
    Number(b.amountPaidOnline) +
      b.payments.reduce(
        (s, p) => s + Number(p.amount) * (p.isRefund ? -1 : 1),
        0,
      ),
  );
}
export function completedStay(b: Stay, now: Date) {
  return b.status === "completed" && b.checkOutDate <= now;
}
export function qualifyPoints(
  b: Stay,
  program: GuestProgram,
  now = new Date(),
) {
  const paid = netPaid(b);
  if (
    !program.enabled ||
    b.currency !== "INR" ||
    !completedStay(b, now) ||
    paid < Number(b.totalAmount) ||
    paid < program.minimumSpend
  )
    return 0;
  return Math.floor(
    (Math.min(paid, Number(b.totalAmount)) * program.pointsPer100) / 100,
  );
}
export function guestStats(bookings: Stay[], now = new Date()) {
  const stays = bookings.filter((b) => completedStay(b, now));
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.checkOutDate > now,
  );
  const roomTypes: Record<string, number> = {};
  for (const stay of stays)
    roomTypes[stay.roomType] = (roomTypes[stay.roomType] || 0) + 1;
  const totalNights = stays.reduce((s, b) => s + b.nightCount, 0);
  const totalRevenue = roundMoney(
    stays
      .filter((b) => b.currency === "INR")
      .reduce((s, b) => s + Number(b.totalAmount), 0),
  );
  const netRevenue = roundMoney(
    stays
      .filter((b) => b.currency === "INR")
      .reduce((s, b) => s + Math.max(0, netPaid(b)), 0),
  );
  const lastStay = stays.length
    ? new Date(Math.max(...stays.map((b) => b.checkOutDate.getTime())))
    : null;
  const firstStay = stays.length
    ? new Date(Math.min(...stays.map((b) => b.checkInDate.getTime())))
    : null;
  return {
    totalStays: stays.length,
    totalNights,
    totalRevenue,
    netRevenue,
    avgStayLength: stays.length ? roundMoney(totalNights / stays.length) : 0,
    preferredRoomType:
      Object.entries(roomTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    lastStay,
    firstStay,
    daysSinceLastStay: lastStay
      ? Math.floor((now.getTime() - lastStay.getTime()) / 86400000)
      : null,
    upcomingStays: upcoming.length,
    lifecycle: upcoming.length
      ? "upcoming"
      : stays.length > 1
        ? "returning"
        : stays.length === 1
          ? "first_time"
          : "prospect",
    otherCurrencies: [
      ...new Set(
        stays.filter((b) => b.currency !== "INR").map((b) => b.currency),
      ),
    ],
  };
}
export function guestTier(stays: number, p: GuestProgram) {
  if (stays >= p.platinumStays)
    return { name: "Platinum", percent: p.platinumPercent };
  if (stays >= p.goldStays) return { name: "Gold", percent: p.goldPercent };
  if (stays >= p.silverStays)
    return { name: "Silver", percent: p.silverPercent };
  return { name: "Member", percent: 0 };
}
export function matchingGuestIds(
  guests: { id: string; phone: string | null; email: string | null }[],
  phone?: string | null,
  email?: string | null,
) {
  const p = phone ? normalizeContactPhone(phone) : null,
    e = normalizeEmail(email);
  return [
    ...new Set(
      guests
        .filter(
          (g) =>
            (p && g.phone && normalizeContactPhone(g.phone) === p) ||
            (e && normalizeEmail(g.email) === e),
        )
        .map((g) => g.id),
    ),
  ];
}
// Entries must be chronological. Debits consume the earliest-expiring unspent lots.
export function rewardLots(
  entries: { id: string; points: number; expiresAt: Date | null }[],
  now = new Date(),
) {
  const lots: { id: string; points: number; expiresAt: Date | null }[] = [];
  let debt = 0;
  for (const entry of entries) {
    if (entry.points > 0) {
      const offset = Math.min(debt, entry.points);
      debt -= offset;
      lots.push({ ...entry, points: entry.points - offset });
    } else {
      let debit = -entry.points;
      lots.sort(
        (a, b) =>
          (a.expiresAt?.getTime() ?? Infinity) -
          (b.expiresAt?.getTime() ?? Infinity),
      );
      for (const lot of lots) {
        const consumed = Math.min(debit, lot.points);
        lot.points -= consumed;
        debit -= consumed;
        if (!debit) break;
      }
      debt += debit;
    }
  }
  const expired = lots
    .filter((l) => l.points > 0 && l.expiresAt && l.expiresAt <= now)
    .map((l) => ({ id: l.id, points: l.points }));
  return {
    balance:
      lots.reduce(
        (sum, l) => sum + (l.expiresAt && l.expiresAt <= now ? 0 : l.points),
        0,
      ) - debt,
    expired,
    expiring: lots.filter(
      (l) =>
        l.points > 0 &&
        l.expiresAt &&
        l.expiresAt > now &&
        l.expiresAt.getTime() - now.getTime() <= 30 * 86400000,
    ),
  };
}
export function discountQuote(
  input: {
    total: number;
    netPaid: number;
    points: number;
    balance: number;
    percent: number;
    offerCap?: number;
  },
  p: GuestProgram,
) {
  if (!p.enabled) throw new Error("Guest rewards program is disabled");
  if (
    input.points < 0 ||
    !Number.isInteger(input.points) ||
    input.points > Math.max(0, input.balance)
  )
    throw new Error("Insufficient points");
  if (input.points && input.percent)
    throw new Error("Discounts cannot stack with points");
  const cap = Math.max(
    0,
    Math.min(
      (input.total * p.maxDiscountPercent) / 100,
      input.total - input.netPaid,
      input.offerCap ?? Infinity,
    ),
  );
  const amount = roundMoney(
    Math.min(
      cap,
      input.points
        ? input.points * p.rupeesPerPoint
        : (input.total * input.percent) / 100,
    ),
  );
  const points = input.points
    ? Math.min(input.points, Math.ceil(amount / p.rupeesPerPoint))
    : 0;
  return { amount, points };
}
export type GuestStats = ReturnType<typeof guestStats>;
export interface NextAction {
  kind: string;
  title: string;
  reason: string;
  priority: number;
  message: string;
  marketing: boolean;
}
function istMonthDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function nextActions(
  g: {
    stats: GuestStats;
    birthday: Date | null;
    doNotContact: boolean;
    whatsappConsent: boolean;
    emailConsent: boolean;
    openFeedback: number;
    wallet: number;
    expiringPoints?: number;
  },
  p: GuestProgram,
  now = new Date(),
): NextAction[] {
  const actions: NextAction[] = [];
  if (g.openFeedback)
    actions.push({
      kind: "service_recovery",
      title: "Resolve guest feedback",
      reason: `${g.openFeedback} feedback item(s) need follow-up.`,
      priority: 100,
      message: "",
      marketing: false,
    });
  if (g.doNotContact || (!g.whatsappConsent && !g.emailConsent)) return actions;
  if (g.birthday && istMonthDay(g.birthday) === istMonthDay(now))
    actions.push({
      kind: "birthday",
      title: "Celebrate their birthday",
      reason: "Birthday is today (India time).",
      priority: 80,
      message:
        "Happy birthday, {{name}}! Wishing you a wonderful year from The Stream by Ekantah.",
      marketing: true,
    });
  if (g.stats.upcomingStays) return actions;
  const days = g.stats.daysSinceLastStay;
  if (days !== null && days >= p.winBackDays)
    actions.push({
      kind: "win_back",
      title: "Invite them back",
      reason: `${days} days since their last completed stay.`,
      priority: g.stats.totalStays > 1 ? 75 : 60,
      message:
        "Hi {{name}}, we would love to welcome you back to The Stream. Shall we help you plan another escape to Tirthan Valley?",
      marketing: true,
    });
  else if (
    g.stats.totalStays === 1 &&
    days !== null &&
    days >= p.secondStayDays
  )
    actions.push({
      kind: "second_stay",
      title: "Make the second stay happen",
      reason: `First stay completed ${days} days ago; no upcoming reservation.`,
      priority: 65,
      message:
        "Hi {{name}}, we hope your first stay at The Stream was memorable. Let us help you plan your next visit!",
      marketing: true,
    });
  if (p.enabled && (g.expiringPoints || 0) > 0)
    actions.push({
      kind: "expiring_rewards",
      title: "Help them use expiring rewards",
      reason: `${g.expiringPoints} points expire within 30 days.`,
      priority: 70,
      message:
        "Hi {{name}}, some of your loyalty points expire soon. Would you like help planning your next visit to The Stream?",
      marketing: true,
    });
  if (p.enabled && g.wallet > 0)
    actions.push({
      kind: "rewards",
      title: "Remind them of their rewards",
      reason: `${g.wallet} available loyalty points.`,
      priority: 50,
      message:
        "Hi {{name}}, you have {{points}} loyalty points to use on your next stay at The Stream. Contact us to check available dates.",
      marketing: true,
    });
  if (
    g.stats.firstStay &&
    istMonthDay(g.stats.firstStay) === istMonthDay(now) &&
    now.getTime() - g.stats.firstStay.getTime() > 300 * 86400000
  )
    actions.push({
      kind: "anniversary",
      title: "Celebrate their first visit",
      reason: "Anniversary of their first stay.",
      priority: 55,
      message:
        "Hi {{name}}, today reminds us of your first visit to The Stream. We would love to see you again!",
      marketing: true,
    });
  return actions.sort((a, b) => b.priority - a.priority);
}
