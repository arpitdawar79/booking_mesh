import { prisma } from "@/lib/prisma";
import { campaignCreateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [campaigns, total] = await Promise.all([
    prisma.marketingCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        template: { select: { id: true, name: true } },
        _count: { select: { logs: true } },
      },
    }),
    prisma.marketingCampaign.count({ where }),
  ]);

  return NextResponse.json({
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { scheduledAt, ...createData } = parsed.data;
  const data: Record<string, unknown> = { ...createData };
  if (scheduledAt) {
    data.scheduledAt = new Date(scheduledAt);
    data.status = "scheduled";
  }

  // Calculate total recipients based on filters
  const leadWhere: Record<string, unknown> = {};
  if (createData.excludeOptedOut) {
    leadWhere.status = "active";
  }
  if (createData.targetTags.length > 0) {
    leadWhere.tags = { hasSome: createData.targetTags };
  }
  if (createData.targetSources.length > 0) {
    leadWhere.source = { in: createData.targetSources };
  }
  const totalRecipients = await prisma.userLead.count({ where: leadWhere });
  data.totalRecipients = totalRecipients;

  const campaign = await prisma.marketingCampaign.create({
    data: data as any,
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
