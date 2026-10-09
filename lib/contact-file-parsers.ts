export interface ParsedContact {
  name?: string;
  phones: string[];
  email?: string;
}

/**
 * Parses a vCard file (Apple/Google/WhatsApp exports). Each phone number
 * becomes its own entry so imports never lose alternate numbers.
 */
export function parseVcf(text: string): ParsedContact[] {
  const unfolded = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
  const result: ParsedContact[] = [];
  let current: ParsedContact | null = null;

  for (const line of unfolded.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === "BEGIN:VCARD") {
      current = { phones: [] };
      continue;
    }
    if (!current) continue;
    if (trimmed.toUpperCase() === "END:VCARD") {
      if (current.phones.length > 0) result.push(current);
      current = null;
      continue;
    }

    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).split(";")[0].split(".").pop()!.toUpperCase();
    const value = trimmed.slice(separator + 1).trim();
    if (!value) continue;

    if (key === "FN") {
      current.name = value.replace(/\\([nN,;\\])/g, (_, escaped: string) => /[nN]/.test(escaped) ? " " : escaped);
    } else if (key === "N" && !current.name) {
      const [family, given, middle] = value.split(";");
      current.name = [given, middle, family].filter(Boolean).join(" ");
    } else if (key === "TEL") {
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 7 && digits.length <= 15) current.phones.push(value);
    } else if (key === "EMAIL" && !current.email) {
      current.email = value.split(",").map((e) => e.trim()).filter(Boolean)[0];
    }
  }

  return result;
}

const PHONE_HEADER = /(phone|mobile|cell)/i;
const NAME_HEADER = /^(full name|display name|name)$/i;
const EMAIL_HEADER = /e-?mail/i;

/**
 * Parses a contacts CSV export (Google Contacts, Apple/iCloud, WhatsApp).
 * Header row is required; phone/email/name columns are matched by header.
 */
export function parseContactsCsv(text: string): ParsedContact[] {
  const rows = splitCsv(text);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const phoneCols = header
    .map((h, i) => (PHONE_HEADER.test(h) && !/type/i.test(h) ? i : -1))
    .filter((i) => i !== -1);
  if (phoneCols.length === 0) return [];

  const nameCols = header
    .map((h, i) => (/^(given name|first name|additional name|middle name|family name|last name)$/.test(h) ? i : -1))
    .filter((i) => i !== -1);
  const displayNameCol = header.findIndex((h) => NAME_HEADER.test(h));
  const emailCols = header
    .map((h, i) => (EMAIL_HEADER.test(h) && !/type/i.test(h) ? i : -1))
    .filter((i) => i !== -1);

  const result: ParsedContact[] = [];
  for (const row of rows.slice(1)) {
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;
    const phones = phoneCols
      .flatMap((i) => (row[i] ?? "").split(/\s*:::\s*/).map((p) => p.trim()))
      .filter((p) => p.replace(/\D/g, "").length >= 7);
    if (phones.length === 0) continue;

    const name = (row[displayNameCol] ?? "").trim() ||
      nameCols
        .map((i) => (row[i] ?? "").trim())
        .filter(Boolean)
        .join(" ")
        .trim() || undefined;
    const email =
      emailCols.map((i) => (row[i] ?? "").trim()).find(Boolean) ?? undefined;

    result.push({ name, email, phones });
  }
  return result;
}

function splitCsv(text: string): string[][] {
  const headerLine = text.split(/\r?\n/, 1)[0];
  const counts = [",", "\t", ";"].map((separator) => ({ separator, count: (headerLine.match(new RegExp(separator, "g")) ?? []).length }));
  const delimiter = counts.sort((a, b) => b.count - a.count)[0].separator;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
