import { NextResponse } from "next/server";
import { z } from "zod";
import { requireGuestStaff } from "@/lib/guests/auth";
import { identityCandidates, resolveGuestIn } from "@/lib/guests/identity";
import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function POST(request: Request) {
  try {
    const user = await requireGuestStaff(true),
      p = z
        .object({
          apply: z.boolean().default(false),
          bookingIds: z.array(z.string().min(1)).max(100).optional(),
        })
        .safeParse(await request.json());
    if (!p.success) throw new HttpError(400, "Invalid history linking request");
    if (p.data.apply && !p.data.bookingIds?.length)
      throw new HttpError(400, "Select booking IDs from the preview");
    const bookings = await prisma.booking.findMany({
      where: {
        guestId: null,
        ...(p.data.bookingIds ? { id: { in: p.data.bookingIds } } : {}),
      },
      orderBy: { id: "asc" },
      take: 100,
    });
    const results = [];
    for (const b of bookings) {
      if (!b.guestPhone && !b.guestEmail) {
        results.push({
          id: b.id,
          bookingId: b.bookingId,
          name: b.guestFullName,
          status: "missing_contact",
        });
        continue;
      }
      try {
        const ids = await identityCandidates(
          prisma,
          b.guestPhone,
          b.guestEmail,
        );
        if (ids.length > 1) {
          results.push({
            id: b.id,
            bookingId: b.bookingId,
            name: b.guestFullName,
            status: "conflict",
            guestIds: ids,
          });
          continue;
        }
        if (p.data.apply) {
          await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM bookings WHERE id=${b.id} FOR UPDATE`;
            const current = await tx.booking.findUniqueOrThrow({
              where: { id: b.id },
            });
            if (current.guestId) return;
            const guestId = await resolveGuestIn(tx, {
              name: current.guestFullName,
              phone: current.guestPhone,
              email: current.guestEmail,
            });
            await tx.booking.update({ where: { id: b.id }, data: { guestId } });
            await tx.guestActivity.create({
              data: {
                guestId,
                kind: "history_link",
                summary: `Linked historical booking ${b.bookingId}`,
                actorId: user.id,
              },
            });
          });
        }
        results.push({
          id: b.id,
          bookingId: b.bookingId,
          name: b.guestFullName,
          status: p.data.apply
            ? "linked"
            : ids.length
              ? "match"
              : "new_profile",
          guestIds: ids,
        });
      } catch (err) {
        if (err instanceof HttpError)
          results.push({
            id: b.id,
            bookingId: b.bookingId,
            name: b.guestFullName,
            status: "conflict",
            reason: err.message,
          });
        else throw err;
      }
    }
    return NextResponse.json({
      applied: p.data.apply,
      results,
      remaining: await prisma.booking.count({ where: { guestId: null } }),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
