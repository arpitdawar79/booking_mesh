import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { SheetRow } from "@prisma/client";
import {
  DEDUP_DATE_WINDOW_DAYS,
  dayFloor,
  nearAmountVariants,
  scorePair,
  shouldAutoMerge,
  type DedupSubject,
  type DedupVerdict,
} from "./dedup-score";
import { parseSheetDate, parseStayRange } from "./dates";
import { effectiveFields, hashFields } from "./parse";

const DAY_MS = 86400_000;

type Fields = Record<string, string>;
type DbClient = Prisma.TransactionClient | typeof prisma;
type DestinationType = "expense" | "additional_sale" | "booking";

function generateBookingId(): string {
  const date = new Date();
  const prefix =
    date.getFullYear().toString().slice(2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${rand}`;
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function guessCategory(particular: string) {
  const s = particular.toLowerCase();
  if (/electric|wifi|utilit|water|gas|internet|broadband/.test(s)) return "utilities" as const;
  if (/salary|advance|bonus|wage/.test(s)) return "salaries" as const;
  if (/food|grocer|f&b|milk|vegetable|ration|kitchen/.test(s))
    return "food_beverages" as const;
  if (/repair|maintenance|plumb|paint|civil/.test(s)) return "maintenance" as const;
  if (/taxi|petrol|diesel|bus|transport|fuel|travel|cab/.test(s))
    return "transport" as const;
  if (/marketing|social media|ads|promo|insta/.test(s)) return "marketing" as const;
  if (/clean|suppl|material|bulb|toilet|grocery store/.test(s))
    return "supplies" as const;
  return "misc" as const;
}

export function classifyRevenue(type: string):
  | "booking"
  | "restaurant"
  | "activity"
  | null {
  const s = type.toLowerCase();
  if (/room|tariff|stay|accommodation/.test(s)) return "booking";
  if (/f&b|food|restaurant|cafe|bar/.test(s)) return "restaurant";
  if (/activit|trek|tour|experience/.test(s)) return "activity";
  return null;
}

export function shouldImportBookingProperty(property: string) {
  return /\btirthan\b/i.test(property.trim());
}

function sourceKey(row: Pick<SheetRow, "sheet" | "rowId">) {
  return `${row.sheet}:${row.rowId}`;
}

/**
 * Effective fields: raw sheet values overlaid with app-side patches.
 */
function rowFields(row: Pick<SheetRow, "rawJson" | "patches">): Fields {
  return effectiveFields(
    row.rawJson as Fields,
    row.patches as Record<string, { value: string }> | null,
  );
}

/**
 * Fields that actually affect the imported ledger record. linkedRowHash is
 * computed over these so a cosmetic sheet change (e.g. S.No) doesn't flag a
 * conflict, while a real change (amount, stay dates) does.
 */
export const MAPPED_FIELDS: Record<string, string[]> = {
  expenses: ["date", "property", "particular", "amount", "paidBy"],
  payouts: ["date", "amount", "beneficiary"],
  revenue: [
    "property",
    "revenue",
    "type",
    "guestName",
    "dateOfSale",
    "stayDates",
    "rooms",
    "pax",
    "source",
    "receivedBy",
    "status",
    "comments",
  ],
};

/**
 * Date-like fields hash by parsed value, not representation — "17th Sept",
 * serial 46282 and "17 Sep 2026" are the same date and must not flag drift.
 */
const DATE_KEY = /^(date|dateOfSale)$/;
const RANGE_KEY = /^(stayDates)$/;

export function mappedHash(
  row: Pick<SheetRow, "sheet" | "rawJson" | "patches"> & {
    parsedDate?: Date | null;
  },
): string {
  const effective = rowFields(row);
  const keys = MAPPED_FIELDS[row.sheet] ?? Object.keys(effective).sort();
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const raw = effective[key] ?? "";
    if (DATE_KEY.test(key)) {
      const parsed =
        row.parsedDate ??
        parseSheetDate(raw, { year: 2025, lastMonth: 0 });
      picked[key] = parsed ? parsed.toISOString().slice(0, 10) : raw;
    } else if (RANGE_KEY.test(key)) {
      const range = parseStayRange(raw, row.parsedDate ?? null);
      picked[key] = range
        ? `${range.checkIn.toISOString().slice(0, 10)}|${range.checkOut.toISOString().slice(0, 10)}`
        : raw;
    } else {
      picked[key] = raw.trim().toLowerCase();
    }
  }
  return hashFields(picked);
}

async function findBySourceKey(
  db: DbClient,
  type: DestinationType,
  key: string,
): Promise<string | null> {
  if (type === "expense") {
    return (await db.expense.findUnique({ where: { sourceKey: key }, select: { id: true } }))?.id ?? null;
  }
  if (type === "additional_sale") {
    return (await db.additionalSale.findUnique({ where: { sourceKey: key }, select: { id: true } }))?.id ?? null;
  }
  return (await db.booking.findUnique({ where: { sourceKey: key }, select: { id: true } }))?.id ?? null;
}

/**
 * Scored duplicate matching. Candidates come from production records and from
 * sibling sheet rows; each pair gets a tier from the dedup engine:
 *   auto   → collapse onto the existing record immediately (audit-logged as a
 *            merge), only for low-coincidence evidence (non-round amount,
 *            strong label, near date or identical stay).
 *   review → flag `possible_duplicate` with confidence for one-tap merge.
 *   ignore → coincidence (round amounts collide constantly in this book).
 */
function sheetSubject(
  row: Pick<SheetRow, "sheet" | "rawJson" | "patches" | "parsedDate">,
): DedupSubject | null {
  const fields = rowFields(row);
  const amount = parseAmount(fields.amount ?? fields.revenue);
  if (!amount) return null;
  if (row.sheet === "expenses") {
    return {
      kind: "expense",
      amount,
      date: row.parsedDate,
      label: fields.particular ?? "",
      payer: fields.paidBy,
      property: fields.property,
    };
  }
  if (row.sheet !== "revenue") return null;
  const kind = classifyRevenue(fields.type ?? "");
  if (!kind) return null;
  const stay =
    kind === "booking" ? parseStayRange(fields.stayDates ?? "", row.parsedDate) : null;
  return {
    kind: kind === "booking" ? "booking" : "additional_sale",
    amount,
    date: row.parsedDate,
    label: fields.guestName ?? "",
    payer: fields.receivedBy,
    property: fields.property,
    source: fields.source,
    checkIn: stay?.checkIn ?? null,
    checkOut: stay?.checkOut ?? null,
  };
}

function dayWindow(date: Date, days = DEDUP_DATE_WINDOW_DAYS) {
  const center = dayFloor(date).getTime();
  return {
    gte: new Date(center - days * DAY_MS),
    lt: new Date(center + (days + 1) * DAY_MS),
  };
}

export interface ScoredCandidate {
  type: DestinationType;
  id: string;
  verdict: DedupVerdict;
}

/**
 * Finds production records that plausibly represent the same transaction as
 * this sheet row — including same-amount entries recorded a day or two apart
 * (ops routinely enters the payment date, not the incurred date) and digit
 * typo / decimal-slip variants of the amount.
 */
export async function productionCandidates(
  row: Pick<SheetRow, "sheet" | "rowId" | "rawJson" | "patches" | "parsedDate">,
  db: DbClient = prisma,
): Promise<ScoredCandidate[]> {
  const subject = sheetSubject(row);
  if (!subject || !subject.date) return [];
  const amounts = nearAmountVariants(subject.amount);
  const scored: ScoredCandidate[] = [];

  const collect = (
    type: DestinationType,
    id: string,
    candidate: DedupSubject | null,
  ) => {
    if (!candidate) return;
    const verdict = scorePair(subject, candidate);
    if (verdict.tier !== "ignore") scored.push({ type, id, verdict });
  };

  if (subject.kind === "expense") {
    const hits = await db.expense.findMany({
      where: { amount: { in: amounts }, date: dayWindow(subject.date) },
      select: { id: true, amount: true, date: true, description: true, recordedBy: true },
      take: 40,
    });
    for (const h of hits) {
      collect("expense", h.id, {
        kind: "expense",
        amount: Number(h.amount),
        date: h.date,
        label: h.description ?? "",
        payer: h.recordedBy ?? "",
      });
    }
  } else if (subject.kind === "booking") {
    const or: Prisma.BookingWhereInput[] = [
      { bookingDate: dayWindow(subject.date) },
    ];
    if (subject.checkIn) or.push({ checkInDate: dayWindow(subject.checkIn) });
    const hits = await db.booking.findMany({
      where: { totalAmount: { in: amounts }, OR: or },
      select: {
        id: true, totalAmount: true, bookingDate: true,
        guestFullName: true, checkInDate: true, checkOutDate: true,
      },
      take: 40,
    });
    for (const h of hits) {
      collect("booking", h.id, {
        kind: "booking",
        amount: Number(h.totalAmount),
        date: h.bookingDate,
        label: h.guestFullName ?? "",
        checkIn: h.checkInDate,
        checkOut: h.checkOutDate,
      });
    }
  } else {
    const hits = await db.additionalSale.findMany({
      where: { amount: { in: amounts }, date: dayWindow(subject.date) },
      select: { id: true, amount: true, date: true, guestName: true },
      take: 40,
    });
    for (const h of hits) {
      collect("additional_sale", h.id, {
        kind: subject.kind,
        amount: Number(h.amount),
        date: h.date,
        label: h.guestName,
      });
    }
  }

  return scored.sort((a, b) => b.verdict.score - a.verdict.score).slice(0, 5);
}

/**
 * A ledger record must be claimed by at most one sheet row — unless the two
 * rows are themselves a verified duplicate pair (that's a merge, not a clash).
 */
async function recordClaimedBy(
  db: DbClient,
  type: DestinationType,
  recordId: string,
  exceptRowId: string,
): Promise<SheetRow | null> {
  return db.sheetRow.findFirst({
    where: {
      linkedRecordType: type,
      linkedRecordId: recordId,
      id: { not: exceptRowId },
    },
  });
}

export interface ProductionAnalysis {
  linkNow: ScoredCandidate | null;
  mergedViaHolder: string | null; // rowId of the sibling whose claim we merge into
  review: ScoredCandidate[];
  claimConflict: { candidate: ScoredCandidate; holderRowId: string } | null;
}

export async function analyzeAgainstProduction(
  row: SheetRow,
  db: DbClient = prisma,
): Promise<ProductionAnalysis> {
  const candidates = await productionCandidates(row, db);
  const linkable = candidates.filter((c) => shouldAutoMerge(c.verdict));
  const review = candidates
    .filter((c) => c.verdict.tier === "review")
    .slice(0, 3);

  if (linkable.length > 1) {
    // Multiple strong matches — ambiguous, hand to review rather than pick one.
    const linkableIds = new Set(linkable.map((c) => c.id));
    return {
      linkNow: null,
      mergedViaHolder: null,
      review: [...linkable, ...review.filter((c) => !linkableIds.has(c.id))].slice(0, 3),
      claimConflict: null,
    };
  }

  const candidate = linkable[0];
  if (!candidate) return { linkNow: null, mergedViaHolder: null, review, claimConflict: null };

  const holder = await recordClaimedBy(db, candidate.type, candidate.id, row.id);
  if (holder) {
    const holderSubject = sheetSubject(holder);
    const rowSubject = sheetSubject(row);
    if (holderSubject && rowSubject && shouldAutoMerge(scorePair(rowSubject, holderSubject))) {
      return { linkNow: candidate, mergedViaHolder: holder.rowId, review: [], claimConflict: null };
    }
    return { linkNow: null, mergedViaHolder: null, review, claimConflict: { candidate, holderRowId: holder.rowId } };
  }
  return { linkNow: candidate, mergedViaHolder: null, review, claimConflict: null };
}

export function conflictCandidatePayload(c: ScoredCandidate) {
  return {
    type: c.type,
    id: c.id,
    confidence: c.verdict.confidence,
    reasons: c.verdict.reasons,
  };
}

/**
 * Intra-sheet duplicate: another tracked row in the same stream that the dedup
 * engine considers the same transaction (scored, ±window on date).
 */
export async function findDuplicateSibling(
  row: SheetRow,
  db: DbClient = prisma,
): Promise<{ sibling: SheetRow; verdict: DedupVerdict } | null> {
  const subject = sheetSubject(row);
  if (!subject || !subject.date || row.sheet === "payouts") return null;

  const siblings = await db.sheetRow.findMany({
    where: {
      sheet: row.sheet,
      id: { not: row.id },
      parsedDate: dayWindow(subject.date),
      status: { notIn: ["deleted", "skipped", "possible_duplicate", "legacy"] },
    },
    take: 100,
  });

  let best: { sibling: SheetRow; verdict: DedupVerdict } | null = null;
  for (const sib of siblings) {
    const sibSubject = sheetSubject(sib);
    if (!sibSubject) continue;
    const verdict = scorePair(subject, sibSubject);
    if (verdict.tier === "ignore") continue;
    if (!best || verdict.score > best.verdict.score) best = { sibling: sib, verdict };
  }
  return best;
}

export type LedgerRecordType = "expense" | "additional_sale" | "booking";

/** A8: does the record this row links to still exist in the app? */
export async function linkedRecordExists(
  type: string,
  id: string,
): Promise<boolean> {
  if (type === "expense") return !!(await prisma.expense.findUnique({ where: { id }, select: { id: true } }));
  if (type === "additional_sale")
    return !!(await prisma.additionalSale.findUnique({ where: { id }, select: { id: true } }));
  if (type === "booking") return !!(await prisma.booking.findUnique({ where: { id }, select: { id: true } }));
  return true; // terminal classifications ("excluded_property", …) claim no record
}

export function parsePartialPayment(raw: string | undefined, total: number) {
  if (!raw) return 0;
  const s = raw.replace(/,/g, "");
  // Amount must be anchored to a paid-ish keyword or an explicit ₹ — otherwise
  // "50% paid" or "balance 500" would corrupt amountPaid.
  const match =
    s.match(/(\d[\d.]*)\s*(?:paid|received|recd|advance|collected)/i) ??
    s.match(/(?:paid|received|recd|advance|collected|got)\D{0,15}?(\d[\d.]*)/i) ??
    s.match(/₹\s*(\d[\d.]*)/);
  if (!match) return 0;
  const n = Number(match[1]);
  return Number.isFinite(n) ? Math.min(total, n) : 0;
}

function bookingPaymentFields(fields: Fields, total: number) {
  const cancelled = /cancel/i.test(fields.status ?? "");
  const paidInFull = /full|fully paid/i.test(fields.status ?? "");
  const partial = /partial/i.test(fields.status ?? "")
    ? parsePartialPayment(fields.comments, total)
    : 0;
  const amountPaid = paidInFull ? total : partial;
  return {
    amountPaid,
    paymentStatus: cancelled
      ? amountPaid > 0
        ? ("refunded" as const)
        : ("pending" as const)
      : paidInFull
        ? ("paid_in_full" as const)
        : amountPaid > 0
          ? ("partially_paid" as const)
          : ("pending" as const),
    cancelled,
  };
}

/**
 * Writes the row's current effective values for `updatedFields` onto the
 * linked ledger record, then re-baselines linkedRowHash so the change is not
 * re-flagged as a conflict. Passing every mapped field key is how `accept`
 * pulls sheet edits into the record.
 */
export async function applyFieldsToLinkedRecord(
  row: SheetRow,
  updatedFields: string[],
): Promise<void> {
  if (!row.linkedRecordId || !row.linkedRecordType) return;
  const fields = rowFields(row);
  const has = (key: string) => updatedFields.includes(key);
  const amount = parseAmount(fields.amount ?? fields.revenue);

  if (row.linkedRecordType === "expense") {
    const data: Prisma.ExpenseUpdateInput = {};
    if (has("date") && row.parsedDate) data.date = row.parsedDate;
    if (has("particular") && fields.particular) {
      data.description = fields.particular;
      data.category = guessCategory(fields.particular);
    }
    if (has("amount") && amount) data.amount = amount;
    if (has("paidBy") && fields.paidBy) data.recordedBy = fields.paidBy;
    if (Object.keys(data).length) {
      await prisma.expense.update({ where: { id: row.linkedRecordId }, data });
    }
  } else if (row.linkedRecordType === "additional_sale") {
    const data: Prisma.AdditionalSaleUpdateInput = {};
    if (has("guestName") && fields.guestName) data.guestName = fields.guestName;
    if (has("dateOfSale") && row.parsedDate) data.date = row.parsedDate;
    if (has("revenue") && amount) data.amount = amount;
    if (Object.keys(data).length) {
      await prisma.additionalSale.update({
        where: { id: row.linkedRecordId },
        data,
      });
    }
  } else if (row.linkedRecordType === "booking") {
    const data: Prisma.BookingUpdateInput = {};
    if (has("guestName") && fields.guestName) {
      data.guestFirstName = fields.guestName.split(" ")[0];
      data.guestFullName = fields.guestName;
    }
    if (has("rooms")) data.roomCount = parseInt(fields.rooms, 10) || 1;
    if (has("pax")) data.adultCount = parseInt(fields.pax, 10) || 1;
    if (has("dateOfSale") && row.parsedDate) data.bookingDate = row.parsedDate;
    if (has("stayDates")) {
      const stay = parseStayRange(fields.stayDates, row.parsedDate);
      if (stay) {
        data.checkInDate = stay.checkIn;
        data.checkOutDate = stay.checkOut;
        data.nightCount = Math.max(
          1,
          Math.round((stay.checkOut.getTime() - stay.checkIn.getTime()) / 86400_000),
        );
      }
    }
    if (has("revenue") || has("status") || has("comments")) {
      const total = has("revenue") && amount ? amount : undefined;
      const payment = bookingPaymentFields(fields, total ?? 0);
      if (total !== undefined) {
        data.totalAmount = total;
        data.balanceAmount = payment.cancelled
          ? 0
          : Math.max(0, total - payment.amountPaid);
      }
      data.amountPaidOnline = payment.amountPaid;
      data.paymentStatus = payment.paymentStatus;
      if (has("status") && payment.cancelled) {
        data.status = "cancelled";
      } else if (has("status") && !payment.cancelled) {
        // Un-cancelling: restore to confirmed/completed based on dates
        const checkOut =
          (data.checkOutDate as Date | undefined) ??
          (await prisma.booking
            .findUnique({
              where: { id: row.linkedRecordId },
              select: { checkOutDate: true },
            })
            .then((b) => b?.checkOutDate ?? null));
        data.status =
          checkOut && checkOut < new Date() ? "completed" : "confirmed";
      }
    }
    if (Object.keys(data).length) {
      await prisma.booking.update({ where: { id: row.linkedRecordId }, data });
    }
  }

  await prisma.sheetRow.update({
    where: { id: row.id },
    data: { linkedRowHash: mappedHash(row) },
  });
}

/**
 * `accept <ref>` — pull the sheet's current state into the linked record and
 * clear the conflict.
 */
export async function acceptSheetIntoLinkedRecord(
  row: SheetRow,
): Promise<boolean> {
  if (!row.linkedRecordId || !row.linkedRecordType) return false;
  // Orphan link (A8): the record was deleted in-app — updating it would
  // crash on a missing row. The admin needs unlink/import, not accept.
  if (!(await linkedRecordExists(row.linkedRecordType, row.linkedRecordId))) {
    return false;
  }
  await applyFieldsToLinkedRecord(row, MAPPED_FIELDS[row.sheet] ?? []);
  await prisma.sheetRow.update({
    where: { id: row.id },
    data: { status: "resolved", conflictJson: Prisma.JsonNull },
  });
  return true;
}

/**
 * `keep <ref>` — the app-side record stands; mark the row skipped (hands-off)
 * so neither sheet drift nor policy violations re-flag it.
 */
export async function keepLinkedRecord(row: SheetRow): Promise<boolean> {
  if (!row.linkedRecordId || !row.linkedRecordType) return false;
  await prisma.sheetRow.update({
    where: { id: row.id },
    data: {
      status: "skipped",
      conflictJson: Prisma.JsonNull,
      linkedRowHash: mappedHash(row),
    },
  });
  return true;
}

export type BridgeOutcome =
  | "created"
  | "linked"
  | "merged"
  | "flagged_duplicate"
  | "nothing";

export async function linkOrCreateLedgerRecord(
  row: SheetRow,
  opts: { forceCreate?: boolean } = {},
): Promise<BridgeOutcome> {
  if (row.linkedRecordId || row.linkedRecordType) return "nothing";
  const fields = rowFields(row);
  const amount = parseAmount(fields.amount ?? fields.revenue);
  if (!amount || !row.parsedDate) {
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: { importError: "A valid transaction date and positive amount are required" },
    });
    return "nothing";
  }

  return prisma.$transaction(async (tx): Promise<BridgeOutcome> => {
    const current = await tx.sheetRow.findUnique({ where: { id: row.id } });
    if (!current || current.linkedRecordId || current.linkedRecordType) return "nothing";

    const currentFields = rowFields(current);
    const key = sourceKey(current);
    let destinationType: DestinationType;

    if (current.sheet === "expenses") {
      destinationType = "expense";
    } else if (current.sheet === "revenue") {
      const kind = classifyRevenue(currentFields.type ?? "");
      if (kind === "booking") {
        if (!shouldImportBookingProperty(currentFields.property ?? "")) {
          await tx.sheetRow.update({
            where: { id: current.id },
            data: {
              linkedRecordType: "excluded_property",
              linkedRowHash: mappedHash(current),
              importError: null,
            },
          });
          return "nothing";
        }
        destinationType = "booking";
      } else if (kind === "restaurant" || kind === "activity") {
        destinationType = "additional_sale";
      } else {
        await tx.sheetRow.update({
          where: { id: current.id },
          data: {
            linkedRecordType: "unsupported_revenue_type",
            importError: `Unsupported revenue type: ${currentFields.type || "(empty)"}`,
          },
        });
        return "nothing";
      }
    } else {
      await tx.sheetRow.update({
        where: { id: current.id },
        data: { linkedRecordType: "not_imported", linkedRowHash: current.rowHash },
      });
      return "nothing";
    }

    const sourceMatch = await findBySourceKey(tx, destinationType, key);
    if (!sourceMatch && !opts.forceCreate) {
      const analysis = await analyzeAgainstProduction(current, tx);

      if (analysis.claimConflict) {
        // The matched record is already claimed by an unrelated sheet row —
        // never double-claim silently; surface for review. `candidates` keeps
        // the dashboard `link` action contract (admin override = merge).
        await tx.sheetRow.update({
          where: { id: current.id },
          data: {
            status: "possible_duplicate",
            conflictJson: {
              reason: `matched record already claimed by row ${analysis.claimConflict.holderRowId} — review before merging`,
              candidates: [conflictCandidatePayload(analysis.claimConflict.candidate)],
              holderRowId: analysis.claimConflict.holderRowId,
            } as Prisma.InputJsonValue,
            importError: null,
          },
        });
        return "flagged_duplicate";
      }

      if (analysis.linkNow) {
        const link = analysis.linkNow;
        const isMerge = link.verdict.tier === "auto" || !!analysis.mergedViaHolder;
        await tx.sheetRow.update({
          where: { id: current.id },
          data: {
            linkedRecordId: link.id,
            linkedRecordType: link.type,
            linkedRowHash: mappedHash(current),
            importError: null,
            ...(isMerge
              ? {
                  resolvedVia: "merge",
                  resolvedAt: new Date(),
                  conflictJson: {
                    merge: {
                      into: { type: link.type, id: link.id },
                      confidence: link.verdict.confidence,
                      reasons: [
                        ...link.verdict.reasons,
                        ...(analysis.mergedViaHolder
                          ? [`sibling duplicate of row ${analysis.mergedViaHolder}`]
                          : []),
                      ],
                    },
                  } as Prisma.InputJsonValue,
                }
              : {}),
          },
        });
        return isMerge ? "merged" : "linked";
      }

      if (analysis.review.length) {
        // Smart-but-not-certain evidence (date-skewed pair, fuzzy label,
        // digit typo, round amount): hold the import, let a human one-tap it.
        await tx.sheetRow.update({
          where: { id: current.id },
          data: {
            status: "possible_duplicate",
            conflictJson: {
              reason: `possible duplicate of ${analysis.review.length} existing ${destinationType} record(s) — merge or import`,
              candidates: analysis.review.map(conflictCandidatePayload),
            } as Prisma.InputJsonValue,
            importError: null,
          },
        });
        return "flagged_duplicate";
      }
    }

    const exactMatch = sourceMatch
      ? { type: destinationType, id: sourceMatch }
      : null;

    if (exactMatch) {
      await tx.sheetRow.update({
        where: { id: current.id },
        data: {
          linkedRecordId: exactMatch.id,
          linkedRecordType: exactMatch.type,
          linkedRowHash: mappedHash(current),
          importError: null,
        },
      });
      return "linked";
    }

    if (destinationType === "expense") {
      const particular = currentFields.particular;
      const created = await tx.expense.create({
        data: {
          date: current.parsedDate!,
          description: particular,
          amount,
          category: guessCategory(particular),
          paymentMethod: "cash",
          recordedBy: currentFields.paidBy,
          notes: [
            `Synced from sheet row ${current.rowId}`,
            currentFields.property ? `Property: ${currentFields.property}` : null,
          ].filter(Boolean).join(" · "),
          sourceKey: key,
        },
      });
      await tx.sheetRow.update({
        where: { id: current.id },
        data: {
          linkedRecordId: created.id,
          linkedRecordType: "expense",
          linkedRowHash: mappedHash(current),
          importError: null,
        },
      });
      return "created";
    }

    if (destinationType === "additional_sale") {
      const saleType = classifyRevenue(currentFields.type);
      if (saleType !== "restaurant" && saleType !== "activity") {
        throw new Error(`Invalid additional sale type: ${currentFields.type}`);
      }
      const created = await tx.additionalSale.create({
        data: {
          date: current.parsedDate!,
          guestName: currentFields.guestName || "Sheet entry",
          saleType,
          guestType: "hotel_guest",
          amount,
          paymentMethod: "cash",
          notes: [
            `Synced from sheet row ${current.rowId}`,
            currentFields.property ? `Property: ${currentFields.property}` : null,
            currentFields.source ? `Source: ${currentFields.source}` : null,
            currentFields.receivedBy ? `Received by: ${currentFields.receivedBy}` : null,
          ].filter(Boolean).join(" · "),
          sourceKey: key,
        },
      });
      await tx.sheetRow.update({
        where: { id: current.id },
        data: {
          linkedRecordId: created.id,
          linkedRecordType: "additional_sale",
          linkedRowHash: mappedHash(current),
          importError: null,
        },
      });
      return "created";
    }

    const stay = parseStayRange(currentFields.stayDates, current.parsedDate);
    if (!stay || !currentFields.guestName) {
      await tx.sheetRow.update({
        where: { id: current.id },
        data: { importError: "Guest name and valid stay dates are required" },
      });
      return "nothing";
    }
    const nights = Math.max(
      1,
      Math.round((stay.checkOut.getTime() - stay.checkIn.getTime()) / 86400_000),
    );
    const payment = bookingPaymentFields(currentFields, amount);
    const created = await tx.booking.create({
      data: {
        bookingId: generateBookingId(),
        bookingDate: current.parsedDate!,
        guestFirstName: currentFields.guestName.split(" ")[0],
        guestFullName: currentFields.guestName,
        adultCount: parseInt(currentFields.pax, 10) || 1,
        roomCount: parseInt(currentFields.rooms, 10) || 1,
        checkInDate: stay.checkIn,
        checkOutDate: stay.checkOut,
        nightCount: nights,
        totalAmount: amount,
        amountPaidOnline: payment.amountPaid,
        balanceAmount: payment.cancelled
          ? 0
          : Math.max(0, amount - payment.amountPaid),
        paymentStatus: payment.paymentStatus,
        status: payment.cancelled
          ? "cancelled"
          : stay.checkOut < new Date()
            ? "completed"
            : "confirmed",
        isBackdated: true,
        sourceKey: key,
        specialRequests: [
          `Sheet import · row r${current.rowId}`,
          currentFields.source ? `source: ${currentFields.source}` : null,
          currentFields.receivedBy ? `recd by: ${currentFields.receivedBy}` : null,
          currentFields.comments ? `comments: ${currentFields.comments}` : null,
        ].filter(Boolean).join(" · "),
      },
    });
    await tx.sheetRow.update({
      where: { id: current.id },
      data: {
        linkedRecordId: created.id,
        linkedRecordType: "booking",
        linkedRowHash: mappedHash(current),
        importError: null,
      },
    });
    return "created";
  });
}
