import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuestStaff } from "@/lib/guests/auth";
import {
  campaignAudience,
  personalizeGuestMessage,
  linkBookingLeads,
} from "@/lib/guests/retention";
import { normalizeContactPhone } from "@/lib/phone-normalize";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function POST(request: Request) {
  try {
    const user = await requireGuestStaff(true),
      body = await request.json();
    if (body.action === "link_leads")
      return NextResponse.json({ linked: await linkBookingLeads() });
    const p = z
      .object({
        guestIds: z.array(z.string().min(1)).min(1).max(100),
        name: z.string().trim().min(1).max(120),
        message: z.string().trim().min(1).max(4000),
        preview: z.boolean().default(true),
      })
      .safeParse(body);
    if (!p.success)
      throw new HttpError(
        400,
        "Choose 1–100 guests and provide a campaign name and message",
      );
    const audience = await campaignAudience([...new Set(p.data.guestIds)]);
    const eligible = audience.filter((g) => g.marketingEligible);
    if (p.data.preview)
      return NextResponse.json({
        eligible: eligible.length,
        excluded: audience
          .filter((g) => !g.marketingEligible)
          .map((g) => ({
            id: g.guest.id,
            name: g.guest.name,
            reason: g.exclusionReason,
          })),
        samples: eligible
          .slice(0, 10)
          .map((g) => ({
            id: g.guest.id,
            name: g.guest.name,
            message: personalizeGuestMessage(p.data.message, g.guest, g),
          })),
      });
    if (!eligible.length)
      throw new HttpError(
        400,
        "No guests have WhatsApp consent and are outside the contact cooldown",
      );
    const campaign = await prisma.$transaction(async (tx) => {
      for (const row of eligible) {
        const phone = normalizeContactPhone(row.guest.phone!)!;
        const lead = await tx.userLead.findUnique({
          where: { phoneNumber: phone },
        });
        if (lead?.guestId && lead.guestId !== row.guest.id)
          throw new HttpError(
            409,
            "A campaign contact is linked to a different guest",
          );
        await tx.userLead.upsert({
          where: { phoneNumber: phone },
          create: {
            phoneNumber: phone,
            name: row.guest.name,
            guestId: row.guest.id,
            source: "booking_guest",
          },
          update: { guestId: row.guest.id },
        });
      }
      return tx.marketingCampaign.create({
        data: {
          name: p.data.name,
          messageBody: p.data.message,
          guestIds: eligible.map((g) => g.guest.id),
          excludeOptedOut: true,
          createdBy: user.id,
          totalRecipients: eligible.length,
          status: "draft",
        },
      });
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
