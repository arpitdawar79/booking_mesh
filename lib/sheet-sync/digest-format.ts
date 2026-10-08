import type { SheetRow } from "@prisma/client";

const MAX_ROWS_IN_DIGEST = 10;

function rowTag(row: Pick<SheetRow, "sheet" | "rowId">): string {
  const prefix = { expenses: "e", payouts: "p", revenue: "r" }[row.sheet] ?? "x";
  return `${prefix}${row.rowId}`;
}

function describeRow(row: Pick<SheetRow, "rawJson">): string {
  const fields = row.rawJson as Record<string, string>;
  const amount = fields.amount ?? fields.revenue;
  return [
    fields.property,
    fields.particular ?? fields.type,
    amount ? `₹${amount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatDigest(
  rows: SheetRow[],
  linkFor: (row: SheetRow) => string,
  gapsLink: string,
  softGapCount: number,
  deleted: SheetRow[],
  conflicts: SheetRow[],
  importFailed: SheetRow[] = [],
  merged: SheetRow[] = [],
  pendingDups: SheetRow[] = [],
): string {
  const lines: string[] = ["*Ekantah Sheet — incomplete rows*"];
  const shown = rows.slice(0, MAX_ROWS_IN_DIGEST);

  for (const row of shown) {
    lines.push(
      "",
      `*${rowTag(row)}* ${describeRow(row)}`,
      `  missing: ${row.missingRequired.join(", ")}`,
      `  fix: ${linkFor(row)}`,
      `  or reply: ${rowTag(row)} ${row.missingRequired[0]}=...`,
    );
  }
  if (rows.length > shown.length) {
    lines.push("", `…and ${rows.length - shown.length} more`);
  }

  if (conflicts.length) {
    lines.push("", `*${conflicts.length} imported row(s) need admin review:*`);
    for (const row of conflicts.slice(0, 5)) {
      lines.push(`  ${rowTag(row)} ${describeRow(row)}`);
    }
    lines.push(
      `  reply "accept <row>" to pull sheet values in, or "keep <row>" to keep the app record`,
    );
  }

  if (pendingDups.length) {
    lines.push(
      "",
      `*${pendingDups.length} possible duplicate(s) held from import:*`,
    );
    for (const row of pendingDups.slice(0, 5)) {
      const cj = row.conflictJson as { confidence?: number } | null;
      const pct = cj?.confidence ? ` (${Math.round(cj.confidence * 100)}%)` : "";
      lines.push(`  ${rowTag(row)} ${describeRow(row)}${pct}`);
    }
    lines.push(
      "  merge or import these in /dashboard/sheet-sync — accept/keep don't apply until imported",
    );
  }

  if (importFailed.length) {
    lines.push("", `*${importFailed.length} row(s) failed to import:*`);
    for (const row of importFailed.slice(0, 5)) {
      lines.push(`  ${rowTag(row)} ${describeRow(row)} — ${row.importError}`);
    }
  }

  if (deleted.length) {
    lines.push("", `*${deleted.length} row(s) disappeared from the sheet:*`);
    for (const row of deleted.slice(0, 5)) lines.push(`  ${rowTag(row)}`);
  }

  if (merged.length) {
    lines.push(
      "",
      `*${merged.length} row(s) auto-merged as duplicates of existing records:*`,
    );
    for (const row of merged.slice(0, 5)) {
      const cj = row.conflictJson as { merge?: { confidence?: number } } | null;
      const pct = cj?.merge?.confidence
        ? ` (${Math.round(cj.merge.confidence * 100)}%)`
        : "";
      lines.push(`  ${rowTag(row)} ${describeRow(row)}${pct}`);
    }
    lines.push(
      "  _review these in /dashboard/sheet-sync — unlink + import reverts a wrong merge_",
    );
  }

  if (softGapCount > 0) {
    lines.push(
      "",
      `_${softGapCount} rows also missing soft fields (pax, rooms, etc.)_`,
      `sweep all: ${gapsLink}`,
    );
  }

  if (
    rows.length === 0 &&
    !deleted.length &&
    !conflicts.length &&
    !pendingDups.length &&
    !importFailed.length &&
    !merged.length &&
    softGapCount === 0
  ) {
    lines.push("", "all tracked rows complete");
  }
  return lines.join("\n");
}

export { rowTag };
