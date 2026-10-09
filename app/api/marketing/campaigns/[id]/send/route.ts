import { identityCandidates } from "@/lib/guests/identity";
import { campaignAudience } from "@/lib/guests/retention";
import { requireGuestStaff } from "@/lib/guests/auth";
import { claimGuestContact,personalizeGuestMessage } from "@/lib/guests/retention";
import { toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { campaignSendSchema } from "@/lib/validation";
import { sendBroadcastMessage } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handlePOST(request, { params });
  } catch (err) {
    return toErrorResponse(err, "POST /api/marketing/campaigns/[id]/send");
  }
}

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireGuestStaff(true);
  const { id: campaignId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = campaignSendSchema.safeParse({ ...body, campaignId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { dryRun } = parsed.data;

  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status === "sending" || campaign.status === "completed") {
    return NextResponse.json(
      { error: `Campaign is already ${campaign.status}` },
      { status: 400 },
    );
  }

  // Build target audience query
  const leadWhere: Record<string, unknown> = {};
  leadWhere.status = "active";
  if (campaign.guestIds.length) leadWhere.guestId = { in: campaign.guestIds };
  leadWhere.OR = [{ guestId: null }, { guest: { mergedIntoId: null, doNotContact: false, whatsappConsent: true } }];
  if (campaign.targetTags.length > 0) leadWhere.tags = { hasSome: campaign.targetTags };
  if (campaign.targetSources.length > 0) leadWhere.source = { in: campaign.targetSources };

  const leads = await prisma.userLead.findMany({
    where: leadWhere,
    select: { id: true, phoneNumber: true, name: true, pushName: true, status: true, guestId: true },
  });

  const eligibleIds = campaign.guestIds.length ? new Set((await campaignAudience(campaign.guestIds)).filter(g => g.marketingEligible).map(g => g.guest.id)) : null;
  const eligibleLeads = eligibleIds ? leads.filter(l => l.guestId && eligibleIds.has(l.guestId)) : leads;

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalRecipients: eligibleLeads.length,
      sampleLeads: eligibleLeads.slice(0, 10).map((l) => ({
        phoneNumber: l.phoneNumber,
        name: l.name || l.pushName,
      })),
    });
  }

  // Update campaign status to sending
  const claimed = await prisma.marketingCampaign.updateMany({
    where: { id: campaignId, status: { in: ["draft", "scheduled", "paused"] } },
    data: { status: "sending", startedAt: new Date() },
  });
  if (!claimed.count) return NextResponse.json({ error: "Campaign cannot be sent in its current state" }, { status: 409 });

  // Create campaign logs for all recipients
  await prisma.campaignLog.createMany({
    data: leads.map((lead) => ({
      campaignId,
      leadId: lead.id,
      phoneNumber: lead.phoneNumber,
      status: "pending",
    })),
    skipDuplicates: true,
  });

  // Send messages with delay to avoid rate limiting
  let sentCount = 0;
  let failedCount = 0;
  const delayMs = 2000; // 2 seconds between messages

  let skippedCount = 0;
  for (const lead of leads) {
    let currentLead = await prisma.userLead.findUnique({ where: { id: lead.id } });
    let ambiguousIdentity = false;
    if (currentLead && !currentLead.guestId) {
      const matches = await identityCandidates(prisma, currentLead.phoneNumber);
      ambiguousIdentity = matches.length > 1;
      if (matches.length === 1) currentLead = await prisma.userLead.update({ where: { id: lead.id }, data: { guestId: matches[0] } });
    }
    const currentCampaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId }, select: { status: true } });
    if (currentCampaign?.status !== "sending") break;
    const guestClaim = currentLead?.guestId ? await claimGuestContact(currentLead.guestId, lead.id, campaignId) : null;
    if (!currentLead || currentLead.status !== "active" || ambiguousIdentity || (campaign.guestIds.length && (!currentLead.guestId || !campaign.guestIds.includes(currentLead.guestId))) || (currentLead.guestId && !guestClaim)) {
      skippedCount++;
      await prisma.campaignLog.updateMany({ where: { campaignId, leadId: lead.id, status: "pending" }, data: { status: "opted_out", error: "Suppression, cooldown, quiet hours, daily limit or paused campaign" } });
      continue;
    }
    const previousLog = await prisma.campaignLog.findUnique({ where: { campaignId_leadId: { campaignId, leadId: lead.id } } });
    if (previousLog?.status !== "pending") { skippedCount++; continue; }
    let personalizedMessage = campaign.messageBody;
    const displayName = lead.name || lead.pushName || "";
    personalizedMessage = personalizedMessage.replace(/\{\{name\}\}/g, displayName);

    if (guestClaim) personalizedMessage = personalizeGuestMessage(campaign.messageBody, guestClaim.guest, guestClaim.summary);
    const result = await sendBroadcastMessage(lead.phoneNumber, personalizedMessage);

    if (result.success) {
      sentCount++;
      await prisma.campaignLog.updateMany({
        where: { campaignId, leadId: lead.id },
        data: { status: "sent", sentAt: new Date() },
      });
    } else {
      failedCount++;
      await prisma.campaignLog.updateMany({
        where: { campaignId, leadId: lead.id },
        data: { status: "failed", error: result.error },
      });
    }

    // Update campaign counters periodically
    if ((sentCount + failedCount) % 10 === 0) {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { sentCount, failedCount },
      });
    }

    // Delay between sends
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const counts = await prisma.campaignLog.groupBy({ by: ["status"], where: { campaignId }, _count: { _all: true } });
  sentCount = counts.filter(c => ["sent", "delivered", "read"].includes(c.status)).reduce((sum,c) => sum+c._count._all,0);
  failedCount = counts.filter(c => c.status === "failed").reduce((sum,c) => sum+c._count._all,0);
  // Final update
  const finalState = await prisma.marketingCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  const updated = await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      status: finalState.status === "sending" ? "completed" : finalState.status,
      sentCount,
      failedCount,
      completedAt: finalState.status === "sending" ? new Date() : null,
    },
  });

  return NextResponse.json({
    success: true,
    stats: {
      totalRecipients: leads.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
    },
    campaign: updated,
  });
}
