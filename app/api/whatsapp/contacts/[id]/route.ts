import { toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { leadUpdateSchema } from "@/lib/validation";
import { enrichContactProfile } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handleGET(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "GET /api/whatsapp/contacts/[id]");
  }
}

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lead = await prisma.userLead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json({ lead });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handlePATCH(request, { params });
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/whatsapp/contacts/[id]");
  }
}

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = leadUpdateSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: _id, email, ...updateData } = parsed.data;
  const data: Record<string, unknown> = { ...updateData };
  if (email !== undefined) data.email = email || null;

  const lead = await prisma.userLead.update({
    where: { id },
    data,
  });

  return NextResponse.json({ lead });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handleDELETE(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/whatsapp/contacts/[id]");
  }
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.userLead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await handlePUT(_request, { params });
  } catch (err) {
    return toErrorResponse(err, "PUT /api/whatsapp/contacts/[id]");
  }
}

async function handlePUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const lead = await prisma.userLead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const jid = `${lead.phoneNumber}@s.whatsapp.net`;
  const profile = await enrichContactProfile(jid);

  const updated = await prisma.userLead.update({
    where: { id },
    data: {
      profilePicUrl: profile.profilePicUrl,
      aboutText: profile.aboutText,
      isWhatsAppUser: profile.isWhatsAppUser,
      lastEnrichedAt: new Date(),
    },
  });

  return NextResponse.json({ lead: updated });
}
