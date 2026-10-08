import assert from "node:assert/strict";
import test from "node:test";
import {
  amountDistinctiveness,
  amountRelation,
  labelSimilarity,
  nearAmountVariants,
  scorePair,
  shouldAutoMerge,
  type DedupSubject,
} from "../dedup-score";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

const subject = (over: Partial<DedupSubject>): DedupSubject => ({
  kind: "expense",
  amount: 100,
  date: day("2026-10-03"),
  label: "Battery replacement",
  ...over,
});

test("roundness is the primary evidence weight", () => {
  assert.ok(amountDistinctiveness(4375) > amountDistinctiveness(120));
  assert.ok(amountDistinctiveness(120) > amountDistinctiveness(5000));
  assert.equal(amountRelation(4320, 4320), "equal");
  assert.equal(amountRelation(4320, 3420), "transposed");
  assert.equal(amountRelation(4320, 43200), "scale");
  assert.equal(amountRelation(4320, 1111), "different");
});

test("label similarity survives truncation and punctuation", () => {
  assert.equal(labelSimilarity("Rahul Kumar", "Rahul Kumar"), "full");
  assert.equal(labelSimilarity("Rahul Kumar", "rahul, kumar."), "full");
  assert.equal(labelSimilarity("Rahul Kumar", "Rahul"), "full");
  assert.equal(labelSimilarity("Tube light bulb", "Tube light"), "strong");
  assert.equal(labelSimilarity("Ravi Sharma", "Sunil Gupta"), "none");
});

test("non-round amount, same label, dates 1d apart → auto (sheet vs app date mixup)", () => {
  const v = scorePair(
    subject({ amount: 4320, date: day("2026-10-02"), label: "Rahul Kumar" }),
    subject({ amount: 4320, date: day("2026-10-03"), label: "Rahul Kumar" }),
  );
  assert.equal(v.tier, "auto");
  assert.ok(shouldAutoMerge(v));
});

test("round amount, same day, same label → scored review, but legacy exact link holds", () => {
  const v = scorePair(
    subject({ amount: 5000, label: "Staff advance" }),
    subject({ amount: 5000, label: "Staff advance" }),
  );
  assert.equal(v.tier, "review"); // scoring alone wouldn't trust a ₹5000 twin
  // Exact same-day + full label + equal amount is the pre-existing silent-link
  // rule — kept so manual-entry linking doesn't regress.
  assert.equal(shouldAutoMerge(v), true);
  assert.ok(v.reasons.some((r) => r.includes("same day")));
});

test("observed real collisions (same round amount, different labels) stay ignored", () => {
  // Mirrors the Oct-2026 live-data pattern: 5 same-day ₹-round collisions, all
  // distinct transactions. None may reach review.
  const v = scorePair(
    subject({ amount: 1000, label: "Vegetables" }),
    subject({ amount: 1000, label: "Petrol" }),
  );
  assert.equal(v.tier, "ignore");
});

test("dates beyond the window are ignored unless stay dates match", () => {
  const far = scorePair(
    subject({ amount: 4320, date: day("2026-09-20") }),
    subject({ amount: 4320, date: day("2026-10-03") }),
  );
  assert.equal(far.tier, "ignore");

  const stay = { checkIn: day("2026-10-10"), checkOut: day("2026-10-13") };
  const sameStay = scorePair(
    subject({
      kind: "booking", amount: 4320, date: day("2026-09-01"),
      label: "Rahul Kumar", ...stay,
    }),
    subject({
      kind: "booking", amount: 4320, date: day("2026-10-03"),
      label: "Rahul Kumar", ...stay,
    }),
  );
  assert.equal(sameStay.tier, "auto");
  assert.ok(sameStay.reasons.includes("identical stay dates"));
});

test("different stay dates veto an otherwise strong booking match", () => {
  const v = scorePair(
    subject({
      kind: "booking", amount: 4320, label: "Rahul Kumar",
      checkIn: day("2026-10-01"), checkOut: day("2026-10-04"),
    }),
    subject({
      kind: "booking", amount: 4320, label: "Rahul Kumar",
      checkIn: day("2026-10-10"), checkOut: day("2026-10-12"),
    }),
  );
  assert.equal(shouldAutoMerge(v), false);
  assert.ok(v.tier === "ignore" || v.tier === "review");
});

test("digit transposition and decimal slips are review-capped, never auto", () => {
  const transposed = scorePair(
    subject({ amount: 4320, label: "Battery" }),
    subject({ amount: 3420, label: "Battery" }), // same digits
  );
  assert.equal(transposed.amountRelation, "transposed");
  assert.equal(transposed.tier, "review");

  const scale = scorePair(
    subject({ amount: 4320, label: "Battery" }),
    subject({ amount: 43200, label: "Battery" }),
  );
  assert.equal(scale.amountRelation, "scale");
  assert.equal(scale.tier, "review");
});

test("near-amount variants cover typos and decimal slips for candidate queries", () => {
  const variants = new Set(nearAmountVariants(4320));
  assert.ok(variants.has(4320));
  assert.ok(variants.has(43200));
  assert.ok(variants.has(432));
  assert.ok(variants.has(3420)); // swapped 4↔3
  assert.ok(variants.has(4230)); // swapped 3↔2
});

test("non-round amount with mismatched labels → review, never auto-merge", () => {
  const v = scorePair(
    subject({ amount: 4377, label: "Vegetables" }),
    subject({ amount: 4377, label: "Petrol" }),
  );
  assert.equal(v.tier, "review");
  assert.equal(shouldAutoMerge(v), false);
});

test("metadata corroboration lifts a partial match to review", () => {
  const a = subject({ amount: 2000, label: "Rahul Kumar", payer: "Raju", property: "Tirthan" });
  const b = subject({ amount: 2000, label: "Rahul K", payer: "Raju", property: "Tirthan" });
  const v = scorePair(a, b);
  assert.equal(v.tier, "review");
  assert.ok(v.confidence > 0 && v.confidence <= 0.99);
});

test("auto-merge requires non-round amount even with perfect label and same day", () => {
  const v = scorePair(
    subject({ amount: 500, label: "Stationary shop" }),
    subject({ amount: 500, label: "Stationary shop" }),
  );
  assert.equal(v.tier, "review"); // ₹500 too common to auto-collapse
});
