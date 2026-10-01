import { prisma } from "@/lib/prisma";
import { SHEET_STREAMS } from "@/lib/sheet-sync/config";
import { applyRowPatches } from "@/lib/sheet-sync/patches";
import { validateFixToken } from "@/lib/sheet-sync/tokens";
import { gapsRequestSchema } from "@/lib/sheet-sync/validation";
import { NextRequest, NextResponse } from "next/server";

const streamFields = (sheet: string) =>
  SHEET_STREAMS.find((s) => s.key === sheet)?.fields.map((f) => ({
    key: f.key,
    label: f.label,
    severity: f.severity,
  })) ?? [];

/** GET ?token= → every row with any missing field (required or soft) */
export async function GET(req: NextRequest) {
  const token = await validateFixToken(
    req.nextUrl.searchParams.get("token") ?? "",
    "gaps",
  );
  if (!token) {
    return NextResponse.json(
      { error: "invalid or expired link" },
      { status: 404 },
    );
  }

  const rows = await prisma.sheetRow.findMany({
    where: {
      status: { notIn: ["legacy", "deleted", "skipped"] },
      OR: [
        { missingRequired: { isEmpty: false } },
        { missingSoft: { isEmpty: false } },
      ],
    },
    orderBy: [{ sheet: "asc" }, { rowNum: "asc" }],
    take: 200,
  });

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      sheet: r.sheet,
      rowId: r.rowId,
      status: r.status,
      fields: r.rawJson,
      patches: r.patches ?? {},
      missingRequired: r.missingRequired,
      missingSoft: r.missingSoft,
      fieldDefs: streamFields(r.sheet),
    })),
  });
}

/** POST { token, updates: [{ id, fields }] } → batch save */
export async function POST(req: NextRequest) {
  const parsed = gapsRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 422 });
  }

  const token = await validateFixToken(parsed.data.token, "gaps");
  if (!token) {
    return NextResponse.json(
      { error: "invalid or expired link" },
      { status: 404 },
    );
  }

  const results: {
    id: string;
    updated: string[];
    stillMissing: string[];
    stillMissingSoft: string[];
  }[] = [];
  for (const update of parsed.data.updates) {
    const row = await prisma.sheetRow.findFirst({
      where: {
        id: update.id,
        linkedRecordId: null,
        status: { notIn: ["legacy", "deleted", "skipped", "conflict"] },
        OR: [
          { missingRequired: { isEmpty: false } },
          { missingSoft: { isEmpty: false } },
        ],
      },
    });
    if (!row) continue;
    const allowed = new Set([...row.missingRequired, ...row.missingSoft]);
    const fields = Object.fromEntries(
      Object.entries(update.fields).filter(([key]) => allowed.has(key)),
    );
    if (!Object.keys(fields).length) continue;
    const result = await applyRowPatches(row, fields, "form");
    results.push({ id: update.id, ...result });
  }

  return NextResponse.json({ ok: true, results });
}
