import { verifyRefreshToken, verifySessionToken } from "@/lib/auth-edge";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { APP_CONFIG_KEYS, sheetSyncEnv } from "@/lib/sheet-sync/config";
import { setConfig } from "@/lib/sheet-sync/sync";
import {
  acceptSheetIntoLinkedRecord,
  keepLinkedRecord,
  linkOrCreateLedgerRecord,
  mappedHash,
} from "@/lib/sheet-sync/ledger";
import { applyRowPatches } from "@/lib/sheet-sync/patches";
import {
  cutoffRequestSchema,
  dashboardPatchSchema,
  dashboardQuerySchema,
} from "@/lib/sheet-sync/validation";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const accessPayload = token ? await verifySessionToken(token) : null;
  if (accessPayload?.role === "admin") return true;
  const refresh = req.cookies.get("refresh_token")?.value;
  const refreshPayload = refresh ? await verifyRefreshToken(refresh) : null;
  return refreshPayload?.role === "admin";
}

/** GET → stats + rows + sync settings for /dashboard/sheet-sync */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const query = dashboardQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!query.success) {
    return NextResponse.json({ error: "invalid query" }, { status: 422 });
  }
  const { status, sheet, queue, q, page, pageSize } = query.data;

  const where: Prisma.SheetRowWhereInput = {};
  if (status) where.status = status;
  if (sheet) where.sheet = sheet;
  if (queue === "attention") {
    where.OR = [
      {
        status: {
          in: [
            "incomplete",
            "nagged",
            "conflict",
            "deleted",
            "possible_duplicate",
          ],
        },
      },
      { importError: { not: null } },
      {
        status: "snoozed",
        snoozedUntil: { lte: new Date() },
      },
    ];
  }
  if (q) {
    const or: Prisma.SheetRowWhereInput[] = [
      { rowId: { contains: q, mode: "insensitive" } },
      { rawJson: { path: ["particular"], string_contains: q } },
      { rawJson: { path: ["guestName"], string_contains: q } },
      { rawJson: { path: ["property"], string_contains: q } },
      { rawJson: { path: ["beneficiary"], string_contains: q } },
    ];
    const asNum = Number(q.replace(/^[epr]/i, ""));
    if (Number.isInteger(asNum)) or.push({ rowNum: asNum });
    where.AND = [...(where.OR ? [{ OR: where.OR }] : []), { OR: or }];
    delete where.OR;
  }

  const [rows, total, byStatus, softGaps, syncFrom, lastSync, lastDigest, watchExpiry, watchChannel] =
    await Promise.all([
      prisma.sheetRow.findMany({
        where,
        orderBy: [{ sheet: "asc" }, { rowNum: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sheetRow.count({ where }),
      prisma.sheetRow.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.sheetRow.count({
        where: {
          status: { notIn: ["legacy", "deleted", "skipped", "conflict"] },
          missingSoft: { isEmpty: false },
        },
      }),
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.syncFromDate },
      }),
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.lastSyncAt },
      }),
      prisma.appConfig.findUnique({
        where: { key: "sheet.lastDigestAt" },
      }),
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.watchExpiry },
      }),
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.watchChannelId },
      }),
    ]);

  return NextResponse.json({
    rows,
    total,
    page,
    pageSize,
    stats: {
      byStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count.id]),
      ),
      softGaps,
    },
    settings: {
      syncFromDate: syncFrom?.value ?? sheetSyncEnv.syncFromDate(),
      lastSyncAt: lastSync?.value ?? null,
      lastDigestAt: lastDigest?.value ?? null,
      fileId: sheetSyncEnv.fileId(),
      fileUrl: `https://docs.google.com/spreadsheets/d/${sheetSyncEnv.fileId()}`,
      watchActive: !!watchChannel?.value,
      watchExpiry: watchExpiry?.value ?? null,
      adminGroupConfigured: !!sheetSyncEnv.adminGroupJid(),
    },
  });
}

/** PUT { syncFromDate } → update the cutoff */
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = cutoffRequestSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid cutoff date" }, { status: 422 });
  }
  await setConfig(APP_CONFIG_KEYS.syncFromDate, parsed.data.syncFromDate);
  return NextResponse.json({ ok: true });
}

/** PATCH { id, fields?, action?, days? } → edit a row or run a row action */
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = dashboardPatchSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success || (!parsed.data.fields && !parsed.data.action)) {
    return NextResponse.json(
      { error: "provide fields and/or an action" },
      { status: 422 },
    );
  }
  const row = await prisma.sheetRow.findUnique({
    where: { id: parsed.data.id },
  });
  if (!row) return NextResponse.json({ error: "row not found" }, { status: 404 });

  const action = parsed.data.action;
  if (action === "skip") {
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: { status: "skipped", snoozedUntil: null },
    });
  } else if (action === "snooze") {
    const days = parsed.data.days ?? 1;
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: {
        status: "snoozed",
        snoozedUntil: new Date(Date.now() + days * 86400_000),
      },
    });
  } else if (action === "restore") {
    if (row.status === "deleted" || row.status === "skipped") {
      await prisma.sheetRow.update({
        where: { id: row.id },
        data: {
          status: row.missingRequired.length ? "incomplete" : "complete",
        },
      });
    }
  } else if (action === "accept") {
    const ok = await acceptSheetIntoLinkedRecord(row);
    if (!ok) {
      return NextResponse.json(
        { error: "row is not linked to a record" },
        { status: 409 },
      );
    }
  } else if (action === "keep") {
    const ok = await keepLinkedRecord(row);
    if (!ok) {
      return NextResponse.json(
        { error: "row is not linked to a record" },
        { status: 409 },
      );
    }
  } else if (action === "unlink") {
    if (row.linkedRecordId || row.linkedRecordType) {
      await prisma.sheetRow.update({
        where: { id: row.id },
        data: {
          linkedRecordId: null,
          linkedRecordType: null,
          linkedRowHash: null,
          conflictJson: Prisma.JsonNull,
          status: "complete",
        },
      });
    }
  } else if (action === "link") {
    // Attach to the flagged duplicate candidate — an existing record if one
    // was matched, else the sibling row's linked record.
    const cj = row.conflictJson as {
      candidates?: { type: string; id: string }[];
      duplicateOfRow?: { id: string };
    } | null;
    let target: { type: string; id: string } | null =
      cj?.candidates?.[0] ?? null;
    if (!target && cj?.duplicateOfRow?.id) {
      const sibling = await prisma.sheetRow.findUnique({
        where: { id: cj.duplicateOfRow.id },
      });
      if (sibling?.linkedRecordId && sibling.linkedRecordType) {
        target = { type: sibling.linkedRecordType, id: sibling.linkedRecordId };
      }
    }
    if (!target) {
      return NextResponse.json(
        { error: "no duplicate candidate to link to" },
        { status: 409 },
      );
    }
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: {
        status: "resolved",
        linkedRecordId: target.id,
        linkedRecordType: target.type,
        linkedRowHash: mappedHash(row),
        conflictJson: Prisma.JsonNull,
        importError: null,
      },
    });
  } else if (action === "import") {
    // Not a duplicate — force-create a fresh ledger record.
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: {
        status: "resolved",
        conflictJson: Prisma.JsonNull,
        importError: null,
      },
    });
    const fresh = await prisma.sheetRow.findUnique({ where: { id: row.id } });
    if (fresh) await linkOrCreateLedgerRecord(fresh, { forceCreate: true });
  }

  const patchResult = parsed.data.fields
    ? await applyRowPatches(row, parsed.data.fields, "dashboard")
    : null;

  const fresh = await prisma.sheetRow.findUnique({ where: { id: row.id } });
  return NextResponse.json({
    ok: true,
    row: fresh,
    patch: patchResult
      ? {
          updated: patchResult.updated,
          stillMissing: patchResult.stillMissing,
          stillMissingSoft: patchResult.stillMissingSoft,
          rejectedStatus: patchResult.rejectedStatus ?? null,
        }
      : null,
  });
}
