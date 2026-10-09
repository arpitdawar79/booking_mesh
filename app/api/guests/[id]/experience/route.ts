import { NextResponse } from "next/server";
import { z } from "zod";
import { requireGuestStaff } from "@/lib/guests/auth";
import { issueGuestLink } from "@/lib/guests/experience";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireGuestStaff(),
      { id } = await params,
      p = z
        .object({
          scope: z.enum(["feedback", "preferences"]),
          bookingId: z.string().optional(),
        })
        .safeParse(await request.json());
    if (!p.success) throw new HttpError(400, "Invalid invitation");
    return NextResponse.json(
      await issueGuestLink(
        id,
        p.data.scope,
        p.data.bookingId,
        user.id,
        new URL(request.url).origin,
      ),
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireGuestStaff(),
      { id } = await params,
      p = z
        .object({
          feedbackId: z.string().min(1),
          resolution: z.string().trim().min(5).max(2000),
        })
        .safeParse(await request.json());
    if (!p.success)
      throw new HttpError(
        400,
        "Provide a resolution of at least five characters",
      );
    const result = await prisma.$transaction(async (tx) => {
      const feedback = await tx.guestFeedback.findFirst({
        where: { id: p.data.feedbackId, guestId: id },
      });
      if (!feedback) throw new HttpError(404, "Feedback not found");
      const f = await tx.guestFeedback.update({
        where: { id: feedback.id },
        data: {
          status: "resolved",
          resolution: p.data.resolution,
          resolvedAt: new Date(),
          resolvedBy: user.id,
        },
      });
      await tx.guestActivity.create({
        data: {
          guestId: id,
          kind: "service_recovery",
          summary: "Feedback resolved",
          actorId: user.id,
        },
      });
      return f;
    });
    return NextResponse.json({ feedback: result });
  } catch (err) {
    return toErrorResponse(err);
  }
}
