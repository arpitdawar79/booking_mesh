import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { SheetRow } from "@prisma/client";
import { parseSheetDate, parseStayRange } from "./dates";
import { effectiveFields, hashFields } from "./parse";

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

function dayRange(date: Date) {
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  return { gte: start, lt: new Date(start.getTime() + 86400_000) };
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
 * Finds an exact production match for rows that may have been entered manually
 * before the source key existed.
 */
export async function findProductionDuplicates(
  row: Pick<SheetRow, "sheet" | "rowId" | "rawJson" | "patches" | "parsedDate">,
  db: DbClient = prisma,
): Promise<{ type: DestinationType; id: string }[]> {
  const fields = rowFields(row);
  const amount = parseAmount(fields.amount ?? fields.revenue);
  if (!amount || !row.parsedDate) return [];

  if (row.sheet === "expenses") {
    if (!fields.particular?.trim()) return [];
    const hits = await db.expense.findMany({
      where: {
        amount,
        date: dayRange(row.parsedDate),
        description: { equals: fields.particular, mode: "insensitive" },
      },
      select: { id: true },
      take: 4,
    });
    return hits.map((h) => ({ type: "expense" as const, id: h.id }));
  }

  if (row.sheet !== "revenue") return [];
  const kind = classifyRevenue(fields.type ?? "");
  if (kind === "restaurant" || kind === "activity") {
    if (!fields.guestName?.trim()) return []; // don't link on a placeholder name
    const hits = await db.additionalSale.findMany({
      where: {
        amount,
        date: dayRange(row.parsedDate),
        saleType: kind,
        guestName: { equals: fields.guestName, mode: "insensitive" },
      },
      select: { id: true },
      take: 4,
    });
    return hits.map((h) => ({ type: "additional_sale" as const, id: h.id }));
  }

  if (kind === "booking") {
    const stay = parseStayRange(fields.stayDates ?? "", row.parsedDate);
    if (!stay || !fields.guestName) return [];
    const hits = await db.booking.findMany({
      where: {
        totalAmount: amount,
        checkInDate: stay.checkIn,
        checkOutDate: stay.checkOut,
        guestFullName: { equals: fields.guestName, mode: "insensitive" },
      },
      select: { id: true },
      take: 4,
    });
    return hits.map((h) => ({ type: "booking" as const, id: h.id }));
  }

  return [];
}

export async function findProductionDuplicate(
  row: Pick<SheetRow, "sheet" | "rowId" | "rawJson" | "patches" | "parsedDate">,
  db: DbClient = prisma,
): Promise<{ type: DestinationType; id: string } | null> {
  const hits = await findProductionDuplicates(row, db);
  return hits[0] ?? null;
}

/**
 * Intra-sheet duplicate: another tracked row in the same stream carries the
 * same date + amount + primary label — almost always a double entry.
 */
export async function findSheetSibling(
  row: SheetRow,
  db: DbClient = prisma,
): Promise<SheetRow | null> {
  if (row.sheet === "payouts" || !row.parsedDate) return null;
  const fields = rowFields(row);
  const amount = parseAmount(fields.amount ?? fields.revenue);
  if (!amount) return null;
  const label =
    row.sheet === "expenses" ? fields.particular : fields.guestName;
  if (!label?.trim()) return null;

  const siblings = await db.sheetRow.findMany({
    where: {
      sheet: row.sheet,
      id: { not: row.id },
      parsedDate: row.parsedDate,
      status: { notIn: ["deleted", "skipped", "possible_duplicate", "legacy"] },
    },
    take: 25,
  });
  return (
    siblings.find((sib) => {
      const sf = rowFields(sib);
      if (parseAmount(sf.amount ?? sf.revenue) !== amount) return false;
      const sibLabel = row.sheet === "expenses" ? sf.particular : sf.guestName;
      return (sibLabel ?? "").trim().toLowerCase() === label.trim().toLowerCase();
    }) ?? null
  );
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

export async function linkOrCreateLedgerRecord(
  row: SheetRow,
  opts: { forceCreate?: boolean } = {},
): Promise<void> {
  if (row.linkedRecordId || row.linkedRecordType) return;
  const fields = rowFields(row);
  const amount = parseAmount(fields.amount ?? fields.revenue);
  if (!amount || !row.parsedDate) {
    await prisma.sheetRow.update({
      where: { id: row.id },
      data: { importError: "A valid transaction date and positive amount are required" },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.sheetRow.findUnique({ where: { id: row.id } });
    if (!current || current.linkedRecordId || current.linkedRecordType) return;

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
          return;
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
        return;
      }
    } else {
      await tx.sheetRow.update({
        where: { id: current.id },
        data: { linkedRecordType: "not_imported", linkedRowHash: current.rowHash },
      });
      return;
    }

    const sourceMatch = await findBySourceKey(tx, destinationType, key);
    if (!sourceMatch && !opts.forceCreate) {
      const candidates = await findProductionDuplicates(current, tx);
      if (candidates.length > 1) {
        // Ambiguous: multiple live records match — surface for review instead
        // of silently collapsing two real entries onto one record.
        await tx.sheetRow.update({
          where: { id: current.id },
          data: {
            status: "possible_duplicate",
            conflictJson: {
              reason: `matches ${candidates.length} existing ${destinationType} records`,
              candidates: candidates.slice(0, 3),
            } as Prisma.InputJsonValue,
            importError: null,
          },
        });
        return;
      }
      const match = candidates[0];
      if (match) {
        await tx.sheetRow.update({
          where: { id: current.id },
          data: {
            linkedRecordId: match.id,
            linkedRecordType: match.type,
            linkedRowHash: mappedHash(current),
            importError: null,
          },
        });
        return;
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
      return;
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
      return;
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
      return;
    }

    const stay = parseStayRange(currentFields.stayDates, current.parsedDate);
    if (!stay || !currentFields.guestName) {
      await tx.sheetRow.update({
        where: { id: current.id },
        data: { importError: "Guest name and valid stay dates are required" },
      });
      return;
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
  });
}
