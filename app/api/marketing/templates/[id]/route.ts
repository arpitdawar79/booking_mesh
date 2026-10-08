import { toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { templateUpdateSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handleGET(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "GET /api/marketing/templates/[id]");
  }
}

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const template = await prisma.campaignTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({ template });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handlePATCH(request, { params });
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/marketing/templates/[id]");
  }
}

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = templateUpdateSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: _id, ...updateData } = parsed.data;
  const template = await prisma.campaignTemplate.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ template });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handleDELETE(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/marketing/templates/[id]");
  }
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.campaignTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
