/**
 * Normalizes every date cell in the live workbook and fixes the two empty
 * Date-of-Sale cells by interpolation from neighbours.
 *
 *   node --env-file=.env --import tsx scripts/fix-sheet-dates.ts --dry
 *   node --env-file=.env --import tsx scripts/fix-sheet-dates.ts        # backup + upload
 */
import { google } from "googleapis";
import type ExcelJS from "exceljs";
import { getFileMeta, getGoogleAuth } from "../lib/sheet-sync/google";
import { excelSerialToDate, parseSheetDate } from "../lib/sheet-sync/dates";

const FILE_ID = process.env.SHEET_FILE_ID!;
const EXP_TAB = "9 Sept onwards expenditure";
const REV_TAB = "9 Sept onwards revenue";
const DRY = process.argv.includes("--dry");
const DATE_FMT = "dd-mmm-yy"; // unambiguous everywhere — kills mm/dd ambiguity

type Ws = ExcelJS.Worksheet;

const changes: string[] = [];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
// Text dates are bulletproof: they render the same in Sheets/Excel regardless
// of the cell's stored number format (this workbook carries '@'/serial quirks).
function toText(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Normalize a date column: parseable values become uniform "d MMM yyyy" text. */
function normalizeDateCol(
  ws: Ws,
  tab: string,
  col: string,
  fromRow: number,
  toRow: number,
) {
  const hint = { year: 2025, lastMonth: 0 };
  for (let r = fromRow; r <= toRow; r++) {
    const cell = ws.getCell(`${col}${r}`);
    const sno = ws.getCell(`A${r}`).text.trim();
    const isDataRow = /^\d/.test(sno);
    if (!isDataRow) continue;

    let parsed: Date | null = null;
    let label = "";
    if (cell.value instanceof Date) {
      parsed = cell.value;
      label = cell.value.toISOString().slice(0, 10);
    } else if (typeof cell.value === "number") {
      parsed = excelSerialToDate(cell.value);
      label = `serial ${cell.value}`;
    } else {
      label = cell.text.trim();
      if (label) parsed = parseSheetDate(label, hint);
    }
    if (!label) continue;
    if (!parsed) {
      changes.push(`${tab}!${col}${r} UNPARSEABLE "${label}" (left as-is)`);
      continue;
    }
    const text = toText(parsed);
    if (cell.text.trim() !== text) {
      cell.value = text;
      cell.numFmt = "@"; // pin as text so no layer can re-mangle it
      changes.push(`${tab}!${col}${r} "${label}" → "${text}"`);
    }
  }
}

function setDateCell(ws: Ws, tab: string, ref: string, value: Date, note: string) {
  const cell = ws.getCell(ref);
  cell.value = toText(value);
  cell.numFmt = "@";
  changes.push(`${tab}!${ref} → "${toText(value)}" (${note})`);
}

async function main() {
  const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
  const meta = await getFileMeta(FILE_ID);
  const dl = await drive.files.get(
    { fileId: FILE_ID, alt: "media" },
    { responseType: "arraybuffer" },
  );
  const buffer = Buffer.from(dl.data as ArrayBuffer);

  const ExcelJSImport = (await import("exceljs")).default;
  const workbook = new ExcelJSImport.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const exp = workbook.getWorksheet(EXP_TAB);
  const rev = workbook.getWorksheet(REV_TAB);
  if (!exp || !rev) throw new Error("expected tabs missing");

  // --- normalize the three date columns ------------------------------------
  normalizeDateCol(exp, EXP_TAB, "B", 3, exp.rowCount); // expense date
  normalizeDateCol(exp, EXP_TAB, "H", 3, exp.rowCount); // payout date
  normalizeDateCol(rev, REV_TAB, "F", 3, rev.rowCount); // date of sale

  // --- fix the future-dated typo -------------------------------------------
  // B108 sits inside the Feb-4/5 2026 batch but holds 2026-12-04 (Dec 4),
  // which is in the future. The neighbouring Garbage/Feb-4 rows make
  // Feb 4 2026 the credible intent.
  const b108 = exp.getCell("B108");
  if (
    b108.value instanceof Date &&
    b108.value.toISOString().slice(0, 10) === "2026-12-04"
  ) {
    setDateCell(
      exp,
      EXP_TAB,
      "B108",
      new Date(Date.UTC(2026, 1, 4)),
      "was 2026-12-04, a future date inside the Feb batch — assumed Feb 4",
    );
  }

  // --- fill the two empty Date-of-Sale cells by neighbour interpolation ----
  if (!rev.getCell("F12").text.trim()) {
    setDateCell(
      rev,
      REV_TAB,
      "F12",
      new Date(Date.UTC(2026, 9, 11)),
      "inferred: between sale 3rd Oct and stay 12th-13th Oct",
    );
  }
  if (!rev.getCell("F15").text.trim()) {
    setDateCell(
      rev,
      REV_TAB,
      "F15",
      new Date(Date.UTC(2026, 9, 24)),
      "inferred: between sale 23rd Oct and sale 24th Oct",
    );
  }

  // --- stay-dates column: force text format so Sheets stops mangling it ----
  for (let r = 3; r <= rev.rowCount; r++) {
    const c = rev.getCell(`G${r}`);
    if (c.text.trim() && c.numFmt !== "@") c.numFmt = "@";
  }

  console.log(changes.join("\n"));
  console.log(`\n${changes.length} cell changes`);

  const out = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  if (DRY) {
    const { writeFile } = await import("fs/promises");
    await writeFile("sheet-dates-preview.xlsx", out);
    console.log("DRY RUN — wrote sheet-dates-preview.xlsx (nothing uploaded)");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const { mkdir, writeFile } = await import("fs/promises");
  await mkdir("backups", { recursive: true });
  const backupPath = `backups/ekantah-master-sheet-${stamp}.xlsx`;
  await writeFile(backupPath, buffer);
  console.log(`local backup written: ${backupPath}`);

  await drive.files.update({
    fileId: FILE_ID,
    media: {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: out,
    },
  });
  console.log("uploaded — live workbook dates normalized");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
