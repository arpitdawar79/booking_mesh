import {
  sendWhatsAppGroupMessage,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";
import { sheetSyncEnv } from "./config";
import type { SyncReport } from "./sync";

export async function sendToAdminGroup(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const jid = sheetSyncEnv.adminGroupJid();
  if (!jid) return { success: false, error: "ADMIN_GROUP_JID not configured" };
  return sendWhatsAppGroupMessage(jid, message);
}

export async function sendToAdminDm(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const jid = sheetSyncEnv.adminDmJid();
  if (!jid) return { success: false, error: "ADMIN_DM_JID not configured" };
  return sendWhatsAppMessage(jid, message);
}

export function formatDryRunSummary(report: SyncReport): string {
  const lines = [
    `📋 *Sheet sync — dry run*`,
    `file: ${report.fileName}`,
    ``,
  ];
  for (const s of report.streams) {
    const parts = [
      `${s.scanned} rows`,
      s.incomplete ? `${s.incomplete} incomplete` : null,
      s.softGaps ? `${s.softGaps} soft-field gaps` : null,
      s.legacy ? `${s.legacy} legacy (pre-cutoff)` : null,
      s.unparsedDateRows.length
        ? `⚠️ ${s.unparsedDateRows.length} unparsed dates`
        : null,
    ].filter(Boolean);
    lines.push(`*${s.stream}*: ${parts.join(" · ")}`);
  }
  if (report.errors.length) {
    lines.push(``, `❌ errors: ${report.errors.join(" | ")}`);
  }
  lines.push(``, `_No nags sent — this was a preview._`);
  return lines.join("\n");
}
