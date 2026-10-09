import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../http-error";
import { normalizeContactPhone } from "../phone-normalize";
import { matchingGuestIds, normalizeEmail } from "./core";
type DB = Prisma.TransactionClient;
export function contactValues(phone?: string | null, email?: string | null) {
  const p = phone?.trim() ? normalizeContactPhone(phone) : null,
    e = normalizeEmail(email);
  if (phone?.trim() && !p)
    throw new HttpError(400, "Invalid guest phone number");
  return { phone: p, email: e };
}
export async function identityCandidates(
  db: DB,
  phone?: string | null,
  email?: string | null,
) {
  const c = contactValues(phone, email);
  if (!c.phone && !c.email) return [];
  const variants = c.phone
    ? [
        c.phone,
        `00${c.phone}`,
        ...(c.phone.startsWith("91") && c.phone.length === 12
          ? [c.phone.slice(2), `0${c.phone.slice(2)}`]
          : []),
      ]
    : [];
  const raw = await db.$queryRaw<
    { id: string; phone: string | null; email: string | null }[]
  >`
 SELECT id,phone,email FROM guests WHERE merged_into_id IS NULL AND
 (regexp_replace(phone, '[^0-9]', '', 'g') IN (${Prisma.join(variants.length ? variants : [""])}) OR lower(trim(email)) = ${c.email || ""})`;
  const keys = [
    ...(c.phone ? [{ kind: "phone", value: c.phone }] : []),
    ...(c.email ? [{ kind: "email", value: c.email }] : []),
  ];
  const aliases = await db.guestContact.findMany({
    where: { OR: keys, guest: { mergedIntoId: null } },
    select: { guestId: true },
  });
  return [
    ...new Set([
      ...matchingGuestIds(raw, c.phone, c.email),
      ...aliases.map((a) => a.guestId),
    ]),
  ];
}
export async function addContacts(
  db: DB,
  guestId: string,
  phone?: string | null,
  email?: string | null,
) {
  const c = contactValues(phone, email);
  for (const [kind, value] of [
    ["phone", c.phone],
    ["email", c.email],
  ] as const) {
    if (!value) continue;
    const existing = await db.guestContact.findUnique({
      where: { kind_value: { kind, value } },
    });
    if (existing && existing.guestId !== guestId)
      throw new HttpError(
        409,
        "Contact belongs to another guest; resolve the duplicate first",
      );
    if (!existing)
      await db.guestContact.create({ data: { guestId, kind, value } });
  }
  return c;
}
export async function resolveGuestIn(
  db: DB,
  input: { name: string; phone?: string | null; email?: string | null },
) {
  const c = contactValues(input.phone, input.email);
  const ids = await identityCandidates(db, c.phone, c.email);
  if (ids.length > 1)
    throw new HttpError(
      409,
      "Phone and email match different guests. Resolve the guest identity before saving.",
    );
  const guest = ids.length
    ? await db.guest.findUniqueOrThrow({ where: { id: ids[0] } })
    : await db.guest.create({ data: { name: input.name, ...c } });
  await addContacts(db, guest.id, c.phone, c.email);
  // Add missing primary details, retaining known details and all previous aliases.
  if ((!guest.phone && c.phone) || (!guest.email && c.email))
    await db.guest.update({
      where: { id: guest.id },
      data: { phone: guest.phone || c.phone, email: guest.email || c.email },
    });
  await db.userLead.updateMany({
    where: {
      AND: [
        {
          OR: [
            ...(c.phone ? [{ phoneNumber: c.phone }] : []),
            ...(c.email
              ? [{ email: { equals: c.email, mode: "insensitive" as const } }]
              : []),
          ],
        },
        { OR: [{ guestId: null }, { guestId: guest.id }] },
      ],
    },
    data: { guestId: guest.id },
  });
  return guest.id;
}
export async function resolveGuest(input: {
  name: string;
  phone?: string | null;
  email?: string | null;
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction((tx) => resolveGuestIn(tx, input));
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < 2
      )
        continue;
      throw err;
    }
  }
  throw new HttpError(409, "Guest changed concurrently; try again");
}
export async function mergeGuests(
  targetId: string,
  sourceId: string,
  actorId: string,
) {
  if (targetId === sourceId)
    throw new HttpError(400, "Choose two different profiles");
  return prisma.$transaction(async (tx) => {
    for (const id of [targetId, sourceId].sort())
      await tx.$queryRaw`SELECT id FROM guests WHERE id=${id} FOR UPDATE`;
    const [target, source] = await Promise.all([
      tx.guest.findUnique({ where: { id: targetId } }),
      tx.guest.findUnique({ where: { id: sourceId } }),
    ]);
    if (!target || !source || target.mergedIntoId || source.mergedIntoId)
      throw new HttpError(409, "Both profiles must be active");
    const referrals = await tx.guestReferral.findMany({
      where: {
        OR: [
          { referrerId: { in: [targetId, sourceId] } },
          { referredGuestId: { in: [targetId, sourceId] } },
        ],
      },
    });
    if (
      referrals.some(
        (r) =>
          [targetId, sourceId].includes(r.referrerId) &&
          [targetId, sourceId].includes(r.referredGuestId),
      ) ||
      referrals.filter((r) => [targetId, sourceId].includes(r.referredGuestId))
        .length > 1
    )
      throw new HttpError(
        409,
        "Resolve conflicting referral attribution before merging",
      );
    const redemption = await tx.guestRedemption.findMany({
      where: { guestId: { in: [targetId, sourceId] }, offerId: { not: null } },
      select: { offerId: true },
    });
    if (new Set(redemption.map((r) => r.offerId)).size < redemption.length)
      throw new HttpError(
        409,
        "Both guests used the same offer; resolve redemption history first",
      );
    // A duplicate's canonical contacts may already belong to the survivor.
    // Only conflicts with a third profile prevent this explicitly reviewed merge.
    for (const profile of [target, source]) {
      const values = contactValues(profile.phone, profile.email);
      for (const [kind, value] of [
        ["phone", values.phone],
        ["email", values.email],
      ] as const) {
        if (!value) continue;
        const existing = await tx.guestContact.findUnique({
          where: { kind_value: { kind, value } },
        });
        if (existing && ![targetId, sourceId].includes(existing.guestId))
          throw new HttpError(
            409,
            "Contact belongs to a third profile; resolve that conflict first",
          );
        if (!existing)
          await tx.guestContact.create({
            data: { guestId: targetId, kind, value },
          });
      }
    }
    await tx.guestContact.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.booking.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.userLead.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.guestActivity.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.guestReward.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.guestFeedback.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.guestLink.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.guestRedemption.updateMany({
      where: { guestId: sourceId },
      data: { guestId: targetId },
    });
    await tx.guestReferral.updateMany({
      where: { referrerId: sourceId },
      data: { referrerId: targetId },
    });
    await tx.guestReferral.updateMany({
      where: { referredGuestId: sourceId },
      data: { referredGuestId: targetId },
    });
    await tx.guest.update({
      where: { id: sourceId },
      data: { mergedIntoId: targetId, phone: null, email: null },
    });
    await tx.guest.update({
      where: { id: targetId },
      data: {
        phone: target.phone || source.phone,
        email: target.email || source.email,
        tags: [...new Set([...target.tags, ...source.tags])],
        notes: [target.notes, source.notes].filter(Boolean).join("\n") || null,
        preferences: target.preferences || source.preferences,
        birthday: target.birthday || source.birthday,
        city: target.city || source.city,
        doNotContact: target.doNotContact || source.doNotContact,
        whatsappConsent: target.whatsappConsent && source.whatsappConsent,
        emailConsent: target.emailConsent && source.emailConsent,
        lastMarketingAt:
          target.lastMarketingAt && source.lastMarketingAt
            ? new Date(
                Math.max(
                  target.lastMarketingAt.getTime(),
                  source.lastMarketingAt.getTime(),
                ),
              )
            : target.lastMarketingAt || source.lastMarketingAt,
      },
    });
    await tx.guestActivity.create({
      data: {
        guestId: targetId,
        kind: "merge",
        summary: `Merged ${source.name} into ${target.name}`,
        actorId,
        metadata: {
          sourceId,
          targetId,
          sourceName: source.name,
          sourcePhone: source.phone,
          sourceEmail: source.email,
        },
      },
    });
    return { guestId: targetId };
  });
}
