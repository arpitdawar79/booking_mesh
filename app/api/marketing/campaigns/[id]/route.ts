import { prisma } from "@/lib/prisma";
import { campaignUpdateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      template: true,
      logs: {
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { name: true, phoneNumber: true, pushName: true } },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = campaignUpdateSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: _id, scheduledAt, ...updateData } = parsed.data;
  const data: Record<string, unknown> = { ...updateData };
  if (scheduledAt !== undefined) {
    data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  }

  // Recalculate recipients if filters changed
  if (updateData.targetTags || updateData.targetSources || updateData.excludeOptedOut !== undefined) {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
    if (campaign) {
      const leadWhere: Record<string, unknown> = {};
      const excludeOptedOut = updateData.excludeOptedOut ?? campaign.excludeOptedOut;
      const targetTags = updateData.targetTags ?? campaign.targetTags;
      const targetSources = updateData.targetSources ?? campaign.targetSources;

      if (excludeOptedOut) leadWhere.status = "active";
      if (targetTags.length > 0) leadWhere.tags = { hasSome: targetTags };
      if (targetSources.length > 0) leadWhere.source = { in: targetSources };

      data.totalRecipients = await prisma.userLead.count({ where: leadWhere });
    }
  }

  const campaign = await prisma.marketingCampaign.update({
    where: { id },
    data: data as any,
  });

  return NextResponse.json({ campaign });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status === "sending") {
    return NextResponse.json(
      { error: "Cannot delete a campaign that is currently sending" },
      { status: 400 },
    );
  }

  await prisma.marketingCampaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
