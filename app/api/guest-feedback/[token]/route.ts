import { NextResponse } from "next/server";
import { z } from "zod";
import { feedbackSchema } from "@/lib/guests/validation";
import {
  validGuestLink,
  reviewUrl,
  hashGuestToken,
} from "@/lib/guests/experience";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params,
      link = await validGuestLink(token);
    return NextResponse.json(
      {
        name: link.guest.name.split(" ")[0],
        scope: link.scope,
        submitted: !!link.usedAt,
        googleReviewUrl: link.scope === "feedback" ? reviewUrl() : null,
        preferences:
          link.scope === "preferences"
            ? {
                whatsappConsent: link.guest.whatsappConsent,
                emailConsent: link.guest.emailConsent,
                doNotContact: link.guest.doNotContact,
              }
            : null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params,
      link = await validGuestLink(token),
      body = await request.json();
    const parsed =
      link.scope === "feedback"
        ? feedbackSchema.safeParse(body)
        : z
            .object({
              whatsappConsent: z.boolean(),
              emailConsent: z.boolean(),
              doNotContact: z.boolean(),
            })
            .safeParse(body);
    if (!parsed.success)
      throw new HttpError(400, "Please check the form fields");
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM guest_links WHERE token_hash=${hashGuestToken(token)} FOR UPDATE`;
      const current = await tx.guestLink.findUniqueOrThrow({
        where: { id: link.id },
      });
      if (current.usedAt || current.expiresAt <= new Date())
        throw new HttpError(
          409,
          "This form was already submitted or has expired",
        );
      if (link.scope === "feedback") {
        const p = feedbackSchema.parse(body);
        const booking = await tx.booking.findUnique({
          where: { id: link.bookingId! },
        });
        if (
          !booking ||
          booking.status !== "completed" ||
          booking.checkOutDate > new Date() ||
          booking.guestId !== link.guestId
        )
          throw new HttpError(409, "Stay is no longer eligible for feedback");
        if (
          await tx.guestFeedback.findUnique({
            where: { bookingId: link.bookingId! },
          })
        )
          throw new HttpError(
            409,
            "Feedback has already been received for this stay",
          );
        await tx.guestFeedback.create({
          data: {
            guestId: link.guestId,
            bookingId: link.bookingId!,
            ...p,
            status: p.followUp || p.rating <= 3 ? "open" : "reviewed",
          },
        });
        await tx.guestActivity.create({
          data: {
            guestId: link.guestId,
            kind: "feedback",
            summary: `Guest feedback received: ${p.rating}/5${p.followUp ? " • follow-up requested" : ""}`,
          },
        });
      } else {
        const p = z
          .object({
            whatsappConsent: z.boolean(),
            emailConsent: z.boolean(),
            doNotContact: z.boolean(),
          })
          .parse(body);
        await tx.guest.update({ where: { id: link.guestId }, data: p });
        if (p.doNotContact || !p.whatsappConsent)
          await tx.userLead.updateMany({
            where: { guestId: link.guestId },
            data: { status: "opted_out" },
          });
        await tx.guestActivity.create({
          data: {
            guestId: link.guestId,
            kind: "consent",
            summary: "Guest updated communication preferences",
          },
        });
      }
      await tx.guestLink.update({
        where: { id: link.id },
        data: { usedAt: new Date() },
      });
    });
    return NextResponse.json({
      success: true,
      googleReviewUrl: link.scope === "feedback" ? reviewUrl() : null,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
