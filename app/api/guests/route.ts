import { discoverySorts, sortGuests } from "@/lib/guests/discovery";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
import { dateRangeWhere, parseDateRangeParams } from "@/lib/date-range";
import { requireGuestStaff } from "@/lib/guests/auth";
import { profileFields, segments } from "@/lib/guests/validation";
import {
  addContacts,
  identityCandidates,
  contactValues,
} from "@/lib/guests/identity";
import {
  guestDirectory,
  guestInclude,
  summarizeGuest,
} from "@/lib/guests/insights";
import { getProgram, wallet } from "@/lib/guests/rewards";
import { Prisma } from "@prisma/client";
export async function GET(request: Request) {
  try {
    const user = await requireGuestStaff();
    const params = new URL(request.url).searchParams,
      id = params.get("id");
    if (id) {
      const g = await prisma.guest.findUnique({
        where: { id },
        include: {
          ...guestInclude,
          contacts: true,
          activities: { orderBy: { createdAt: "desc" }, take: 100 },
          referrals: {
            include: { referredGuest: { select: { id: true, name: true } } },
          },
          referredBy: {
            include: { referrer: { select: { id: true, name: true } } },
          },
          redemptions: true,
        },
      });
      if (!g) throw new HttpError(404, "Guest not found");
      if (g.mergedIntoId)
        return NextResponse.json({ mergedIntoId: g.mergedIntoId });
      const program = await getProgram(),
        summary = summarizeGuest(g, program),
        w = await wallet(id);
      const offers = await prisma.guestOffer.findMany({
        where: {
          enabled: true,
          startsAt: { lte: new Date() },
          expiresAt: { gt: new Date() },
        },
      });
      return NextResponse.json({
        guest: g,
        bookings: g.bookings,
        ...summary,
        wallet: w.balance,
        ledger: w.ledger,
        program,
        offers,
        canManage: user.role !== "staff",
      });
    }
    const phone = params.get("phone"),
      email = params.get("email");
    if (phone || email) {
      const ids = await identityCandidates(prisma, phone, email);
      const guests = await prisma.guest.findMany({
        where: { id: { in: ids } },
        include: {
          _count: {
            select: {
              bookings: {
                where: {
                  status: "completed",
                  checkOutDate: { lte: new Date() },
                },
              },
            },
          },
        },
      });
      return NextResponse.json({
        guests,
        conflict: ids.length > 1,
        total: guests.length,
      });
    }
    const search = params.get("search")?.trim().slice(0, 120) || "",
      range = dateRangeWhere(parseDateRangeParams(params));
    const where: Prisma.GuestWhereInput = {
      ...(range ? { createdAt: range } : {}),
    };
    const { guests, program } = await guestDirectory(where, new Date(), search);
    const segment = params.get("segment") || "all",
      tier = params.get("tier");
    if (!segments.includes(segment as (typeof segments)[number]))
      throw new HttpError(400, "Unknown guest segment");
    const sort = params.get("sort") || "updated";
    if (!discoverySorts.includes(sort as (typeof discoverySorts)[number]))
      throw new HttpError(400, "Unknown guest ordering");
    const filtered = sortGuests(
      guests.filter(
        (g) =>
          (segment === "all" || g.segments.includes(segment)) &&
          (!tier || g.tier.name === tier),
      ),
      sort,
    );
    const page = Math.max(1, Math.floor(Number(params.get("page")) || 1)),
      pageSize = Math.min(
        100,
        Math.max(1, Math.floor(Number(params.get("pageSize")) || 20)),
      );
    const completed = guests.filter((g) => g.stats.totalStays > 0),
      returning = completed.filter((g) => g.stats.totalStays > 1);
    return NextResponse.json({
      guests: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
      program,
      canManage: user.role !== "staff",
      overview: {
        guests: guests.length,
        returning: returning.length,
        repeatRate: completed.length
          ? Math.round((returning.length / completed.length) * 100)
          : 0,
        netRevenue: guests.reduce((s, g) => s + g.stats.netRevenue, 0),
        rewardPoints: guests.reduce((s, g) => s + Math.max(0, g.wallet), 0),
        comeback: guests.filter((g) => g.actions.length > 0).length,
        openFeedback: guests.reduce((s, g) => s + g.openFeedback, 0),
      },
    });
  } catch (err) {
    return toErrorResponse(err, "GET /api/guests");
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireGuestStaff(),
      parsed = profileFields.safeParse(await request.json());
    if (!parsed.success)
      throw new HttpError(
        400,
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    const data = parsed.data,
      c = contactValues(data.phone, data.email);
    const guest = await prisma.$transaction(async (tx) => {
      if ((await identityCandidates(tx, c.phone, c.email)).length)
        throw new HttpError(
          409,
          "This contact already has a guest profile. Open that profile instead.",
        );
      const g = await tx.guest.create({
        data: {
          ...data,
          ...c,
          birthday: data.birthday ? new Date(data.birthday) : null,
        },
      });
      await addContacts(tx, g.id, c.phone, c.email);
      await tx.userLead.updateMany({
        where: { phoneNumber: c.phone || "__no_phone__", guestId: null },
        data: { guestId: g.id },
      });
      await tx.guestActivity.create({
        data: {
          guestId: g.id,
          kind: "profile",
          summary: "Guest profile created",
          actorId: user.id,
        },
      });
      return g;
    });
    return NextResponse.json({ guest }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    )
      return NextResponse.json(
        { error: "Contact already belongs to a profile" },
        { status: 409 },
      );
    return toErrorResponse(err, "POST /api/guests");
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireGuestStaff(),
      body = await request.json();
    const parsed = profileFields
      .partial()
      .extend({ id: PrismaId })
      .safeParse(body);
    if (!parsed.success)
      throw new HttpError(
        400,
        parsed.error.issues.map((i) => i.message).join("; "),
      );
    const { id, ...data } = parsed.data;
    const guest = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM guests WHERE id=${id} FOR UPDATE`;
      const old = await tx.guest.findUnique({ where: { id } });
      if (!old || old.mergedIntoId) throw new HttpError(404, "Guest not found");
      const phone = data.phone === undefined ? old.phone : data.phone,
        email = data.email === undefined ? old.email : data.email;
      const ids = await identityCandidates(tx, phone, email);
      if (ids.some((candidate) => candidate !== id))
        throw new HttpError(
          409,
          "Contact matches another guest; resolve identity first",
        );
      await addContacts(tx, id, old.phone, old.email);
      const c = await addContacts(tx, id, phone, email);
      const g = await tx.guest.update({
        where: { id },
        data: {
          ...data,
          ...c,
          birthday:
            data.birthday === undefined
              ? undefined
              : data.birthday
                ? new Date(data.birthday)
                : null,
        },
      });
      await tx.userLead.updateMany({
        where: {
          phoneNumber: c.phone || "__no_phone__",
          OR: [{ guestId: null }, { guestId: id }],
        },
        data: { guestId: id },
      });
      const changes = Object.keys(data).filter(
        (key) =>
          JSON.stringify(old[key as keyof typeof old]) !==
          JSON.stringify(data[key as keyof typeof data]),
      );
      await tx.guestActivity.create({
        data: {
          guestId: id,
          kind: "profile",
          summary: `Profile updated: ${changes.join(", ") || "contact normalization"}`,
          actorId: user.id,
        },
      });
      return g;
    });
    return NextResponse.json({ guest });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    )
      return NextResponse.json(
        { error: "Contact already belongs to a profile" },
        { status: 409 },
      );
    return toErrorResponse(err, "PATCH /api/guests");
  }
}
import { z } from "zod";
const PrismaId = z.string().min(1).max(100);
