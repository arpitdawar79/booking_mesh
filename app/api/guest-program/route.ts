import { NextResponse } from "next/server";
import { requireGuestStaff } from "@/lib/guests/auth";
import { getProgram } from "@/lib/guests/rewards";
import { programSchema, offerSchema } from "@/lib/guests/validation";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function GET() {
  try {
    const user = await requireGuestStaff();
    return NextResponse.json({
      program: await getProgram(),
      offers: await prisma.guestOffer.findMany({
        orderBy: { createdAt: "desc" },
      }),
      canManage: user.role !== "staff",
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireGuestStaff(true),
      parsed = programSchema.safeParse(await request.json());
    if (!parsed.success)
      throw new HttpError(
        400,
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    await prisma.$transaction(async (tx) => {
      await tx.appConfig.upsert({
        where: { key: "guest.program" },
        create: { key: "guest.program", value: JSON.stringify(parsed.data) },
        update: { value: JSON.stringify(parsed.data) },
      });
      await tx.appConfig.upsert({
        where: { key: "guest.program.updatedBy" },
        create: {
          key: "guest.program.updatedBy",
          value: JSON.stringify({ actorId: user.id, at: new Date() }),
        },
        update: { value: JSON.stringify({ actorId: user.id, at: new Date() }) },
      });
    });
    return NextResponse.json({ program: parsed.data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
export async function POST(request: Request) {
  try {
    await requireGuestStaff(true);
    const parsed = offerSchema.safeParse(await request.json());
    if (!parsed.success)
      throw new HttpError(
        400,
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    const offer = await prisma.guestOffer.create({
      data: {
        ...parsed.data,
        startsAt: new Date(parsed.data.startsAt),
        expiresAt: new Date(parsed.data.expiresAt),
      },
    });
    return NextResponse.json({ offer }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
