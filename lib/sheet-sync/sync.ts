import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { SheetRowStatus } from "@prisma/client";
import { APP_CONFIG_KEYS, SHEET_STREAMS, sheetSyncEnv } from "./config";
import type { SheetStreamDef } from "./config";
import { fetchTabs, getFileMeta } from "./google";
import type { SheetFileMeta } from "./google";
import { shouldAutoMerge } from "./dedup-score";
import {
  findDuplicateSibling,
  linkedRecordExists,
  linkOrCreateLedgerRecord,
  mappedHash,
  shouldImportBookingProperty,
} from "./ledger";
import { findRowIdCollisions, inferBaseYear, judgeRow, parseStream } from "./parse";
import type { ParsedRow, SheetMatrix } from "./parse";

export type LogFn = (label: string, message: string) => void;
const noopLog: LogFn = () => {};

export type TabFetcher = (tabName: string) => Promise<SheetMatrix>;

export interface StreamReport {
  stream: string;
  scanned: number;
  created: number;
  updated: number;
  unchanged: number;
  legacy: number;
  incomplete: number;
  complete: number;
  softGaps: number;
  conflicts: number;
  importErrors: number;
  deleted: number;
  merged: number;
  possibleDuplicates: number;
  collisions: number;
  unparsedDateRows: string[];
  driftSuspected: boolean;
}

export interface SyncReport {
  fileId: string;
  fileName: string;
  modifiedTime: string | null;
  startedAt: Date;
  durationMs: number;
  dryRun: boolean;
  streams: StreamReport[];
  errors: string[];
}

async function getConfig(key: string): Promise<string | null> {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getSyncFromDate(): Promise<Date | null> {
  const raw =
    (await getConfig(APP_CONFIG_KEYS.syncFromDate)) ??
    sheetSyncEnv.syncFromDate();
  if (!raw) return null;
  const d = new Date(raw);
  // Fail closed: a malformed cutoff must not silently import everything.
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid sheet cutoff date configured: "${raw}"`);
  }
  return d;
}

const SYNC_LOCK_KEY = "sheet.syncLock";
const SYNC_LOCK_TTL_MS = 10 * 60 * 1000;

/**
 * Cross-process mutex via a single-row compare-and-swap — webhook (Next.js)
 * and cron (pm2) both call runSheetSync; only one may run at a time.
 */
async function acquireSyncLock(): Promise<boolean> {
  const stale = new Date(Date.now() - SYNC_LOCK_TTL_MS).toISOString();
  await prisma.appConfig.upsert({
    where: { key: SYNC_LOCK_KEY },
    create: { key: SYNC_LOCK_KEY, value: "" },
    update: {},
  });
  const acquired = await prisma.appConfig.updateMany({
    where: {
      key: SYNC_LOCK_KEY,
      OR: [{ value: "" }, { value: { lt: stale } }],
    },
    data: { value: new Date().toISOString() },
  });
  return acquired.count === 1;
}

async function releaseSyncLock(): Promise<void> {
  await setConfig(SYNC_LOCK_KEY, "");
}

type Patches = Record<string, { value: string; source?: string }>;

function decideStatus(
  existing: { status: SheetRowStatus; resolvedVia: string | null } | null,
  judged: { missingRequired: string[] },
  patches: Patches | null,
  isLegacy: boolean,
): { status: SheetRowStatus; resolvedVia?: string; resolvedAt?: Date } {
  if (isLegacy) return { status: "legacy" };

  // Manual "hands off" statuses stick regardless of sheet contents.
  if (existing && ["skipped"].includes(existing.status)) {
    return { status: existing.status };
  }

  if (judged.missingRequired.length > 0) {
    if (existing?.status === "snoozed") return { status: "snoozed" };
    // Keep "nagged" if it was already nagged; otherwise (re)mark incomplete
    return { status: existing?.status === "nagged" ? "nagged" : "incomplete" };
  }

  // No required gaps — a previously-flagged row is resolved even when stale
  // patches exist (the patch may be why it's now complete).
  if (existing && (existing.status === "complete" || existing.status === "resolved")) {
    return { status: existing.status };
  }
  const hasPatches = patches && Object.keys(patches).length > 0;
  return existing
    ? {
        status: "resolved",
        resolvedVia: existing.resolvedVia ?? (hasPatches ? "patch" : "sheet"),
        resolvedAt: new Date(),
      }
    : { status: "complete" };
}

async function syncStream(
  stream: SheetStreamDef,
  matrix: SheetMatrix,
  cutoff: Date | null,
  baseYear: number,
  startedAt: Date,
  dryRun: boolean,
  log: LogFn,
): Promise<StreamReport> {
  const rows = parseStream(stream, matrix, baseYear);
  const report: StreamReport = {
    stream: stream.key,
    scanned: rows.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    legacy: 0,
    incomplete: 0,
    complete: 0,
    softGaps: 0,
    conflicts: 0,
    importErrors: 0,
    deleted: 0,
    merged: 0,
    possibleDuplicates: 0,
    collisions: 0,
    unparsedDateRows: [],
    driftSuspected:
      stream.key !== "payouts" && rows.length < 5,
  };

  // A3: two physical rows sharing an S.No are ambiguous as a pair — the DB
  // key is (sheet,rowId), so processing both would let the later row silently
  // clobber the earlier. Flag the whole cluster, import neither until reviewed.
  const collided = findRowIdCollisions(rows);
  if (collided.size) {
    report.collisions = [...collided.values()].reduce((a, g) => a + g.length, 0);
    if (!dryRun) {
      for (const [rowId, group] of collided) {
        const first = group[0];
        const summary = group.map((g) => ({
          rowNum: g.rowNum,
          date: g.fields[stream.dateField ?? ""] ?? "",
          amount: g.fields.amount ?? g.fields.revenue ?? "",
          label: g.fields.particular ?? g.fields.guestName ?? g.fields.beneficiary ?? "",
        }));
        try {
          const existing = await prisma.sheetRow.findUnique({
            where: { sheet_rowId: { sheet: stream.key, rowId } },
          });
          // An admin decision on this (sheet,rowId) sticks: skipped is
          // hands-off, and an existing link means one cluster member was
          // already imported deliberately. Refresh liveness only, so neither
          // gets re-flagged every sync or falsely marked deleted.
          if (existing && (existing.status === "skipped" || existing.linkedRecordId)) {
            await prisma.sheetRow.update({
              where: { id: existing.id },
              data: { lastSeenAt: startedAt },
            });
            continue;
          }
          const data = {
            rowNum: first.rowNum,
            rawJson: first.fields,
            rowHash: first.rowHash,
            parsedDate: first.parsedDate,
            status: "possible_duplicate" as const,
            lastSeenAt: startedAt,
            conflictJson: {
              reason: `S.No ${rowId} used by ${group.length} sheet rows — nothing imported until resolved`,
              rows: summary,
            },
          };
          await (existing
            ? prisma.sheetRow.update({ where: { id: existing.id }, data })
            : prisma.sheetRow.create({ data: { sheet: stream.key, rowId, ...data } }));
        } catch (e) {
          report.importErrors++;
          log(
            "sheet-sync",
            `${stream.key}#${rowId}: collision flag failed — ${e instanceof Error ? e.message : e}`,
          );
        }
      }
    }
  }

  for (const row of rows) {
    if (collided.has(row.rowId)) continue;
    if (row.dateUnparsed) {
      report.unparsedDateRows.push(
        `${row.rowId} (${stream.dateField}: "${row.fields[stream.dateField ?? ""] ?? ""}")`,
      );
    }

    const isLegacy =
      !!cutoff && !!row.parsedDate && row.parsedDate < cutoff;

    if (dryRun) {
      const judged = judgeRow(stream, row.fields, null, row.parsedDate);
      if (isLegacy) report.legacy++;
      else if (judged.missingRequired.length) report.incomplete++;
      else report.complete++;
      if (judged.missingSoft.length) report.softGaps++;
      continue;
    }

    let existing;
    try {
      existing = await prisma.sheetRow.findUnique({
        where: { sheet_rowId: { sheet: stream.key, rowId: row.rowId } },
      });
    } catch (e) {
      report.importErrors++;
      log(
        "sheet-sync",
        `${stream.key}#${row.rowId}: row fetch failed — ${e instanceof Error ? e.message : e}`,
      );
      continue;
    }

    const patches = (existing?.patches as Patches | null) ?? null;
    const judged = judgeRow(stream, row.fields, patches, row.parsedDate);
    const decision = decideStatus(existing, judged, patches, isLegacy);
    const fields = row.fields;
    // A `skipped` row is hands-off: no conflict flagging either.
    const isSkipped = existing?.status === "skipped";
    const linkedPolicyViolation =
      !isSkipped &&
      !!existing?.linkedRecordId &&
      (isLegacy ||
        judged.missingRequired.length > 0 ||
        (stream.key === "revenue" &&
          /room|tariff|stay|accommodation/i.test(fields.type ?? "") &&
          !shouldImportBookingProperty(fields.property ?? "")));
    // Sticky sheet-drift detection: compare the record-affecting fields
    // against the hash captured when the record was linked/imported — NOT
    // against last sync's hash (which would silently clear the flag next run).
    // parsedDate MUST be passed: without it mappedHash re-parses the raw date
    // string with a fixed fallback year, which would differ from the year the
    // stream actually inferred and false-flag every linked row as drifted.
    const currentMappedHash =
      existing?.linkedRecordId != null
        ? mappedHash({
            sheet: stream.key,
            rawJson: row.fields,
            patches,
            parsedDate: row.parsedDate,
          })
        : null;
    const linkedSheetEdit =
      !isSkipped &&
      !!existing?.linkedRecordId &&
      !!existing?.linkedRowHash &&
      currentMappedHash !== existing.linkedRowHash;
    const isConflict = linkedPolicyViolation || linkedSheetEdit;
    // A8: a linked record deleted in-app leaves a phantom link — the row
    // looks safe while its money no longer exists anywhere.
    const orphanedLink =
      !isConflict &&
      !isSkipped &&
      !!existing?.linkedRecordId &&
      !!existing.linkedRecordType &&
      !(await linkedRecordExists(existing.linkedRecordType, existing.linkedRecordId));
    const retryTerminalImport =
      !!existing?.linkedRecordType &&
      !existing.linkedRecordId &&
      existing.rowHash !== row.rowHash;
    const status = isConflict || orphanedLink ? "conflict" : decision.status;

    if (status === "conflict") report.conflicts++;
    else if (isLegacy) report.legacy++;
    else if (status === "complete" || status === "resolved") report.complete++;
    else if (status === "incomplete" || status === "nagged" || status === "snoozed") report.incomplete++;
    if (judged.missingSoft.length) report.softGaps++;

    const data = {
      rowNum: row.rowNum,
      rawJson: row.fields,
      rowHash: row.rowHash,
      parsedDate: row.parsedDate,
      status,
      missingRequired: judged.missingRequired,
      missingSoft: judged.missingSoft,
      lastSeenAt: startedAt,
      importError: retryTerminalImport ? null : existing?.importError ?? null,
      ...(retryTerminalImport ? { linkedRecordType: null } : {}),
      ...(isConflict
        ? {
            conflictJson: {
              previous: existing?.rawJson ?? null,
              current: row.fields,
              reason: linkedPolicyViolation
                ? "linked row no longer satisfies import policy"
                : "sheet changed after import",
            },
          }
        : orphanedLink
          ? {
              conflictJson: {
                reason: "linked record no longer exists in the app — re-import or unlink",
                lostRecord: {
                  type: existing!.linkedRecordType,
                  id: existing!.linkedRecordId,
                },
              },
            }
          : { conflictJson: Prisma.JsonNull }),
      ...(!isConflict && decision.resolvedVia
        ? { resolvedVia: decision.resolvedVia }
        : {}),
      ...(!isConflict && decision.resolvedAt
        ? { resolvedAt: decision.resolvedAt }
        : {}),
    };

    try {
      if (!existing) {
        await prisma.sheetRow.create({
          data: { sheet: stream.key, rowId: row.rowId, ...data },
        });
        report.created++;
      } else {
        await prisma.sheetRow.update({ where: { id: existing.id }, data });
        if (existing.rowHash !== row.rowHash) report.updated++;
        else report.unchanged++;
      }
    } catch (e) {
      // One bad row (e.g. duplicate S.No racing a concurrent sync) must not
      // abort the whole stream.
      report.importErrors++;
      log(
        "sheet-sync",
        `${stream.key}#${row.rowId}: row write failed — ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  if (!dryRun) {
    // Ledger bridge: every complete/resolved non-legacy row becomes a real
    // record (status already excludes legacy/skipped/possible_duplicate).
    const linkable = await prisma.sheetRow.findMany({
      where: {
        sheet: stream.key,
        status: { in: ["complete", "resolved"] },
        linkedRecordId: null,
        linkedRecordType: null,
      },
    });
    let bridged = 0;
    for (const r of linkable) {
      try {
        // Intra-sheet dup check: the dedup engine scores every nearby same-stream
        // row. Confident pairs collapse onto the sibling's record (merge);
        // likely-but-not-certain pairs wait for a human.
        const dup = await findDuplicateSibling(r);
        if (dup) {
          const tag =
            dup.sibling.sheet === "expenses"
              ? `e${dup.sibling.rowId}`
              : dup.sibling.sheet === "revenue"
                ? `r${dup.sibling.rowId}`
                : `p${dup.sibling.rowId}`;
          const siblingRecord =
            ["expense", "additional_sale", "booking"].includes(
              dup.sibling.linkedRecordType ?? "",
            ) && dup.sibling.linkedRecordId
              ? { type: dup.sibling.linkedRecordType!, id: dup.sibling.linkedRecordId }
              : null;

          // A8: the sibling's link may be a phantom (record deleted in-app and
          // not yet re-swept) — never merge onto a record that doesn't exist.
          const siblingRecordLive =
            siblingRecord && (await linkedRecordExists(siblingRecord.type, siblingRecord.id))
              ? siblingRecord
              : null;

          if (siblingRecordLive && shouldAutoMerge(dup.verdict)) {
            await prisma.sheetRow.update({
              where: { id: r.id },
              data: {
                status: "resolved",
                linkedRecordId: siblingRecordLive.id,
                linkedRecordType: siblingRecordLive.type,
                linkedRowHash: mappedHash(r),
                resolvedVia: "merge",
                resolvedAt: new Date(),
                importError: null,
                conflictJson: {
                  merge: {
                    into: siblingRecordLive,
                    mergedWithRow: tag,
                    confidence: dup.verdict.confidence,
                    reasons: dup.verdict.reasons,
                  },
                },
              },
            });
            report.merged++;
            bridged++;
            continue;
          }

          await prisma.sheetRow.update({
            where: { id: r.id },
            data: {
              status: "possible_duplicate",
              conflictJson: {
                reason: `near-duplicate of ${tag} (${Math.round(dup.verdict.confidence * 100)}%) — merge or import`,
                duplicateOfRow: { id: dup.sibling.id, rowId: dup.sibling.rowId },
                confidence: dup.verdict.confidence,
                reasons: dup.verdict.reasons,
              },
            },
          });
          report.possibleDuplicates++;
          continue;
        }
        const outcome = await linkOrCreateLedgerRecord(r);
        if (outcome === "merged") report.merged++;
        else if (outcome === "flagged_duplicate") report.possibleDuplicates++;
        bridged++;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        report.importErrors++;
        await prisma.sheetRow.update({
          where: { id: r.id },
          data: { importError: message },
        });
        log("sheet-sync", `ledger bridge failed ${stream.key}#${r.rowId}: ${message}`);
      }
    }
    if (linkable.length) {
      log("sheet-sync", `${stream.key}: bridged ${bridged}/${linkable.length} rows to ledger`);
    }

    // Deletion detection: previously-seen rows absent from this pull
    const deleted = await prisma.sheetRow.updateMany({
      where: {
        sheet: stream.key,
        lastSeenAt: { lt: startedAt },
        status: { notIn: ["legacy", "deleted"] },
      },
      data: { status: "deleted" },
    });
    report.deleted = deleted.count;
  }

  log(
    "sheet-sync",
    `${stream.key}: scanned=${report.scanned} created=${report.created} ` +
      `updated=${report.updated} incomplete=${report.incomplete} ` +
      `softGaps=${report.softGaps} conflicts=${report.conflicts} ` +
      `merged=${report.merged} possibleDuplicates=${report.possibleDuplicates} ` +
      `collisions=${report.collisions} ` +
      `importErrors=${report.importErrors} deleted=${report.deleted}` +
      (report.unparsedDateRows.length
        ? ` unparsedDates=[${report.unparsedDateRows.join("; ")}]`
        : ""),
  );

  return report;
}

export interface SyncOptions {
  dryRun?: boolean;
  /** test/dev hook: supply matrices directly, skipping Drive */
  tabFetcher?: TabFetcher;
  log?: LogFn;
}

export async function runSheetSync(
  opts: SyncOptions = {},
): Promise<SyncReport> {
  const log = opts.log ?? noopLog;
  const dryRun = opts.dryRun ?? false;
  const startedAt = new Date();
  const fileId = sheetSyncEnv.fileId();
  const errors: string[] = [];

  if (!opts.tabFetcher && !(await acquireSyncLock())) {
    log("sheet-sync", "another sync is running — skipping");
    return {
      fileId,
      fileName: "",
      modifiedTime: null,
      startedAt,
      durationMs: Date.now() - startedAt.getTime(),
      dryRun,
      streams: [],
      errors: ["skipped: another sync already in progress"],
    };
  }

  try {
    return await runSheetSyncInner(opts, log, dryRun, startedAt, fileId, errors);
  } finally {
    if (!opts.tabFetcher) await releaseSyncLock();
  }
}

async function runSheetSyncInner(
  opts: SyncOptions,
  log: LogFn,
  dryRun: boolean,
  startedAt: Date,
  fileId: string,
  errors: string[],
): Promise<SyncReport> {
  let meta: SheetFileMeta = {
    fileId,
    name: "(local)",
    mimeType: "xlsx",
    modifiedTime: null,
  };

  if (!opts.tabFetcher) {
    if (!fileId) throw new Error("SHEET_FILE_ID is not configured");
    meta = await getFileMeta(fileId);
    log("sheet-sync", `file="${meta.name}" mime=${meta.mimeType} modified=${meta.modifiedTime}`);
  }

  const tabNames = [...new Set(SHEET_STREAMS.map((stream) => stream.tabName))];
  const remoteTabs = opts.tabFetcher ? null : await fetchTabs(meta, tabNames);
  const fetcher: TabFetcher =
    opts.tabFetcher ??
    (async (tabName) => {
      const matrix = remoteTabs?.get(tabName);
      if (!matrix) throw new Error(`Tab "${tabName}" was not returned`);
      return matrix;
    });

  const cutoff = await getSyncFromDate();
  const fallbackYear =
    Number(process.env.SHEET_EPOCH_YEAR) || new Date().getUTCFullYear() - 1;

  const streams: StreamReport[] = [];
  const matrixCache = new Map<string, SheetMatrix>();
  for (const stream of SHEET_STREAMS) {
    try {
      let matrix = matrixCache.get(stream.tabName);
      if (!matrix) {
        matrix = await fetcher(stream.tabName);
        matrixCache.set(stream.tabName, matrix);
      }
      const baseYear = inferBaseYear(matrix, stream.headerRow, fallbackYear);
      streams.push(
        await syncStream(stream, matrix, cutoff, baseYear, startedAt, dryRun, log),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${stream.key}: ${msg}`);
      log("sheet-sync", `ERROR ${stream.key}: ${msg}`);
    }
  }

  // Only stamp a healthy sync time when at least one stream actually ran.
  if (!dryRun && streams.length) {
    await setConfig(APP_CONFIG_KEYS.lastSyncAt, startedAt.toISOString());
  }

  return {
    fileId,
    fileName: meta.name,
    modifiedTime: meta.modifiedTime,
    startedAt,
    durationMs: Date.now() - startedAt.getTime(),
    dryRun,
    streams,
    errors,
  };
}

// Re-exports for consumers
export { SHEET_STREAMS } from "./config";
export type { ParsedRow };
