import { toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { templateCreateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return await handleGET();
  } catch (err) {
    return toErrorResponse(err, "GET /api/marketing/templates");
  }
}

async function handleGET() {
  const templates = await prisma.campaignTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { campaigns: true } },
    },
  });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  try {
    return await handlePOST(request);
  } catch (err) {
    return toErrorResponse(err, "POST /api/marketing/templates");
  }
}

async function handlePOST(request: Request) {
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
