import { requireContactImportSession } from "@/lib/contact-import-auth";
import { buildImportMetadata } from "@/lib/contact-import-metadata";
import { HttpError, toErrorResponse } from "@/lib/http-error";
import { normalizeContactPhone } from "@/lib/phone-normalize";
import { prisma } from "@/lib/prisma";
import { importPhoneContactsSchema } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { NextRequest, NextResponse } from "next/server";

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    return await handlePOST(request);
  } catch (err) {
    return toErrorResponse(err, "POST /api/leads/import");
  }
}

async function handlePOST(request: NextRequest) {
  const user = await requireContactImportSession(request);
  const body = await request.json().catch(() => ({}));
  const parsed = importPhoneContactsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: "Invalid input",
      details: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    }, {status: 400});
  }

  const byPhone = new Map<string, {phone: string; name?: string; email?: string}>();
  let invalid = 0;
  for (const contact of parsed.data.contacts) {
    const phone = normalizeContactPhone(contact.phone);
    if (!phone) { invalid++; continue; }
    const existing = byPhone.get(phone);
    if (existing) {
      existing.name ||= contact.name || undefined;
      existing.email ||= contact.email || undefined;
    } else {
      byPhone.set(phone, {phone, name: contact.name || undefined, email: contact.email || undefined});
    }
  }

  const contacts = [...byPhone.values()];
  const importId = parsed.data.importContext?.id ?? randomUUID();
  const metadata = buildImportMetadata(request.headers, parsed.data.importContext, process.env.CONTACT_IMPORT_IP_HEADER);

  // Save the leads and their provenance together: no lead is committed without a link.
  const counts = await prisma.$transaction(async (tx) => {
    const snapshot = await tx.contactImport.upsert({
      where: {id: importId},
      create: {id: importId, importedById: user.userId, metadata},
      update: {},
      select: {importedById: true, metadata: true},
    });
    const saved = snapshot.metadata && typeof snapshot.metadata === "object" && !Array.isArray(snapshot.metadata)
      ? snapshot.metadata : null;
    if (snapshot.importedById !== user.userId || saved?.method !== metadata.method ||
      !isDeepStrictEqual(saved?.files ?? [], metadata.files) ||
      !isDeepStrictEqual(saved?.device ?? null, metadata.device)) {
      throw new HttpError(409, "This import ID already belongs to a different user or source context");
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (let index = 0; index < contacts.length; index += BATCH_SIZE) {
      const batch = contacts.slice(index, index + BATCH_SIZE);
      const existingLeads = await tx.userLead.findMany({
        where: {phoneNumber: {in: batch.map((contact) => contact.phone)}},
        select: {id: true, phoneNumber: true, name: true, email: true},
      });
      const existingByPhone = new Map(existingLeads.map((lead) => [lead.phoneNumber, lead]));
      const newContacts = batch.filter((contact) => !existingByPhone.has(contact.phone));
      if (newContacts.length) {
        // Bulk creation keeps large uploads fast; skipDuplicates handles concurrent inserts.
        const added = await tx.userLead.createMany({
          data: newContacts.map((contact) => ({
            phoneNumber: contact.phone, name: contact.name, email: contact.email,
            source: "phone_book", isWhatsAppUser: false,
          })),
          skipDuplicates: true,
        });
        created += added.count;
        skipped += newContacts.length - added.count;
      }
      for (const contact of batch) {
        const existing = existingByPhone.get(contact.phone);
        if (!existing) continue;
        const data: {name?: string; email?: string} = {};
        if (!existing.name && contact.name) data.name = contact.name;
        if (!existing.email && contact.email) data.email = contact.email;
        if (Object.keys(data).length) {
          await tx.userLead.update({where: {id: existing.id}, data});
          updated++;
        } else skipped++;
      }
      // Also records unchanged existing leads and duplicate imports. Connect is idempotent.
      await tx.contactImport.update({
        where: {id: importId},
        data: {leads: {connect: batch.map((contact) => ({phoneNumber: contact.phone}))}},
      });
    }
    return {created, updated, skipped};
  }, {timeout: 60_000});

  return NextResponse.json({
    success: true, importId, received: parsed.data.contacts.length, ...counts, invalid,
  });
}
