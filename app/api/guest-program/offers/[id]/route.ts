import { NextResponse } from "next/server";
import { z } from "zod";
import { requireGuestStaff } from "@/lib/guests/auth";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireGuestStaff(true);
    const { id } = await params,
      p = z.object({ enabled: z.boolean() }).safeParse(await request.json());
    if (!p.success)
      throw new HttpError(400, "Specify whether the offer is enabled");
    const offer = await prisma.guestOffer.update({
      where: { id },
      data: p.data,
    });
    return NextResponse.json({ offer });
  } catch (err) {
    return toErrorResponse(err);
  }
}
