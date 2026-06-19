import { prisma } from "@/lib/prisma";
import { templateCreateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const templates = await prisma.campaignTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { campaigns: true } },
    },
  });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = templateCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const template = await prisma.campaignTemplate.create({
    data: parsed.data,
  });

  return NextResponse.json({ template }, { status: 201 });
}
