import { prisma } from "@/lib/prisma";
import { campaignSendSchema } from "@/lib/validation";
import { sendBroadcastMessage } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  if (campaign.excludeOptedOut) leadWhere.status = "active";
  if (campaign.targetTags.length > 0) leadWhere.tags = { hasSome: campaign.targetTags };
  if (campaign.targetSources.length > 0) leadWhere.source = { in: campaign.targetSources };

  const leads = await prisma.userLead.findMany({
    where: leadWhere,
    select: { id: true, phoneNumber: true, name: true, pushName: true, status: true },
  });

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      totalRecipients: leads.length,
      sampleLeads: leads.slice(0, 10).map((l) => ({
        phoneNumber: l.phoneNumber,
        name: l.name || l.pushName,
      })),
    });
  }

  // Update campaign status to sending
  await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: { status: "sending", startedAt: new Date() },
  });

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

  for (const lead of leads) {
    let personalizedMessage = campaign.messageBody;
    const displayName = lead.name || lead.pushName || "";
    personalizedMessage = personalizedMessage.replace(/\{\{name\}\}/g, displayName);

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

  // Final update
  const updated = await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      status: "completed",
      sentCount,
      failedCount,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    stats: {
      totalRecipients: leads.length,
      sent: sentCount,
      failed: failedCount,
    },
    campaign: updated,
  });
}
