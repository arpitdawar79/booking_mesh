import { createHash } from "crypto";
import type { SheetStreamDef } from "./config";
import { parseSheetDate, parseStayRange } from "./dates";

export type RowValues = string[]; // one row, indexed by column
export type SheetMatrix = RowValues[];

export interface ParsedRow {
  stream: string;
  rowId: string;
  rowNum: number; // 1-based physical row
  fields: Record<string, string>;
  parsedDate: Date | null;
  dateUnparsed: boolean;
  rowHash: string;
}

const cell = (row: RowValues | undefined, col: number): string =>
  (row?.[col] ?? "").toString().trim();

export function hashFields(fields: Record<string, string>): string {
  return createHash("sha256")
    .update(JSON.stringify(fields))
    .digest("hex")
    .slice(0, 16);
}

function isBlankRow(row: RowValues | undefined, cols: number[]): boolean {
  return cols.every((c) => !cell(row, c));
}

/**
 * Converts a raw tab matrix into normalized records for one logical stream.
 * Rows missing a numeric S.No (when rowIdField is configured) are skipped —
 * they're headers, totals or section labels.
 */
/**
 * The tab's own title row (e.g. "9th Sept 2025 onwards") declares the epoch
 * year for year-less dates like "10th Sep". Falls back to `fallbackYear`.
 */
export function inferBaseYear(
  matrix: SheetMatrix,
  headerRow: number,
  fallbackYear: number,
): number {
  for (let i = 0; i < Math.min(headerRow, matrix.length); i++) {
    for (const cell of matrix[i] ?? []) {
      const m = /\b(20\d{2})\b/.exec(cell);
      if (m) return +m[1];
    }
  }
  return fallbackYear;
}

export function parseStream(
  stream: SheetStreamDef,
  matrix: SheetMatrix,
  baseYear: number,
): ParsedRow[] {
  const out: ParsedRow[] = [];
  const cols = stream.fields.map((f) => f.col);
  const yearHint = { year: baseYear, lastMonth: 0 };

  for (let i = stream.headerRow; i < matrix.length; i++) {
    const row = matrix[i];
    const rowNum = i + 1;
    if (isBlankRow(row, cols)) continue;

    const fields: Record<string, string> = {};
    for (const f of stream.fields) fields[f.key] = cell(row, f.col);

    let rowId: string;
    if (stream.rowIdField) {
      const raw = fields[stream.rowIdField];
      const n = parseFloat(raw);
      rowId = Number.isFinite(n) ? String(Math.trunc(n)) : "";
      if (!rowId) continue; // non-data row (total, label, etc.)
      const hasData = stream.activationFields.some((key) => fields[key]);
      if (!hasData) continue;
    } else {
      rowId = `r${rowNum}`;
    }

    let parsedDate: Date | null = null;
    if (stream.dateField) {
      parsedDate = parseSheetDate(fields[stream.dateField] ?? "", yearHint);
    }

    out.push({
      stream: stream.key,
      rowId,
      rowNum,
      fields,
      parsedDate,
      dateUnparsed: !!stream.dateField && !parsedDate,
      rowHash: hashFields(fields),
    });
  }
  return out;
}

export interface Judgement {
  missingRequired: string[];
  missingSoft: string[];
}

export function effectiveFields(
  fields: Record<string, string>,
  patches?: Record<string, { value: string }> | null,
): Record<string, string> {
  const effective = { ...fields };
  if (patches) {
    for (const [key, patch] of Object.entries(patches)) {
      if (patch && typeof patch.value === "string" && patch.value.trim()) {
        effective[key] = patch.value.trim();
      }
    }
  }
  return effective;
}

function addMissing(target: string[], key: string) {
  if (!target.includes(key)) target.push(key);
}

function validPositiveAmount(raw: string) {
  const amount = Number(raw.replace(/[₹,\s]/g, ""));
  return Number.isFinite(amount) && amount > 0;
}

export function judgeRow(
  stream: SheetStreamDef,
  fields: Record<string, string>,
  patches?: Record<string, { value: string }> | null,
  parsedDate?: Date | null,
): Judgement {
  const effective = effectiveFields(fields, patches);
  const missingRequired: string[] = [];
  const missingSoft: string[] = [];

  for (const field of stream.fields) {
    if (field.key === stream.rowIdField) continue;
    if (!effective[field.key]) {
      addMissing(
        field.severity === "required" ? missingRequired : missingSoft,
        field.key,
      );
    }
  }

  if (stream.dateField && !parsedDate) {
    addMissing(missingRequired, stream.dateField);
    const softIndex = missingSoft.indexOf(stream.dateField);
    if (softIndex >= 0) missingSoft.splice(softIndex, 1);
  }

  const amountField = stream.key === "revenue" ? "revenue" : "amount";
  if (effective[amountField] && !validPositiveAmount(effective[amountField])) {
    addMissing(missingRequired, amountField);
  }

  if (stream.key === "revenue") {
    const isRoomTariff = /room|tariff|stay|accommodation/i.test(
      effective.type ?? "",
    );
    if (isRoomTariff) {
      if (!effective.guestName) addMissing(missingRequired, "guestName");
      if (!effective.stayDates || !parseStayRange(effective.stayDates, parsedDate ?? null)) {
        addMissing(missingRequired, "stayDates");
      }
      for (const key of ["guestName", "stayDates"]) {
        const softIndex = missingSoft.indexOf(key);
        if (softIndex >= 0) missingSoft.splice(softIndex, 1);
      }
    }
    if (/partial/i.test(effective.status ?? "") && !effective.comments) {
      addMissing(missingRequired, "comments");
      const softIndex = missingSoft.indexOf("comments");
      if (softIndex >= 0) missingSoft.splice(softIndex, 1);
    }
  }

  return { missingRequired, missingSoft };
}
