import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { SheetRow } from "@prisma/client";
import { SHEET_STREAMS } from "./config";
import type { SheetStreamDef } from "./config";
import {
  acceptSheetIntoLinkedRecord,
  keepLinkedRecord,
} from "./ledger";
import { applyRowPatches } from "./patches";
import { runSheetSync } from "./sync";

export type ReplyFn = (message: string) => Promise<unknown>;

const PREFIX: Record<string, string> = {
  e: "expenses",
  r: "revenue",
  p: "payouts",
};

const FIELD_ALIASES: Record<string, Record<string, string>> = {
  expenses: {
    date: "date",
    property: "property",
    particular: "particular",
    desc: "particular",
    amount: "amount",
    amt: "amount",
    paidby: "paidBy",
    paid: "paidBy",
    by: "paidBy",
  },
  payouts: {
    date: "date",
    amount: "amount",
    amt: "amount",
    beneficiary: "beneficiary",
    to: "beneficiary",
  },
  revenue: {
    property: "property",
    revenue: "revenue",
    amount: "revenue",
    amt: "revenue",
    type: "type",
    guest: "guestName",
    guestname: "guestName",
    name: "guestName",
    sale: "dateOfSale",
    dateofsale: "dateOfSale",
    stay: "stayDates",
    staydates: "stayDates",
    rooms: "rooms",
    pax: "pax",
    source: "source",
    recd: "receivedBy",
    receivedby: "receivedBy",
    status: "status",
    comments: "comments",
    notes: "comments",
  },
};

const streamDef = (key: string): SheetStreamDef | undefined =>
  SHEET_STREAMS.find((s) => s.key === key);

export function rowTag(row: Pick<SheetRow, "sheet" | "rowId">): string {
  const prefix =
    Object.entries(PREFIX).find(([, v]) => v === row.sheet)?.[0] ?? "x";
  return `${prefix}${row.rowId}`;
}

async function resolveRef(ref: string): Promise<SheetRow[] | SheetRow | null> {
  const m = ref.toLowerCase().match(/^([epr]?)(r)?(\d+)$/);
  if (!m) return null;
  const digits = m[3];
  // Payout rows have no S.No — their rowId is `r{rowNum}`, tagged "pr{n}".
  const candidates: { sheet: string; rowId: string }[] = [];
  if (m[1] === "p") candidates.push({ sheet: "payouts", rowId: `r${digits}` });
  else if (m[1] === "e") candidates.push({ sheet: "expenses", rowId: digits });
  else if (m[1] === "r") {
    candidates.push({ sheet: "revenue", rowId: digits });
    if (m[2]) candidates.push({ sheet: "payouts", rowId: `r${digits}` });
  } else {
    for (const sheet of Object.values(PREFIX)) {
      candidates.push({ sheet, rowId: digits });
    }
  }
  const rows = await prisma.sheetRow.findMany({ where: { OR: candidates } });
  if (rows.length === 0) return null;
  return rows.length === 1 ? rows[0] : rows;
}

const HELP = [
  `Sheet commands:`,
  `• e182 amount=500 → fill a field`,
  `• e182 particular="Dinner supplies" → quotes for multi-word values`,
  `• skip e182 → stop nags for a row`,
  `• later e182 3d → snooze 3 days`,
  `• accept r10 → apply sheet changes to the imported record`,
  `• keep r10 → keep the app record, ignore the sheet change`,
  `• unlink r10 → detach the imported record`,
  `• status → sync summary`,
  `• sync → pull the sheet now`,
  `prefixes: e=expense r=revenue pr=payout`,
].join("\n");

async function applyPatches(
  row: SheetRow,
  pairs: [string, string][],
): Promise<{
  updated: string[];
  unknown: string[];
  stillMissing: string[];
  rejectedStatus?: string;
}> {
  const def = streamDef(row.sheet);
  if (!def) {
    return { updated: [], unknown: pairs.map(([k]) => k), stillMissing: [] };
  }

  const aliases = FIELD_ALIASES[row.sheet] ?? {};
  const values: Record<string, string> = {};
  const unknown: string[] = [];

  for (const [key, value] of pairs) {
    const field = aliases[key.toLowerCase()] ?? null;
    if (!field || !def.fields.some((f) => f.key === field)) {
      unknown.push(key);
      continue;
    }
    values[field] = value;
  }

  const { updated, stillMissing, rejectedStatus } = await applyRowPatches(
    row,
    values,
    "whatsapp",
  );
  return { updated, unknown, stillMissing, rejectedStatus };
}

async function snooze(row: SheetRow, dur: string): Promise<string | null> {
  const m = dur.match(/^(\d+)\s*([dwh])$/i);
  if (!m) return null;
  const n = +m[1];
  const unit = m[2].toLowerCase();
  const ms = unit === "w" ? 7 * 86400_000 : unit === "h" ? 3600_000 : 86400_000;
  const until = new Date(Date.now() + n * ms);
  await prisma.sheetRow.update({
    where: { id: row.id },
    data: { status: "snoozed", snoozedUntil: until },
  });
  return until.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Parses one incoming admin-group message. Returns silently (no reply)
 * for anything that isn't a command — the group is for humans too.
 */
export async function handleSheetCommand(
  reply: ReplyFn,
  text: string,
): Promise<void> {
  const t = text.trim();
  if (!t) return;
  const lower = t.toLowerCase();

  if (lower === "help" || lower === "sheet help") {
    await reply(HELP);
    return;
  }

  if (lower === "status") {
    const [incomplete, soft, lastSync] = await Promise.all([
      prisma.sheetRow.count({
        where: { status: { in: ["incomplete", "nagged", "snoozed"] } },
      }),
      prisma.sheetRow.count({
        where: {
          status: {
            notIn: ["legacy", "deleted", "skipped", "conflict"],
          },
          missingSoft: { isEmpty: false },
        },
      }),
      prisma.appConfig.findUnique({ where: { key: "sheet.lastSyncAt" } }),
    ]);
    await reply(
      `📊 sheet: ${incomplete} incomplete, ${soft} soft-gap rows\n` +
        `last sync: ${lastSync?.value ?? "never"}`,
    );
    return;
  }

  if (lower === "sync") {
    await reply("⏳ syncing sheet…");
    try {
      const report = await runSheetSync({});
      const total = report.streams.reduce((a, s) => a + s.scanned, 0);
      const inc = report.streams.reduce((a, s) => a + s.incomplete, 0);
      await reply(
        report.errors.length
          ? `⚠️ sync had errors: ${report.errors.join(" | ")}`
          : `✅ synced ${total} rows — ${inc} incomplete`,
      );
    } catch (err) {
      await reply(
        `❌ sync failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return;
  }

  const cmd = lower.match(
    /^(skip|later|accept|keep|unlink)\s+([epr]?r?\d+)(?:\s+(\S+))?$/,
  );
  if (cmd) {
    const found = await resolveRef(cmd[2]);
    if (!found) {
      await reply(`no row matching "${cmd[2]}"`);
      return;
    }
    if (Array.isArray(found)) {
      await reply(
        `ambiguous "${cmd[2]}" — use ${found.map(rowTag).join(" / ")}`,
      );
      return;
    }
    if (cmd[1] === "accept") {
      const ok = await acceptSheetIntoLinkedRecord(found);
      await reply(
        ok
          ? `✅ ${rowTag(found)} — sheet values applied to the record`
          : `⚠️ ${rowTag(found)} isn't linked to a record`,
      );
      return;
    }
    if (cmd[1] === "keep") {
      const ok = await keepLinkedRecord(found);
      await reply(
        ok
          ? `✅ ${rowTag(found)} — app record kept, sheet divergence ignored`
          : `⚠️ ${rowTag(found)} isn't linked to a record`,
      );
      return;
    }
    if (cmd[1] === "unlink") {
      if (!found.linkedRecordId && !found.linkedRecordType) {
        await reply(`⚠️ ${rowTag(found)} isn't linked to a record`);
        return;
      }
      await prisma.sheetRow.update({
        where: { id: found.id },
        data: {
          linkedRecordId: null,
          linkedRecordType: null,
          linkedRowHash: null,
          conflictJson: Prisma.JsonNull,
          status: "complete",
        },
      });
      await reply(
        `🔓 ${rowTag(found)} unlinked — the record stays but is no longer synced`,
      );
      return;
    }
    if (cmd[1] === "skip") {
      await prisma.sheetRow.update({
        where: { id: found.id },
        data: { status: "skipped", snoozedUntil: null },
      });
      await reply(`🤐 ${rowTag(found)} skipped — nags stopped`);
      return;
    }
    const until = cmd[3] ? await snooze(found, cmd[3]) : null;
    await reply(
      until
        ? `😴 ${rowTag(found)} snoozed until ${until}`
        : `usage: later ${rowTag(found)} 3d (d/w/h)`,
    );
    return;
  }

  // patch form: "<ref> field=value field=value ..."
  const patch = t.match(/^([epr]?r?\d+)\s+(.*)$/);
  if (patch && patch[2].includes("=")) {
    const found = await resolveRef(patch[1]);
    if (!found) return; // not a command, likely human chatter
    if (Array.isArray(found)) {
      await reply(
        `ambiguous "${patch[1]}" — use ${found.map(rowTag).join(" / ")}`,
      );
      return;
    }

    const pairs = [...patch[2].matchAll(/(\S+?)=((?:"[^"]*")|(?:\S+))/g)].map(
      (m) => [m[1], m[2].replace(/^"|"$/g, "")] as [string, string],
    );
    if (!pairs.length) return;

    const { updated, unknown, stillMissing, rejectedStatus } =
      await applyPatches(found, pairs);
    if (rejectedStatus) {
      await reply(
        `⚠️ ${rowTag(found)} is ${rejectedStatus} — not editable via chat`,
      );
      return;
    }
    const parts: string[] = [];
    if (updated.length) parts.push(`set ${updated.join(", ")}`);
    if (unknown.length) parts.push(`unknown field(s): ${unknown.join(", ")}`);
    if (!stillMissing.length && updated.length) {
      await reply(`✅ ${rowTag(found)} ${parts.join("; ")} — row complete`);
    } else if (parts.length) {
      await reply(
        `📝 ${rowTag(found)} ${parts.join("; ")}` +
          (stillMissing.length
            ? `\nstill missing: ${stillMissing.join(", ")}`
            : ""),
      );
    }
    return;
  }
  // anything else: human chatter, ignore
}
