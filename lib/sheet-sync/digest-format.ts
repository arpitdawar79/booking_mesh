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
    !importFailed.length &&
    softGapCount === 0
  ) {
    lines.push("", "all tracked rows complete");
  }
  return lines.join("\n");
}

export { rowTag };
