const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/**
 * Parses the sheet's free-text dates: "10th Sep", "27th Sept", "7th June 2026",
 * "28th-30th October" (range → first day), "12th-13th Oct", ISO-ish "2026-06-07".
 * Returns null when unparseable.
 */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
export function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 30000 || serial > 80000) return null;
  return new Date(EXCEL_EPOCH_MS + Math.floor(serial) * 86400_000);
}

export function parseSheetDate(
  raw: string,
  yearHint: { year: number; lastMonth: number },
): Date | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  // Bare Excel serial ("45909") — cells whose format got mangled to text.
  if (/^\d{5}(?:\.\d+)?$/.test(s)) return excelSerialToDate(Number(s));

  // ISO / unambiguous numeric dates first
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return makeDate(+iso[1], +iso[2], +iso[3]);

  // "28th-30th October" / "10th Sep" / "7th June 2026"
  const m = s.match(
    /(\d{1,2})(?:st|nd|rd|th)?(?:\s*[-–]\s*\d{1,2}(?:st|nd|rd|th)?)?\s+([a-z]+)\.?\s*(\d{4})?/,
  );
  if (m) {
    const day = +m[1];
    const mon = MONTHS[m[2]];
    if (mon && day >= 1 && day <= 31) {
      let year = m[3] ? +m[3] : yearHint.year;
      if (!m[3]) {
        // Year rollover: month jumps backward >3 months → next year (Sep→Jan)
        if (yearHint.lastMonth && mon < yearHint.lastMonth - 3) {
          yearHint.year += 1;
          year = yearHint.year;
        }
      }
      const d = makeDate(year, mon, day);
      if (d) yearHint.lastMonth = mon;
      return d;
    }
  }

  // Bare "10/9/2025" style
  const num = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (num) {
    const year = num[3].length === 2 ? 2000 + +num[3] : +num[3];
    return makeDate(year, +num[2], +num[1]);
  }

  return null;
}

function makeDate(y: number, m: number, d: number): Date | null {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
}

/**
 * Parses stay ranges: "13th-16th Sep", "28th Oct- 1st Nov" (cross-month),
 * "24th Oct" (single night → checkout next day).
 * `anchor` (usually date of sale) supplies the year; checkout rolls forward
 * across year boundaries.
 */
export function parseStayRange(
  raw: string,
  anchor: Date | null,
): { checkIn: Date; checkOut: Date } | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const baseYear = anchor?.getUTCFullYear() ?? new Date().getUTCFullYear();
  const anchorMonth = anchor ? anchor.getUTCMonth() + 1 : 0;

  const m = s.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s*(?:([a-z]+)\.?)?\s*(?:[-–]|to)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?\s*(\d{4})?/, 
  );

  let inDay: number, inMon: number, outDay: number, outMon: number;
  let year = baseYear;

  if (m) {
    inDay = +m[1];
    outDay = +m[3];
    outMon = MONTHS[m[4]] ?? 0;
    inMon = m[2] ? (MONTHS[m[2]] ?? 0) : outMon;
    if (m[5]) year = +m[5];
  } else {
    const single = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?\s*(\d{4})?/);
    if (!single) return null;
    inDay = +single[1];
    inMon = MONTHS[single[2]] ?? 0;
    outDay = inDay;
    outMon = inMon;
    if (single[3]) year = +single[3];
  }
  if (!inMon || !outMon) return null;

  // Stay happens after the sale → if month looks like it's before the sale
  // year context (e.g. sold Dec for a Jan stay), bump the year.
  if (!m?.[5] && anchorMonth && inMon < anchorMonth - 6) year += 1;

  const checkIn = makeDate(year, inMon, inDay);
  if (!checkIn) return null;

  let outYear = year;
  if (outMon < inMon) outYear += 1; // Dec→Jan rollover inside a range
  let checkOut = makeDate(outYear, outMon, outDay);
  if (!checkOut) return null;
  if (checkOut.getTime() === checkIn.getTime()) {
    checkOut = new Date(checkOut.getTime() + 86400_000); // single-night stay
  }
  if (checkOut <= checkIn) return null; // inverted range — treat as unparseable
  return { checkIn, checkOut };
}
