/**
 * Probability-weighted duplicate matching.
 *
 * Empirically (Oct 2026, live data): same date + same amount alone is almost
 * never a duplicate — ~40% of expense amounts are round ₹1000s, so collisions
 * are coincidence. Amount distinctiveness is therefore the primary evidence
 * weight, labels are similarity-scored (not exact-matched), and dates are a
 * decaying window (±3d) instead of a hard filter — ops routinely records the
 * same transaction one or two days apart between sheet and app.
 */

export type DedupKind = "expense" | "additional_sale" | "booking";
export type DedupTier = "auto" | "review" | "ignore";
export type LabelLevel = "full" | "strong" | "partial" | "none";
export type AmountRelation = "equal" | "transposed" | "scale" | "different";

export interface DedupSubject {
  kind: DedupKind;
  amount: number;
  date: Date | null; // UTC day of the transaction/sale
  label: string; // particular / guest name
  payer?: string; // paidBy / receivedBy
  property?: string;
  source?: string;
  checkIn?: Date | null; // bookings only
  checkOut?: Date | null;
}

export interface DedupVerdict {
  tier: DedupTier;
  score: number;
  confidence: number; // 0..1, for review UI
  reasons: string[];
  amountRelation: AmountRelation;
  labelLevel: LabelLevel;
  sameDay: boolean;
  diffDays: number | null;
  stayExact: boolean;
  stayMismatch: boolean; // bookings whose stay ranges clearly differ
}

export const DEDUP_DATE_WINDOW_DAYS = 3;

const W = {
  amount: { exact: 6, tens: 4.5, hundreds: 3, thousands: 1, special: 3 },
  date: { same: 3, d1: 2, d2: 1.5, d3: 1 },
  label: { full: 4, strong: 2.5, partial: 1, none: 0 },
  stayExact: 3,
  stayDisjoint: -4,
  metaEach: 1,
  metaCap: 2,
  autoTotal: 8,
  autoAmountFloor: 4, // only amounts distinctive to ≤10 granularity may auto-merge
  reviewTotal: 6,
} as const;

const DAY_MS = 86400_000;

export function dayFloor(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((dayFloor(a).getTime() - dayFloor(b).getTime()) / DAY_MS);
}

export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(raw: string): string[] {
  return normalizeLabel(raw).split(" ").filter(Boolean);
}

export function labelSimilarity(a: string, b: string): LabelLevel {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) return "none";
  if (na === nb) return "full";
  const ta = tokens(a);
  const tb = tokens(b);
  // "Rahul Kumar" vs "Rahul Kumar S" / "Rahul" — one contains the other prefix-wise
  const shorter = ta.length <= tb.length ? ta : tb;
  const longer = ta.length <= tb.length ? tb : ta;
  const prefixMatch = shorter.every((t, i) => longer[i] === t);
  if (prefixMatch && shorter.length >= 1 && (ta[0] === tb[0])) {
    return shorter.length === 1 || shorter.length === longer.length ? "full" : "strong";
  }
  const setA = new Set(ta);
  const shared = tb.filter((t) => setA.has(t)).length;
  const jaccard = shared / new Set([...ta, ...tb]).size;
  if (jaccard >= 0.6) return "strong";
  if (jaccard >= 0.4 || ta[0] === tb[0]) return "partial";
  return "none";
}

/** Higher for non-round amounts: two ₹4,375 entries are one transaction; two ₹5,000s may be two. */
export function amountDistinctiveness(amount: number): number {
  const a = Math.round(amount);
  if (a % 1000 === 0) return W.amount.thousands;
  if (a % 100 === 0) return W.amount.hundreds;
  if (a % 10 === 0) return W.amount.tens;
  return W.amount.exact;
}

function digitSignature(amount: number): string {
  return String(Math.round(amount)).split("").sort().join("");
}

export function amountRelation(a: number, b: number): AmountRelation {
  const x = Math.round(a);
  const y = Math.round(b);
  if (x === y) return "equal";
  if (x * 10 === y || y * 10 === x || x * 100 === y || y * 100 === x) return "scale";
  if (digitSignature(x) === digitSignature(y)) return "transposed";
  return "different";
}

/**
 * Amounts a possible duplicate could show as: exact, scale errors (10×/100×
 * either way) and adjacent-digit transpositions. Used to widen candidate
 * DB queries beyond exact amounts. Bounded and cheap.
 */
export function nearAmountVariants(amount: number): number[] {
  const x = Math.round(amount);
  if (x <= 0) return [];
  const out = new Set<number>([x]);
  for (const v of [x * 10, x * 100]) out.add(v);
  for (const v of [x / 10, x / 100]) if (Number.isInteger(v) && v > 0) out.add(v);
  const digits = String(x).split("");
  for (let i = 0; i < digits.length - 1; i++) {
    const swapped = [...digits];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    if (swapped[0] !== "0") out.add(Number(swapped.join("")));
  }
  return [...out];
}

function scoreToConfidence(score: number): number {
  return Math.min(0.99, Math.max(0.05, Math.round((score / 13) * 100) / 100));
}

export function scorePair(a: DedupSubject, b: DedupSubject): DedupVerdict {
  const reasons: string[] = [];
  const relation = amountRelation(a.amount, b.amount);
  if (relation === "different") {
    return verdict("ignore", 0, reasons, relation, "none", false, null, false, false);
  }

  const labelLevel = labelSimilarity(a.label, b.label);
  const stayExact =
    a.kind === "booking" &&
    b.kind === "booking" &&
    !!a.checkIn &&
    !!b.checkIn &&
    dayFloor(a.checkIn).getTime() === dayFloor(b.checkIn).getTime() &&
    dayFloor(a.checkOut ?? a.checkIn).getTime() ===
      dayFloor(b.checkOut ?? b.checkIn).getTime();
  const stayDisjoint =
    a.kind === "booking" && b.kind === "booking" && !!a.checkIn && !!b.checkIn && !stayExact;

  const diffDays = a.date && b.date ? dayDiff(a.date, b.date) : null;
  const ad = Math.abs(diffDays ?? 0);
  const sameDay = diffDays === 0 || (diffDays === null && stayExact);
  if (diffDays !== null && ad > DEDUP_DATE_WINDOW_DAYS && !stayExact) {
    return verdict("ignore", 0, [`dates ${ad}d apart`], relation, labelLevel, false, diffDays, false, stayDisjoint);
  }

  let score = 0;
  if (relation === "equal") {
    const amountW = amountDistinctiveness(a.amount);
    score += amountW;
    if (amountW >= W.amount.tens) {
      reasons.push(`same non-round ₹${Math.round(a.amount)}`);
    }
  } else {
    score += W.amount.special;
    reasons.push(
      relation === "scale"
        ? `₹${Math.round(a.amount)} vs ₹${Math.round(b.amount)} — possible decimal slip`
        : `₹${Math.round(a.amount)} vs ₹${Math.round(b.amount)} — possible digit typo`,
    );
  }

  if (diffDays !== null) {
    const dateW =
      ad === 0 ? W.date.same
      : ad === 1 ? W.date.d1
      : ad === 2 ? W.date.d2
      : ad === 3 ? W.date.d3
      : 0;
    score += dateW;
    reasons.push(ad === 0 ? "same day" : `dates ${ad}d apart`);
  }

  score += W.label[labelLevel];
  if (labelLevel !== "none") reasons.push(`${labelLevel} label match`);

  if (stayExact) {
    score += W.stayExact;
    reasons.push("identical stay dates");
  } else if (stayDisjoint) {
    score += W.stayDisjoint;
    reasons.push("different stay dates");
  }

  let meta = 0;
  const metaHits: string[] = [];
  if (a.payer && b.payer && normalizeLabel(a.payer) === normalizeLabel(b.payer)) {
    meta += W.metaEach;
    metaHits.push("same payer");
  }
  if (a.property && b.property && normalizeLabel(a.property) === normalizeLabel(b.property)) {
    meta += W.metaEach;
    metaHits.push("same property");
  }
  if (a.source && b.source && normalizeLabel(a.source) === normalizeLabel(b.source)) {
    meta += W.metaEach;
    metaHits.push("same source");
  }
  score += Math.min(meta, W.metaCap);
  reasons.push(...metaHits);

  // Auto tier: strong, low-coincidence evidence. Never on round amounts, never
  // on transposed/scale amounts, never with a weak label, and the date must be
  // near — unless stay dates are identical (sales/payment dates drift routinely).
  const autoPossible =
    relation === "equal" &&
    amountDistinctiveness(a.amount) >= W.autoAmountFloor &&
    (labelLevel === "full" || labelLevel === "strong") &&
    ((diffDays !== null && ad <= 2) || stayExact) &&
    !stayDisjoint;

  const tier: DedupTier =
    autoPossible && score >= W.autoTotal
      ? "auto"
      : score >= W.reviewTotal
        ? "review"
        : "ignore";

  return verdict(tier, score, reasons, relation, labelLevel, sameDay, diffDays, stayExact, stayDisjoint);
}

function verdict(
  tier: DedupTier,
  score: number,
  reasons: string[],
  amountRelationKind: AmountRelation,
  labelLevel: LabelLevel,
  sameDay: boolean,
  diffDays: number | null,
  stayExact: boolean,
  stayMismatch: boolean,
): DedupVerdict {
  return {
    tier,
    score,
    confidence: scoreToConfidence(score),
    reasons,
    amountRelation: amountRelationKind,
    labelLevel,
    sameDay,
    diffDays,
    stayExact,
    stayMismatch,
  };
}

/**
 * The legacy silent-link condition (exact amount + same day + full label).
 * Preserved so today's zero-friction manual-entry linking doesn't regress;
 * everything smarter than this requires a tier-auto verdict to auto-merge.
 */
export function isExactSameDay(v: DedupVerdict): boolean {
  return v.amountRelation === "equal" && v.sameDay && v.labelLevel === "full";
}

/** True when the pair is strong enough to collapse two rows onto one record. */
export function shouldAutoMerge(v: DedupVerdict): boolean {
  if (v.stayMismatch) return false; // different stays = different bookings
  return v.tier === "auto" || isExactSameDay(v);
}
