import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireGuestStaff } from "@/lib/guests/auth";
import { identityCandidates, resolveGuestIn } from "@/lib/guests/identity";
import { HttpError, toErrorResponse } from "@/lib/http-error";
export async function POST(request: Request) {
  try {
    const user = await requireGuestStaff(true),
      p = z
        .object({
          apply: z.boolean().default(false),
          search: z.string().trim().max(120).default(""),
          page: z.number().int().min(1).max(100000).default(1),
          leadIds: z.array(z.string().min(1)).max(100).optional(),
        })
        .safeParse(await request.json());
    if (!p.success) throw new HttpError(400, "Invalid contact linking request");
    if (p.data.apply && !p.data.leadIds?.length)
      throw new HttpError(400, "Select contacts from the preview");
    const where = {
      ...(p.data.leadIds ? { id: { in: p.data.leadIds } } : { guestId: null }),
      ...(p.data.search
        ? {
            OR: [
              {
                name: { contains: p.data.search, mode: "insensitive" as const },
              },
              {
                pushName: {
                  contains: p.data.search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: p.data.search,
                  mode: "insensitive" as const,
                },
              },
              {
                phoneNumber: {
                  contains:
                    p.data.search.replace(/[^0-9]/g, "") || p.data.search,
                },
              },
            ],
          }
        : {}),
    };
    const total = await prisma.userLead.count({ where });
    const leads = await prisma.userLead.findMany({
      where,
      orderBy: { id: "asc" },
      skip: p.data.leadIds ? 0 : (p.data.page - 1) * 50,
      take: p.data.leadIds ? 100 : 50,
    });
    const results = [];
    for (const lead of leads) {
      try {
        const ids = await identityCandidates(
          prisma,
          lead.phoneNumber,
          lead.email,
        );
        const summary = {
          id: lead.id,
          name: lead.name || lead.pushName || lead.phoneNumber,
          phone: lead.phoneNumber,
          guestIds: lead.guestId ? [lead.guestId] : ids,
          source: lead.source,
          email: lead.email,
        };
        if (lead.guestId) {
          results.push({ ...summary, status: "already_linked" });
          continue;
        }
        if (ids.length > 1) {
          results.push({ ...summary, status: "conflict" });
          continue;
        }
        let linkedGuestId: string | undefined;
        if (p.data.apply)
          linkedGuestId = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM user_leads WHERE id=${lead.id} FOR UPDATE`;
            const current = await tx.userLead.findUniqueOrThrow({
              where: { id: lead.id },
            });
            if (current.guestId) return current.guestId;
            const guestId = await resolveGuestIn(tx, {
              name: current.name || current.pushName || current.phoneNumber,
              phone: current.phoneNumber,
              email: current.email,
            });
            const g = await tx.guest.findUniqueOrThrow({
              where: { id: guestId },
            });
            await tx.guest.update({
              where: { id: guestId },
              data: {
                city: g.city || current.city,
                tags: [...new Set([...g.tags, ...current.tags])],
                doNotContact: g.doNotContact || current.status !== "active",
              },
            });
            await tx.userLead.update({
              where: { id: lead.id },
              data: { guestId },
            });
            await tx.guestActivity.create({
              data: {
                guestId,
                kind: "contact_link",
                summary: `Linked ${current.source.replaceAll("_", " ")} contact; marketing consent was not inferred`,
                actorId: user.id,
              },
            });
            return guestId;
          });
        results.push({
          ...summary,
          guestIds: linkedGuestId ? [linkedGuestId] : summary.guestIds,
          status: p.data.apply
            ? "linked"
            : ids.length
              ? "match"
              : "new_profile",
        });
      } catch (err) {
        if (err instanceof HttpError)
          results.push({
            id: lead.id,
            name: lead.name || lead.phoneNumber,
            phone: lead.phoneNumber,
            status: "conflict",
            reason: err.message,
          });
        else throw err;
      }
    }
    return NextResponse.json({
      results,
      page: p.data.page,
      total,
      totalPages: Math.ceil(total / 50),
      remaining: await prisma.userLead.count({ where: { guestId: null } }),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
