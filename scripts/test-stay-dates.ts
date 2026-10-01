import { parseStayRange } from "../lib/sheet-sync/dates";

const anchor = new Date(Date.UTC(2025, 8, 27)); // 27 Sep 2025 (a date of sale)
const cases = [
  "13th-16th Sep",
  "18th-20th Sep",
  "28th-30th October",
  "28th Oct- 1st Nov",
  "26th Oct- 1st Nov",
  "14th-20th Dec",
  "24th Oct",
  "6-8 May",
  "",
  "garbage",
];
for (const c of cases) {
  const r = parseStayRange(c, anchor);
  console.log(
    `"${c}" →`,
    r
      ? `${r.checkIn.toISOString().slice(0, 10)} → ${r.checkOut.toISOString().slice(0, 10)}`
      : "null",
  );
}
// cross-year: sold Dec 2025, stay Jan 2026
const r2 = parseStayRange("28th Dec - 2nd Jan", new Date(Date.UTC(2025, 11, 20)));
console.log(`"28th Dec - 2nd Jan" (sold Dec) →`, r2 ? `${r2.checkIn.toISOString().slice(0,10)} → ${r2.checkOut.toISOString().slice(0,10)}` : "null");
