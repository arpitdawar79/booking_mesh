import { prisma } from "../prisma";
import { getProgram } from "./rewards";
import { normalizeContactPhone } from "../phone-normalize";
import { guestInclude, summarizeGuest } from "./insights";
import { identityCandidates } from "./identity";
export async function campaignAudience(ids: string[]) {
  const program = await getProgram(),
    guests = await prisma.guest.findMany({
      where: { id: { in: ids }, mergedIntoId: null },
      include: guestInclude,
    });
  return guests.map((g) => ({ guest: g, ...summarizeGuest(g, program) }));
}
export function personalizeGuestMessage(
  message: string,
  g: { name: string; referralCode: string },
  summary: {
    tier: { name: string };
    wallet: number;
    stats: { preferredRoomType: string | null };
  },
) {
  const values: Record<string, string> = {
    name: g.name,
    first_name: g.name.split(" ")[0],
    tier: summary.tier.name,
    points: String(summary.wallet),
    preferred_room: summary.stats.preferredRoomType || "your favorite room",
    referral_code: g.referralCode,
  };
  return message.replace(
    /\{\{(name|first_name|tier|points|preferred_room|referral_code)\}\}/g,
    (_, key: string) => values[key],
  );
}
// Called immediately before delivery. Locking prevents competing campaigns from
// claiming the same guest during the cooldown window.
export async function claimGuestContact(
  guestId: string,
  leadId: string,
  campaignId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM guests WHERE id=${guestId} FOR UPDATE`;
    const g = await tx.guest.findUnique({
      where: { id: guestId },
      include: guestInclude,
    });
    const lead = await tx.userLead.findUnique({ where: { id: leadId } }),
      program = await getProgram(tx);
    if (
      !g ||
      g.mergedIntoId ||
      !lead ||
      lead.status !== "active" ||
      lead.guestId !== guestId ||
      normalizeContactPhone(g.phone || "") !== lead.phoneNumber
    )
      return null;
    const summary = summarizeGuest(g, program);
    if (!summary.marketingEligible) return null;
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hourCycle: "h23",
        timeZone: "Asia/Kolkata",
      }).format(new Date()),
    );
    if (hour < 9 || hour >= 20) return null;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(970901)`;
    const istDate = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(new Date());
    const today = new Date(`${istDate}T00:00:00+05:30`);
    const count = await tx.guestActivity.count({
      where: { createdAt: { gte: today }, kind: "marketing" },
    });
    if (count >= 50) return null;
    const log = await tx.campaignLog.findUnique({
      where: { campaignId_leadId: { campaignId, leadId } },
    });
    if (log?.status !== "pending") return null;
    const campaign = await tx.marketingCampaign.findUnique({
      where: { id: campaignId },
    });
    if (campaign?.status !== "sending") return null;
    await tx.guest.update({
      where: { id: guestId },
      data: { lastMarketingAt: new Date() },
    });
    await tx.guestActivity.create({
      data: {
        guestId,
        kind: "marketing",
        summary: `Campaign delivery attempted: ${campaign.name}`,
        metadata: { campaignId },
      },
    });
    return { guest: g, summary };
  });
}
export async function linkBookingLeads() {
  const guests = await prisma.guest.findMany({
    where: { mergedIntoId: null, phone: { not: null } },
    select: { id: true, phone: true },
  });
  let linked = 0;
  for (const g of guests) {
    const phone = normalizeContactPhone(g.phone!);
    if (!phone) continue;
    const ids = await identityCandidates(prisma, phone);
    if (ids.length === 1 && ids[0] === g.id) {
      const result = await prisma.userLead.updateMany({
        where: { phoneNumber: phone, guestId: null },
        data: { guestId: g.id },
      });
      linked += result.count;
    }
  }
  return linked;
}
