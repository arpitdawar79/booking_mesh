import { prisma } from "@/lib/prisma";
import { leadTagSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (source) where.source = source;
  if (status) where.status = status;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search } },
      { pushName: { contains: search, mode: "insensitive" } },
      { sourceGroupName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.userLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.userLead.count({ where }),
  ]);

  return NextResponse.json({
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = leadTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { leadIds, tag, action } = parsed.data;

  if (action === "add") {
    await prisma.userLead.updateMany({
      where: { id: { in: leadIds } },
      data: { tags: { push: tag } },
    });
  } else {
    const leads = await prisma.userLead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, tags: true },
    });
    for (const lead of leads) {
      await prisma.userLead.update({
        where: { id: lead.id },
        data: { tags: lead.tags.filter((t) => t !== tag) },
      });
    }
  }

  return NextResponse.json({ success: true });
}
