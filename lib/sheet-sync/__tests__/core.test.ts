import assert from "node:assert/strict";
import test from "node:test";
import type { SheetRow } from "@prisma/client";
import { SHEET_STREAMS } from "../config";
import { parseSheetDate, parseStayRange } from "../dates";
import { formatDigest } from "../digest-format";
import {
  classifyRevenue,
  mappedHash,
  parsePartialPayment,
  shouldImportBookingProperty,
} from "../ledger";
import { findRowIdCollisions, judgeRow, parseStream } from "../parse";
import { fixRequestSchema, gapsRequestSchema } from "../validation";

const expenses = SHEET_STREAMS.find((stream) => stream.key === "expenses")!;
const revenue = SHEET_STREAMS.find((stream) => stream.key === "revenue")!;

test("yearless dates roll forward after December", () => {
  const hint = { year: 2025, lastMonth: 12 };
  const parsed = parseSheetDate("24th Jan", hint);
  assert.equal(parsed?.toISOString().slice(0, 10), "2026-01-24");
  assert.equal(hint.year, 2026);
});

test("stay ranges accept the sheet's 'to' separator", () => {
  const parsed = parseStayRange(
    "1st to 4th October",
    new Date("2026-09-17T00:00:00Z"),
  );
  assert.equal(parsed?.checkIn.toISOString().slice(0, 10), "2026-10-01");
  assert.equal(parsed?.checkOut.toISOString().slice(0, 10), "2026-10-04");
});

test("pre-numbered expense placeholders are not tracked", () => {
  const rows = parseStream(
    expenses,
    [
      ["9th Sept 2025 onwards"],
      ["S. No.", "Date", "Property", "Particular", "Amount", "Paid by"],
      ["184", "", "Tirthan", "", "", "Ekantah"],
    ],
    2025,
  );
  assert.equal(rows.length, 0);
});

test("room tariff requires sale date, guest and valid stay dates", () => {
  const judgement = judgeRow(
    revenue,
    {
      sno: "1",
      property: "Tirthan",
      revenue: "9000",
      type: "Room Tariff",
      guestName: "",
      dateOfSale: "",
      stayDates: "soon",
      rooms: "",
      pax: "",
      source: "",
      receivedBy: "Ekantah",
      status: "Full Received",
      comments: "",
    },
    null,
    null,
  );
  assert.deepEqual(
    new Set(judgement.missingRequired),
    new Set(["dateOfSale", "guestName", "stayDates"]),
  );
});

test("partial receipts require a comment containing payment context", () => {
  const judgement = judgeRow(
    revenue,
    {
      sno: "1",
      property: "Tirthan",
      revenue: "65000",
      type: "Room Tariff",
      guestName: "Guest",
      dateOfSale: "17th Sept",
      stayDates: "1st to 4th October",
      rooms: "",
      pax: "",
      source: "",
      receivedBy: "Ekantah",
      status: "Partial Received",
      comments: "",
    },
    null,
    new Date("2026-09-17T00:00:00Z"),
  );
  assert.ok(judgement.missingRequired.includes("comments"));
});

test("only Tirthan room revenue is eligible for booking import", () => {
  assert.equal(classifyRevenue("Room Tariff"), "booking");
  assert.equal(shouldImportBookingProperty("Tirthan"), true);
  assert.equal(shouldImportBookingProperty("Doon"), false);
});

test("soft-only gaps still produce a digest notification", () => {
  const message = formatDigest([], () => "", "/sheet-gaps/token", 3, [], []);
  assert.match(message, /3 rows also missing soft fields/);
  assert.match(message, /\/sheet-gaps\/token/);
  assert.doesNotMatch(message, /all tracked rows complete/);
});

test("public fix payloads reject non-string and oversized input", () => {
  assert.equal(
    fixRequestSchema.safeParse({ token: "12345678", fields: { amount: 100 } })
      .success,
    false,
  );
  assert.equal(
    gapsRequestSchema.safeParse({
      token: "12345678",
      updates: [{ id: "row_identifier", fields: { notes: "x".repeat(501) } }],
    }).success,
    false,
  );
});

test("conflict rows are prominent in the digest", () => {
  const row = {
    sheet: "revenue",
    rowId: "186",
    rawJson: {
      property: "Tirthan",
      type: "Room Tariff",
      revenue: "9000",
    },
    missingRequired: [],
  } as unknown as SheetRow;
  const message = formatDigest([], () => "", "", 0, [], [row]);
  assert.match(message, /need admin review/);
  assert.match(message, /r186/);
});

test("inverted stay ranges are rejected instead of creating corrupt bookings", () => {
  assert.equal(
    parseStayRange("16th-13th Sep", new Date("2026-09-01T00:00:00Z")),
    null,
  );
  assert.equal(
    parseStayRange("30th Sep - 28th Sep", new Date("2026-09-01T00:00:00Z")),
    null,
  );
});

test("partial payment parsing is anchored to paid keywords", () => {
  assert.equal(parsePartialPayment("paid 2000 of 5000", 5000), 2000);
  assert.equal(parsePartialPayment("2000 paid via UPI", 5000), 2000);
  assert.equal(parsePartialPayment("₹1500 advance", 5000), 1500);
  // "balance" is what's owed, not what's paid — and "50%" is not an amount.
  assert.equal(parsePartialPayment("balance 500 pending", 5000), 0);
  assert.equal(parsePartialPayment("50% paid", 5000), 0);
});

test("mappedHash ignores cosmetic fields but catches record-affecting edits", () => {
  const fields = {
    sno: "5",
    date: "10th Sept",
    property: "Tirthan",
    particular: "Dinner",
    amount: "500",
    paidBy: "Ekantah",
  };
  const row = (rawJson: Record<string, string>) =>
    ({ sheet: "expenses", rawJson, patches: null }) as unknown as SheetRow;
  const base = row(fields);
  const cosmeticChange = row({ ...fields, sno: "6" });
  const amountChange = row({ ...fields, amount: "600" });
  assert.equal(mappedHash(base), mappedHash(cosmeticChange));
  assert.notEqual(mappedHash(base), mappedHash(amountChange));
});

test("property matching tolerates compound names but not other properties", () => {
  assert.equal(shouldImportBookingProperty("Tirthan Valley"), true);
  assert.equal(shouldImportBookingProperty("tirthan "), true);
  assert.equal(shouldImportBookingProperty("Doon Valley"), false);
});

test("mappedHash uses the supplied parsedDate — drift checks must pass it", () => {
  // Yearless sheet dates re-parse with a fixed 2025 fallback when parsedDate
  // is omitted, so a 2026 row would false-flag as "sheet changed after
  // import" unless the sync-side hash receives the row's real parsedDate.
  const fields = {
    sno: "5",
    date: "10th Sept",
    property: "Tirthan",
    particular: "Dinner",
    amount: "500",
    paidBy: "Ekantah",
  };
  const parsed2026 = new Date("2026-09-10T00:00:00Z");
  const withDate = mappedHash({
    sheet: "expenses",
    rawJson: fields,
    patches: null,
    parsedDate: parsed2026,
  });
  const withoutDate = mappedHash({ sheet: "expenses", rawJson: fields, patches: null });
  assert.notEqual(withDate, withoutDate, "parsedDate must drive the date bucket");
  assert.equal(
    withDate,
    mappedHash({
      sheet: "expenses",
      rawJson: { ...fields, date: "10th Sept 2026" },
      patches: null,
      parsedDate: parsed2026,
    }),
  );
});

test("duplicate S.No rows collide as a cluster", () => {
  const rows = parseStream(
    expenses,
    [
      ["9th Sept 2025 onwards"],
      ["S. No.", "Date", "Property", "Particular", "Amount", "Paid by"],
      ["12", "10th Sept", "Tirthan", "Vegetables", "500", "Ekantah"],
      ["12", "11th Sept", "Tirthan", "Petrol", "500", "Ekantah"],
      ["13", "12th Sept", "Tirthan", "Dinner", "300", "Ekantah"],
    ],
    2025,
  );
  assert.equal(rows.length, 3);
  const collided = findRowIdCollisions(rows);
  assert.deepEqual([...collided.keys()], ["12"]);
  assert.equal(collided.get("12")?.length, 2);
});

test("held duplicates get their own digest section, not accept/keep advice", () => {
  const dup = {
    sheet: "revenue",
    rowId: "77",
    rawJson: {
      property: "Tirthan",
      type: "Room Tariff",
      revenue: "4320",
    },
    missingRequired: [],
    conflictJson: {
      reason: "near-duplicate of r76 (62%) — merge or import",
      duplicateOfRow: { id: "abc", rowId: "76" },
      confidence: 0.62,
      reasons: ["dates 1d apart", "full label match"],
    },
  } as unknown as SheetRow;
  const message = formatDigest([], () => "", "", 0, [], [], [], [], [dup]);
  assert.match(message, /1 possible duplicate\(s\) held from import/);
  assert.match(message, /r77/);
  assert.match(message, /\(62%\)/);
  assert.match(message, /accept\/keep don't apply/);
  assert.doesNotMatch(message, /need admin review/);
  assert.doesNotMatch(message, /all tracked rows complete/);
});

test("merged rows are announced once in the digest with confidence", () => {  const row = {
    sheet: "expenses",
    rowId: "184",
    rawJson: {
      property: "Tirthan",
      particular: "Plumber visit",
      amount: "800",
    },
    missingRequired: [],
    conflictJson: { merge: { confidence: 0.9, reasons: ["same amount"] } },
  } as unknown as SheetRow;
  const message = formatDigest([], () => "", "", 0, [], [], [], [row]);
  assert.match(message, /1 row\(s\) auto-merged as duplicates/);
  assert.match(message, /e184/);
  assert.match(message, /90%/);
  assert.doesNotMatch(message, /all tracked rows complete/);
});
