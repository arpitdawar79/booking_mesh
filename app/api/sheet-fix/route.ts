import { prisma } from "@/lib/prisma";
import { SHEET_STREAMS } from "@/lib/sheet-sync/config";
import { applyRowPatches } from "@/lib/sheet-sync/patches";
import { validateFixToken } from "@/lib/sheet-sync/tokens";
import { fixRequestSchema } from "@/lib/sheet-sync/validation";
import { NextRequest, NextResponse } from "next/server";

const streamFields = (sheet: string) =>
  SHEET_STREAMS.find((s) => s.key === sheet)?.fields.map((f) => ({
    key: f.key,
    label: f.label,
    severity: f.severity,
  })) ?? [];

/** GET ?token= → row payload for the fix form */
export async function GET(req: NextRequest) {
  const token = await validateFixToken(
    req.nextUrl.searchParams.get("token") ?? "",
    "fix",
  );
  if (!token || !token.sheetRowId) {
    return NextResponse.json({ error: "invalid or expired link" }, { status: 404 });
  }

  const row = await prisma.sheetRow.findUnique({
    where: { id: token.sheetRowId },
  });
  if (!row) {
    return NextResponse.json({ error: "row not found" }, { status: 404 });
  }

  return NextResponse.json({
    sheet: row.sheet,
    rowId: row.rowId,
    status: row.status,
    fields: row.rawJson,
    patches: row.patches ?? {},
    missingRequired: row.missingRequired,
    missingSoft: row.missingSoft,
    fieldDefs: streamFields(row.sheet),
  });
}

/** POST { token, fields } → apply fixes */
export async function POST(req: NextRequest) {
  const parsed = fixRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 422 });
  }

  const token = await validateFixToken(parsed.data.token, "fix");
  if (!token || !token.sheetRowId) {
    return NextResponse.json({ error: "invalid or expired link" }, { status: 404 });
  }

  const row = await prisma.sheetRow.findUnique({
    where: { id: token.sheetRowId },
  });
  if (!row) {
    return NextResponse.json({ error: "row not found" }, { status: 404 });
  }

  if (
    row.linkedRecordId ||
    ["legacy", "deleted", "skipped", "conflict"].includes(row.status)
  ) {
    return NextResponse.json({ error: "row is not editable" }, { status: 409 });
  }

  const allowed = new Set([...row.missingRequired, ...row.missingSoft]);
  const fields = Object.fromEntries(
    Object.entries(parsed.data.fields).filter(([key]) => allowed.has(key)),
  );
  if (!Object.keys(fields).length) {
    return NextResponse.json({ error: "no editable fields supplied" }, { status: 422 });
  }

  const { updated, stillMissing, stillMissingSoft } = await applyRowPatches(
    row,
    fields,
    "form",
  );
  const complete = stillMissing.length === 0;
  if (complete) {
    await prisma.sheetFixToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });
  }

  return NextResponse.json({
    ok: true,
    updated,
    stillMissing,
    stillMissingSoft,
    complete,
  });
}
