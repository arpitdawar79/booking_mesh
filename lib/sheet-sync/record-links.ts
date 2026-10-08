export type LinkedRecordType = "expense" | "additional_sale" | "booking";

/**
 * linkedRecordType also carries terminal classifications (`not_imported`,
 * `excluded_property`, `unsupported_revenue_type`) that claim no record —
 * only these three types point at something navigable.
 */
export const RECORD_TYPES: LinkedRecordType[] = [
  "expense",
  "additional_sale",
  "booking",
];

export const RECORD_LABEL: Record<LinkedRecordType, string> = {
  expense: "Expense",
  additional_sale: "Additional sale",
  booking: "Booking",
};

export function isRecordType(type?: string | null): type is LinkedRecordType {
  return !!type && (RECORD_TYPES as string[]).includes(type);
}

/** linkedRecordType doubles as the reason a row was deliberately not imported. */
const TERMINAL_REASON: Record<string, string> = {
  not_imported: "this stream stays in the sheet",
  excluded_property: "property is out of scope for the app",
  unsupported_revenue_type: "revenue type has no app record",
};

export function terminalImportReason(
  type?: string | null,
): string | null {
  if (!type || isRecordType(type)) return null;
  return TERMINAL_REASON[type] ?? type.replace(/_/g, " ");
}

/** Bookings have a full detail page; ledger rows open their list's edit drawer. */
export function recordHref(
  type?: string | null,
  id?: string | null,
): string | null {
  if (!id || !isRecordType(type)) return null;
  if (type === "booking") return `/dashboard/booking/${id}`;
  if (type === "expense") return `/dashboard/expenses?edit=${id}`;
  return `/dashboard/additional-sales?edit=${id}`;
}

export function rowRecordHref(link: {
  linkedRecordId?: string | null;
  linkedRecordType?: string | null;
}): string | null {
  return recordHref(link.linkedRecordType, link.linkedRecordId);
}

/** Where the row's record lives, with the label to put on the link. */
export function rowRecordLink(link: {
  linkedRecordId?: string | null;
  linkedRecordType?: string | null;
}): { href: string; label: string } | null {
  const href = recordHref(link.linkedRecordType, link.linkedRecordId);
  if (!href || !isRecordType(link.linkedRecordType)) return null;
  return { href, label: RECORD_LABEL[link.linkedRecordType] };
}
