import {
  formatDryRunSummary,
  sendToAdminDm,
  sendToAdminGroup,
} from "./notify";
import { runSheetSync } from "./sync";
import type { LogFn, SyncReport } from "./sync";

export interface SheetSyncJobOptions {
  dryRun?: boolean;
  notify?: boolean; // send dry-run summary to admin group
}

export async function runSheetSyncJob(
  log: LogFn,
  opts: SheetSyncJobOptions = {},
): Promise<SyncReport> {
  let report: SyncReport;
  try {
    report = await runSheetSync({ log, dryRun: opts.dryRun });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sendToAdminDm(`⚠️ Sheet sync failed: ${msg}`).catch(() => {});
    throw err;
  }

  if (opts.dryRun && opts.notify !== false) {
    const res = await sendDryRunSummary(report);
    if (!res.success) {
      log("sheet-sync", `dry-run summary not sent: ${res.error}`);
    }
  }

  if (report.errors.length) {
    await sendToAdminDm(
      `⚠️ Sheet sync partial failure: ${report.errors.join(" | ")}`,
    ).catch(() => {});
  }

  const drift = report.streams.filter((s) => s.driftSuspected);
  if (drift.length) {
    await sendToAdminDm(
      `⚠️ Possible sheet schema drift: ${drift
        .map((s) => `${s.stream} yielded only ${s.scanned} rows`)
        .join(", ")} — check the tab layout.`,
    ).catch(() => {});
  }

  return report;
}

async function sendDryRunSummary(report: SyncReport) {
  return sendToAdminGroup(formatDryRunSummary(report));
}
