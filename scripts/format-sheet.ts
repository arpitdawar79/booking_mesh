/**
 * Applies data validations + number formats to the live Drive workbook.
 *
 *   node --env-file=.env --import tsx scripts/format-sheet.ts --dry   # preview locally, no upload
 *   node --env-file=.env --import tsx scripts/format-sheet.ts         # backup + upload
 *
 * Validations are warning-style (dropdown nudges, never hard-blocks) so Ops
 * can still type a new value when the list doesn't cover it.
 */
import { google } from "googleapis";
import { getFileMeta, getGoogleAuth } from "../lib/sheet-sync/google";

const FILE_ID = process.env.SHEET_FILE_ID!;
const EXP_TAB = "9 Sept onwards expenditure";
const REV_TAB = "9 Sept onwards revenue";

const DRY = process.argv.includes("--dry");

const ERROR = {
  showErrorMessage: true,
  errorStyle: "warning" as const,
  errorTitle: "Not in the list",
  error: "Pick from the dropdown if possible — a new value is allowed but may need fixing later.",
};

// -- Dropdown lists built from real values in the sheet ------------------------
const LISTS = {
  property: ["Tirthan", "Doon"],
  paidBy: ["Ekantah", "Anuj", "Arpit", "Ram", "Akshat"],
  beneficiary: ["Anuj", "Arpit", "Akshat", "Ekantah"],
  type: ["Room Tariff", "F&B", "Activity"],
  source: [
    "Walkin",
    "Guest",
    "Direct",
    "Airbnb",
    "MMT",
    "Anuj- direct",
    "Akshat- direct",
    "Arpit- direct",
    "Anuj ref.",
    "Akshat ref.",
    "Guest ref.",
    "Airbnb- Anuj",
    "Airbnb- Akshat",
    "Other",
  ],
  status: ["Full Received", "Partial Received", "Pending", "Cancelled"],
};

type ExcelCell = {
  dataValidation?: object;
};

function applyList(
  worksheet: { getCell(a: string): ExcelCell },
  col: string,
  fromRow: number,
  toRow: number,
  values: string[],
  prompt: string,
) {
  const formulae = [`"${values.join(",")}"`];
  if (formulae[0].length > 250) {
    throw new Error(`list for ${col} too long for inline formula`);
  }
  for (let r = fromRow; r <= toRow; r++) {
    worksheet.getCell(`${col}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae,
      showInputMessage: true,
      promptTitle: col,
      prompt,
      ...ERROR,
    };
  }
}

function applyDate(
  worksheet: { getCell(a: string): ExcelCell },
  col: string,
  fromRow: number,
  toRow: number,
  prompt: string,
) {
  for (let r = fromRow; r <= toRow; r++) {
    worksheet.getCell(`${col}${r}`).dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: [new Date(2025, 0, 1), new Date(2030, 11, 31)],
      showInputMessage: true,
      promptTitle: "Date",
      prompt,
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Unusual date",
      error: 'Formats like "10 Sep 2026" work best. Text like "10th Sep" also works.',
    };
  }
}

function applyPositiveNumber(
  worksheet: { getCell(a: string): ExcelCell },
  col: string,
  fromRow: number,
  toRow: number,
  prompt: string,
) {
  for (let r = fromRow; r <= toRow; r++) {
    worksheet.getCell(`${col}${r}`).dataValidation = {
      type: "decimal",
      operator: "greaterThan",
      allowBlank: true,
      formulae: [0],
      showInputMessage: true,
      promptTitle: "Amount",
      prompt,
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid amount",
      error: "Amount must be a positive number.",
    };
  }
}

function applyWholeNumber(
  worksheet: { getCell(a: string): ExcelCell },
  col: string,
  fromRow: number,
  toRow: number,
  prompt: string,
) {
  for (let r = fromRow; r <= toRow; r++) {
    worksheet.getCell(`${col}${r}`).dataValidation = {
      type: "whole",
      operator: "greaterThanOrEqual",
      allowBlank: true,
      formulae: [0],
      showInputMessage: true,
      promptTitle: col,
      prompt,
      ...ERROR,
    };
  }
}

async function main() {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });
  const meta = await getFileMeta(FILE_ID);
  console.log(`file: ${meta.name} (${meta.mimeType})`);

  const dl = await drive.files.get(
    { fileId: FILE_ID, alt: "media" },
    { responseType: "arraybuffer" },
  );
  const buffer = Buffer.from(dl.data as ArrayBuffer);
  console.log(`downloaded ${buffer.length} bytes`);

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const exp = workbook.getWorksheet(EXP_TAB);
  const rev = workbook.getWorksheet(REV_TAB);
  if (!exp || !rev) {
    throw new Error(
      `tabs missing (found: ${workbook.worksheets.map((w) => w.name).join(", ")})`,
    );
  }

  // ---- Expenditure tab -----------------------------------------------------
  // A: S.No   B: Date   C: Property   D: Particular   E: Amount   F: Paid by
  // H: Payout Date   I: Amount   J: Beneficiary
  const EXP_END = 1000;
  applyWholeNumber(exp, "A", 3, EXP_END, "Serial number (integer)");
  applyDate(exp, "B", 3, EXP_END, 'Expense date, e.g. "10 Sep 2026"');
  applyList(exp, "C", 3, EXP_END, LISTS.property, "Property");
  applyPositiveNumber(exp, "E", 3, EXP_END, "Amount in ₹ (numbers only)");
  applyList(exp, "F", 3, EXP_END, LISTS.paidBy, "Who paid");
  applyDate(exp, "H", 3, EXP_END, "Payout date");
  applyPositiveNumber(exp, "I", 3, EXP_END, "Payout amount in ₹");
  applyList(exp, "J", 3, EXP_END, LISTS.beneficiary, "Who received the payout");

  // ---- Revenue tab ---------------------------------------------------------
  // A S.No | B Property | C Revenue | D Type | E Guest | F Date of Sale |
  // G Stay Dates | H #Rooms | I Pax | J Source | K Recd by | L Status | M Comments
  const REV_END = 4000;
  applyWholeNumber(rev, "A", 3, REV_END, "Serial number (integer)");
  applyList(rev, "B", 3, REV_END, LISTS.property, "Property");
  applyPositiveNumber(rev, "C", 3, REV_END, "Revenue in ₹ (numbers only)");
  applyList(rev, "D", 3, REV_END, LISTS.type, "Sale type");
  applyDate(rev, "F", 3, REV_END, 'Date the sale was made, e.g. "10 Sep 2026"');
  applyWholeNumber(rev, "H", 3, REV_END, "Number of rooms");
  applyWholeNumber(rev, "I", 3, REV_END, "Number of guests");
  applyList(rev, "J", 3, REV_END, LISTS.source, "Booking source");
  applyList(rev, "K", 3, REV_END, LISTS.paidBy, "Who received the money");
  applyList(rev, "L", 3, REV_END, LISTS.status, "Payment status");

  // Stay dates (G) is free text ("12th-14th Oct") — input prompt only so
  // entry isn't blocked but the expected format is visible.
  for (let r = 3; r <= REV_END; r++) {
    rev.getCell(`G${r}`).dataValidation = {
      type: "textLength",
      operator: "greaterThanOrEqual",
      allowBlank: true,
      formulae: [0],
      showInputMessage: true,
      promptTitle: "Stay dates",
      prompt: 'e.g. "12th-14th Oct" or "28th Oct - 1st Nov"',
    };
  }

  // ---- Number formats ------------------------------------------------------
  exp.getColumn(5).numFmt = '"₹"#,##0'; // E: expense amount
  exp.getColumn(9).numFmt = '"₹"#,##0'; // I: payout amount
  rev.getColumn(3).numFmt = '"₹"#,##0'; // C: revenue
  exp.getColumn(1).numFmt = "0"; // S.No
  rev.getColumn(1).numFmt = "0";
  rev.getColumn(8).numFmt = "0"; // rooms
  rev.getColumn(9).numFmt = "0"; // pax

  const out = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  console.log(`modified workbook: ${out.length} bytes`);

  if (DRY) {
    const { writeFile } = await import("fs/promises");
    await writeFile("sheet-formatted-preview.xlsx", out);
    console.log("DRY RUN — wrote sheet-formatted-preview.xlsx (nothing uploaded)");
    return;
  }

  // Safety backup: a dated local copy before we overwrite the live file.
  // (Service accounts have no Drive storage quota, so files.copy can't work.)
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
  console.log("uploaded — live workbook updated with validations + formats");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
