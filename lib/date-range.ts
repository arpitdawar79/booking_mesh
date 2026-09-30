export type DateRangePreset =
  | "all"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "custom";

export interface DateRangeSelection {
  preset: DateRangePreset;
  // Custom range bounds (YYYY-MM-DD). Only used when preset === "custom".
  from?: string;
  to?: string;
}

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface ResolvedRange {
  from?: string;
  to?: string;
}

// Resolve a selection to concrete YYYY-MM-DD bounds (inclusive).
// Returns null for "all" (no filtering) or an incomplete custom range.
export function resolveDateRange(
  sel: DateRangeSelection,
  now: Date = new Date(),
): ResolvedRange | null {
  switch (sel.preset) {
    case "all":
      return null;
    case "this_month":
      return {
        from: fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: fmtLocal(now),
      };
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmtLocal(start), to: fmtLocal(end) };
    }
    case "last_3_months":
      return {
        from: fmtLocal(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        to: fmtLocal(now),
      };
    case "this_year":
      return { from: `${now.getFullYear()}-01-01`, to: fmtLocal(now) };
    case "custom": {
      if (!sel.from && !sel.to) return null;
      return { from: sel.from || undefined, to: sel.to || undefined };
    }
  }
}

// Append resolved from/to params to a URLSearchParams being built client-side.
export function applyDateRangeParams(
  params: URLSearchParams,
  sel: DateRangeSelection,
): void {
  const r = resolveDateRange(sel);
  if (!r) return;
  if (r.from) params.set("from", r.from);
  if (r.to) params.set("to", r.to);
}

export interface ParsedRange {
  start: Date;
  // First instant AFTER the selected range. Use `lt: endExclusive` in where clauses.
  endExclusive: Date;
}

function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

// Parse `from`/`to` (YYYY-MM-DD, inclusive) query params on the server.
// Accepts either bound independently.
export function parseDateRangeParams(
  searchParams: URLSearchParams,
): ParsedRange | null {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const from = fromRaw ? parseLocalDate(fromRaw) : null;
  const to = toRaw ? parseLocalDate(toRaw) : null;
  if (!from && !to) return null;

  const start = from || new Date(1970, 0, 1);
  const toDay = to || new Date(2999, 11, 31);
  const endExclusive = new Date(
    toDay.getFullYear(),
    toDay.getMonth(),
    toDay.getDate() + 1,
  );
  return { start, endExclusive };
}

// Convenience: where-clause fragment for a single date field.
export function dateRangeWhere(range: ParsedRange | null): {
  gte: Date;
  lt: Date;
} | null {
  if (!range) return null;
  return { gte: range.start, lt: range.endExclusive };
}

// For models storing a period as (year, month) integers (e.g. SalarySlip).
// Returns an AND-of-ORs where fragment covering the overlap, or null.
export function yearMonthRangeWhere(
  range: ParsedRange | null,
): Record<string, unknown>[] | null {
  if (!range) return null;
  const fromY = range.start.getFullYear();
  const fromM = range.start.getMonth() + 1;
  const lastIncluded = new Date(range.endExclusive.getTime() - 1);
  const toY = lastIncluded.getFullYear();
  const toM = lastIncluded.getMonth() + 1;
  return [
    { OR: [{ year: { gt: fromY } }, { year: fromY, month: { gte: fromM } }] },
    { OR: [{ year: { lt: toY } }, { year: toY, month: { lte: toM } }] },
  ];
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTH_SHORT[Number(m) - 1]} ${y}`;
}

// Human-readable label for the current selection (for summary cards).
export function dateRangeLabel(
  sel: DateRangeSelection,
  now: Date = new Date(),
): string {
  if (sel.preset === "custom") {
    if (sel.from && sel.to) return `${sel.from} → ${sel.to}`;
    if (sel.from) return `From ${sel.from}`;
    if (sel.to) return `Until ${sel.to}`;
    return "All time";
  }
  const r = resolveDateRange(sel, now);
  if (!r?.from) return "All time";
  const fromYM = r.from.slice(0, 7);
  const toYM = (r.to || r.from).slice(0, 7);
  if (sel.preset === "this_year") return String(now.getFullYear());
  return fromYM === toYM
    ? monthLabel(fromYM)
    : `${monthLabel(fromYM)} – ${monthLabel(toYM)}`;
}
