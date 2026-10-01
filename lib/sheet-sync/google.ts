import { readFile } from "fs/promises";
import ExcelJS from "exceljs";
import { google } from "googleapis";
import type { SheetMatrix } from "./parse";

export function getGoogleAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const credentials = json
    ? JSON.parse(json)
    : {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "Google service account not configured (GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)",
    );
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      // Full drive scope: drive.file only covers files the app created itself,
      // and this workbook predates the service account.
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
}

export interface SheetFileMeta {
  fileId: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
}

export async function getFileMeta(fileId: string): Promise<SheetFileMeta> {
  const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
  const res = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,modifiedTime",
  });
  return {
    fileId,
    name: res.data.name ?? "",
    mimeType: res.data.mimeType ?? "",
    modifiedTime: res.data.modifiedTime ?? null,
  };
}

const toMatrix = (values: unknown[][] | undefined): SheetMatrix =>
  (values ?? []).map((row) => (row ?? []).map((value) => (value ?? "").toString()));

// Emit raw cell values — no format-based interpretation. Google Sheets
// round-trips this Drive-hosted xlsx and mangles number formats, so numFmt
// cannot be trusted to decide "is this a date". Serial-looking values in
// actual date columns are handled by parseSheetDate's serial branch.
function cellToText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return String(value);
  return cell.text ?? "";
}

function worksheetToMatrix(worksheet: ExcelJS.Worksheet): SheetMatrix {
  const matrix: SheetMatrix = [];
  const maxColumn = worksheet.columnCount;
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const values: string[] = [];
    for (let column = 1; column <= maxColumn; column++) {
      values.push(cellToText(row.getCell(column)));
    }
    matrix.push(values);
  }
  return matrix;
}

async function loadWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  return workbook;
}

function workbookTabs(
  workbook: ExcelJS.Workbook,
  tabNames: string[],
): Map<string, SheetMatrix> {
  const result = new Map<string, SheetMatrix>();
  for (const tabName of tabNames) {
    const worksheet = workbook.getWorksheet(tabName);
    if (!worksheet) {
      throw new Error(
        `Tab "${tabName}" not found in xlsx (tabs: ${workbook.worksheets.map((sheet) => sheet.name).join(", ")})`,
      );
    }
    result.set(tabName, worksheetToMatrix(worksheet));
  }
  return result;
}

/**
 * Fetches all requested tabs together. Native Google Sheets use one batchGet;
 * xlsx files are downloaded and parsed once per sync.
 */
export async function fetchTabs(
  meta: SheetFileMeta,
  tabNames: string[],
): Promise<Map<string, SheetMatrix>> {
  if (meta.mimeType === "application/vnd.google-apps.spreadsheet") {
    const sheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: meta.fileId,
      ranges: tabNames.map((tabName) => `'${tabName}'`),
      valueRenderOption: "FORMATTED_VALUE",
    });
    const result = new Map<string, SheetMatrix>();
    tabNames.forEach((tabName, index) => {
      result.set(
        tabName,
        toMatrix(response.data.valueRanges?.[index]?.values as unknown[][]),
      );
    });
    return result;
  }

  const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
  const response = await drive.files.get(
    { fileId: meta.fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
  const workbook = await loadWorkbook(Buffer.from(response.data as ArrayBuffer));
  return workbookTabs(workbook, tabNames);
}

/**
 * Parses a local .xlsx file (used by tests/dev without Drive access).
 */
export async function matricesFromLocalXlsx(
  filePath: string,
  tabNames: string[],
): Promise<Map<string, SheetMatrix>> {
  const workbook = await loadWorkbook(await readFile(filePath));
  return workbookTabs(workbook, tabNames);
}
