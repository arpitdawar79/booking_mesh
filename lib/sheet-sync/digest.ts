import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { SheetRow } from "@prisma/client";
import { APP_CONFIG_KEYS, sheetSyncEnv } from "./config";
import { formatDigest, rowTag } from "./digest-format";
import { sendToAdminDm, sendToAdminGroup } from "./notify";
import type { LogFn } from "./sync";
import { setConfig } from "./sync";

const MAX_ROWS_IN_DIGEST = 10;
const TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72h
const ESCALATE_AFTER_MS = 5 * 24 * 60 * 60 * 1000; // 5d unresolved → admin DM

function shouldNag(row: SheetRow, now: Date): boolean {
  if (row.status === "snoozed") {
    return !!row.snoozedUntil && row.snoozedUntil <= now;
  }
  if (!row.lastNaggedAt) return true;
  const gap = now.getTime() - row.lastNaggedAt.getTime();
  if (row.nagCount < 3) return gap >= 20 * 3600_000; // ~once/day
  if (row.nagCount < 7) return gap >= 2 * 24 * 3600_000;
  return gap >= 7 * 24 * 3600_000; // weekly after a week of nags
}

async function mintToken(
  kind: "fix" | "gaps",
  sheetRowId?: string,
): Promise<string> {
  // Opportunistic cleanup so the table doesn't grow forever.
  await prisma.sheetFixToken
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});
  const token = randomBytes(18).toString("base64url");
  await prisma.sheetFixToken.create({
    data: {
      token,
      kind,
      sheetRowId: sheetRowId ?? null,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function runSheetDigestJob(log: LogFn): Promise<void> {
  const now = new Date();
  const baseUrl = sheetSyncEnv.appBaseUrl().replace(/\/$/, "");

  const [lastDigest, lastSoftCount] = await Promise.all([
    prisma.appConfig.findUnique({ where: { key: "sheet.lastDigestAt" } }),
    prisma.appConfig.findUnique({ where: { key: "sheet.lastSoftGapCount" } }),
  ]);
  const since = lastDigest ? new Date(lastDigest.value) : new Date(0);
  const [candidates, softGapCount, deleted, conflicts, importFailed] =
    await Promise.all([
      prisma.sheetRow.findMany({
        where: { status: { in: ["incomplete", "nagged", "snoozed"] } },
        orderBy: [{ sheet: "asc" }, { rowNum: "asc" }],
      }),
      prisma.sheetRow.count({
        where: {
          status: { in: ["complete", "resolved", "incomplete", "nagged", "snoozed"] },
          missingSoft: { isEmpty: false },
        },
      }),
      prisma.sheetRow.findMany({
        where: { status: "deleted", updatedAt: { gt: since } },
      }),
      prisma.sheetRow.findMany({
        where: {
          status: { in: ["conflict", "possible_duplicate"] },
          updatedAt: { gt: since },
        },
        orderBy: [{ sheet: "asc" }, { rowNum: "asc" }],
      }),
      prisma.sheetRow.findMany({
        where: {
          importError: { not: null },
          updatedAt: { gt: since },
        },
        orderBy: [{ sheet: "asc" }, { rowNum: "asc" }],
      }),
    ]);
  const toNag = candidates.filter((row) => shouldNag(row, now));
  // Soft-gap footer only re-notifies when the count changed — otherwise the
  // same "181 rows" line would spam every digest forever.
  const softGapChanged =
    softGapCount > 0 && String(softGapCount) !== (lastSoftCount?.value ?? "");

  if (
    !toNag.length &&
    !softGapChanged &&
    deleted.length === 0 &&
    conflicts.length === 0 &&
    importFailed.length === 0
  ) {
    log("sheet-digest", "nothing to notify");
    return;
  }

  const links = new Map<string, string>();
  for (const row of toNag.slice(0, MAX_ROWS_IN_DIGEST)) {
    links.set(row.id, `${baseUrl}/fix/${await mintToken("fix", row.id)}`);
  }
  const gapsLink =
    softGapChanged || toNag.length > MAX_ROWS_IN_DIGEST
      ? `${baseUrl}/sheet-gaps/${await mintToken("gaps")}`
      : "";

  const message = formatDigest(
    toNag,
    (row) => links.get(row.id) ?? gapsLink,
    gapsLink,
    softGapChanged ? softGapCount : 0,
    deleted,
    conflicts,
    importFailed,
  );

  const res = await sendToAdminGroup(message);
  if (!res.success) {
    log("sheet-digest", `send failed: ${res.error}`);
    throw new Error(`digest send failed: ${res.error}`);
  }

  await prisma.sheetRow.updateMany({
    where: { id: { in: toNag.map((r) => r.id) } },
    data: {
      status: "nagged",
      lastNaggedAt: now,
      nagCount: { increment: 1 },
      snoozedUntil: null,
    },
  });

  // Escalation: unresolved >5d → admin DM (capped so a backlog doesn't burst)
  const stale = toNag.filter(
    (row) => now.getTime() - row.firstSeenAt.getTime() > ESCALATE_AFTER_MS && !row.escalatedAt,
  );
  for (const row of stale.slice(0, 3)) {
    await sendToAdminDm(
      `🚨 ${rowTag(row)} incomplete for ${Math.floor(
        (now.getTime() - row.firstSeenAt.getTime()) / 86400000,
      )}d ` +
        `(missing: ${row.missingRequired.join(", ")}). ` +
        `Reply "skip ${rowTag(row)}" to stop nags.`,
    ).catch(() => {});
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: { escalatedAt: now },
    });
  }
  if (stale.length > 3) {
    await sendToAdminDm(
      `🚨 …and ${stale.length - 3} more rows incomplete >5d — see /dashboard/sheet-sync`,
    ).catch(() => {});
    await prisma.sheetRow.updateMany({
      where: { id: { in: stale.slice(3).map((r) => r.id) } },
      data: { escalatedAt: now },
    });
  }

  await setConfig("sheet.lastDigestAt", now.toISOString());
  await setConfig("sheet.lastSoftGapCount", String(softGapCount));
  log(
    "sheet-digest",
    `sent digest: ${toNag.length} rows, ${softGapCount} soft-gap rows, ${conflicts.length} conflicts, ${deleted.length} deleted`,
  );
}
