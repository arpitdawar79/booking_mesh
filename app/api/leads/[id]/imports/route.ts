import { requireContactImportSession } from "@/lib/contact-import-auth";
import { HttpError, toErrorResponse } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({page: z.coerce.number().int().min(1).max(10000).default(1)});

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    await requireContactImportSession(request);
    const {id} = await params;
    const query = querySchema.safeParse({page: request.nextUrl.searchParams.get("page") ?? undefined});
    if (!query.success) throw new HttpError(400, "Invalid page");
    const lead = await prisma.userLead.findUnique({where: {id}, select: {id: true}});
    if (!lead) throw new HttpError(404, "Lead not found");
    const imports = await prisma.contactImport.findMany({
      where: {leads: {some: {id}}},
      orderBy: [{createdAt: "desc"}, {id: "desc"}],
      skip: (query.data.page - 1) * 50,
      take: 51,
      select: {id: true, importedById: true, importedBy: {select: {name: true}}, metadata: true, createdAt: true},
    });
    return NextResponse.json({imports: imports.slice(0, 50), page: query.data.page, hasMore: imports.length > 50}, {
      headers: {"Cache-Control": "private, no-store"},
    });
  } catch (err) {
    return toErrorResponse(err, "GET /api/leads/[id]/imports");
  }
}
