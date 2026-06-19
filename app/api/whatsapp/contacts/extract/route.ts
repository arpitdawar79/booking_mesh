import { prisma } from "@/lib/prisma";
import { extractContactsSchema } from "@/lib/validation";
import { enrichContactProfile, extractGroupContacts } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = extractContactsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        ),
      },
      { status: 400 },
    );
  }

  const { enrichProfiles, groupIds } = parsed.data;

  const result = await extractGroupContacts(groupIds);
  if (result === null) {
    return NextResponse.json(
      { error: "WhatsApp not connected" },
      { status: 503 },
    );
  }

  const { contacts, groupsScanned } = result;
  let newCount = 0;
  let updatedCount = 0;
  let enrichedCount = 0;

  for (const contact of contacts) {
    const existing = await prisma.userLead.findUnique({
      where: { phoneNumber: contact.phoneNumber },
    });

    if (existing) {
      const updateData: Record<string, unknown> = {
        pushName: contact.pushName || existing.pushName,
        isGroupAdmin: contact.isAdmin || existing.isGroupAdmin,
        lastSeenAt: new Date(),
      };

      if (
        existing.source === "manual_entry" ||
        existing.source === "booking_guest"
      ) {
        // Don't override manually-set sources, but add group info
      } else {
        updateData.source = "group_member";
        updateData.sourceGroupId = contact.sourceGroupId;
        updateData.sourceGroupName = contact.sourceGroupName;
      }

      await prisma.userLead.update({
        where: { id: existing.id },
        data: updateData,
      });
      updatedCount++;
    } else {
      await prisma.userLead.create({
        data: {
          phoneNumber: contact.phoneNumber,
          name: contact.name,
          pushName: contact.pushName,
          source: "group_member",
          sourceGroupId: contact.sourceGroupId,
          sourceGroupName: contact.sourceGroupName,
          isGroupAdmin: contact.isAdmin,
          isWhatsAppUser: true,
        },
      });
      newCount++;
    }
  }

  // Enrich profiles (batch with delay to avoid rate limiting)
  if (enrichProfiles && contacts.length > 0) {
    const batchSize = 10;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (contact) => {
          try {
            const profile = await enrichContactProfile(contact.jid);
            await prisma.userLead.updateMany({
              where: { phoneNumber: contact.phoneNumber },
              data: {
                profilePicUrl: profile.profilePicUrl,
                aboutText: profile.aboutText,
                isWhatsAppUser: profile.isWhatsAppUser,
                lastEnrichedAt: new Date(),
              },
            });
            enrichedCount++;
          } catch {
            // Skip enrichment failures
          }
        }),
      );
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < contacts.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  return NextResponse.json({
    success: true,
    stats: {
      totalExtracted: contacts.length,
      newContacts: newCount,
      updatedContacts: updatedCount,
      enrichedProfiles: enrichedCount,
      groupsScanned,
    },
  });
}
