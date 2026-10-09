import assert from "node:assert/strict";
import test from "node:test";
import {
  guestStats,
  nextActions,
  qualifyPoints,
  rewardLots,
  discountQuote,
  matchingGuestIds,
  DEFAULT_PROGRAM,
} from "../core";

const now = new Date("2026-10-09T09:00:00Z");
const stay = {
  id: "b1",
  status: "completed",
  currency: "INR",
  checkInDate: new Date("2026-01-01"),
  checkOutDate: new Date("2026-01-04"),
  nightCount: 3,
  roomType: "Boutique",
  totalAmount: 10000,
  amountPaidOnline: 10000,
  payments: [],
};
const program = { ...DEFAULT_PROGRAM, enabled: true };

test("completed history excludes cancellations and future completed mistakes; net collected subtracts refunds", () => {
  const stats = guestStats(
    [
      stay,
      { ...stay, id: "cancelled", status: "cancelled" },
      { ...stay, id: "future", checkOutDate: new Date("2027-01-01") },
      { ...stay, id: "b2", payments: [{ amount: 2000, isRefund: true }] },
    ],
    now,
  );
  assert.equal(stats.totalStays, 2);
  assert.equal(stats.netRevenue, 18000);
  assert.equal(stats.totalNights, 6);
});
test("no points before checkout, on cancelled or unsettled stays, or while program is disabled", () => {
  assert.equal(qualifyPoints(stay, DEFAULT_PROGRAM, now), 0);
  assert.equal(qualifyPoints(stay, program, now), 1000);
  assert.equal(
    qualifyPoints({ ...stay, status: "cancelled" }, program, now),
    0,
  );
  assert.equal(
    qualifyPoints({ ...stay, amountPaidOnline: 9000 }, program, now),
    0,
  );
  assert.equal(
    qualifyPoints(
      { ...stay, checkOutDate: new Date("2027-01-01") },
      program,
      now,
    ),
    0,
  );
  assert.equal(qualifyPoints({ ...stay, currency: "USD" }, program, now), 0);
});
test("spend oldest points first, expiry only removes remaining points", () => {
  const lots = rewardLots(
    [
      { id: "a", points: 100, expiresAt: new Date("2026-09-01") },
      { id: "b", points: 100, expiresAt: new Date("2027-01-01") },
      { id: "c", points: -130, expiresAt: null },
    ],
    now,
  );
  assert.equal(lots.balance, 70);
  assert.equal(lots.expired.length, 0);
  const expired = rewardLots(
    [
      { id: "a", points: 100, expiresAt: new Date("2026-09-01") },
      { id: "c", points: -30, expiresAt: null },
    ],
    now,
  );
  assert.equal(expired.balance, 0);
  assert.deepEqual(expired.expired, [{ id: "a", points: 70 }]);
});
test("phone and email matching different people produces two ids, not first-match wins", () => {
  assert.deepEqual(
    matchingGuestIds(
      [
        { id: "a", phone: "+91 98765 43210", email: null },
        { id: "b", phone: null, email: "HELLO@EXAMPLE.COM" },
      ],
      "9876543210",
      "hello@example.com",
    ),
    ["a", "b"],
  );
});
test("discount quote caps points value and rejects insufficient points", () => {
  assert.equal(
    discountQuote(
      { total: 10000, netPaid: 0, points: 1000, balance: 1000, percent: 0 },
      program,
    ).amount,
    100,
  );
  assert.throws(
    () =>
      discountQuote(
        { total: 10000, netPaid: 0, points: 1001, balance: 1000, percent: 0 },
        program,
      ),
    /points/,
  );
  assert.equal(
    discountQuote(
      { total: 10000, netPaid: 9950, points: 1000, balance: 1000, percent: 0 },
      program,
    ).amount,
    50,
  );
  assert.throws(
    () =>
      discountQuote(
        { total: 10000, netPaid: 0, points: 100, balance: 100, percent: 5 },
        program,
      ),
    /stack/,
  );
});
test("unresolved feedback takes priority over win-back and opted-out guests get no marketing actions", () => {
  const stats = guestStats([stay], now);
  assert.equal(
    nextActions(
      {
        stats,
        birthday: null,
        doNotContact: false,
        whatsappConsent: true,
        emailConsent: false,
        openFeedback: 1,
        wallet: 100,
      },
      program,
      now,
    )[0].kind,
    "service_recovery",
  );
  assert.equal(
    nextActions(
      {
        stats,
        birthday: null,
        doNotContact: true,
        whatsappConsent: true,
        emailConsent: false,
        openFeedback: 0,
        wallet: 100,
      },
      program,
      now,
    ).length,
    0,
  );
});

test("negative debt offsets future earning and does not expire twice", () => {
  const result = rewardLots(
    [
      { id: "a", points: -100, expiresAt: null },
      { id: "b", points: 150, expiresAt: new Date("2026-09-01") },
    ],
    now,
  );
  assert.equal(result.balance, 0);
  assert.deepEqual(result.expired, [{ id: "b", points: 50 }]);
  const posted = rewardLots(
    [
      { id: "a", points: 100, expiresAt: new Date("2026-09-01") },
      { id: "expire", points: -100, expiresAt: null },
    ],
    now,
  );
  assert.equal(posted.balance, 0);
  assert.deepEqual(posted.expired, []);
});
test("future reservation suppresses win-back even when guest is inactive", () => {
  const stats = guestStats(
    [
      stay,
      {
        ...stay,
        id: "upcoming",
        status: "confirmed",
        checkOutDate: new Date("2027-01-01"),
      },
    ],
    now,
  );
  const actions = nextActions(
    {
      stats,
      birthday: null,
      doNotContact: false,
      whatsappConsent: true,
      emailConsent: false,
      openFeedback: 0,
      wallet: 0,
    },
    program,
    now,
  );
  assert.equal(
    actions.some((a) => a.kind === "win_back"),
    false,
  );
});
test("birthday uses India calendar day, not server UTC date", () => {
  const actions = nextActions(
    {
      stats: guestStats([], now),
      birthday: new Date("1990-10-10"),
      doNotContact: false,
      whatsappConsent: true,
      emailConsent: false,
      openFeedback: 0,
      wallet: 0,
    },
    program,
    new Date("2026-10-09T20:00:00Z"),
  );
  assert.equal(actions[0].kind, "birthday");
});
test("program validation rejects descending tiers and discount over cap", async () => {
  const { programSchema, offerSchema, profileFields } = await import(
    "../validation"
  );
  assert.equal(
    programSchema.safeParse({ ...program, silverStays: 10, goldStays: 5 })
      .success,
    false,
  );
  assert.equal(
    programSchema.safeParse({ ...program, platinumPercent: 40 }).success,
    false,
  );
  assert.equal(
    profileFields.safeParse({ name: "", email: "bad" }).success,
    false,
  );
  assert.equal(
    offerSchema.safeParse({
      code: "RETURN",
      name: "Return",
      percent: 5,
      maxAmount: 500,
      minAmount: 1000,
      minStays: 1,
      startsAt: "2026-10-10T00:00:00Z",
      expiresAt: "2026-10-09T00:00:00Z",
      maxUses: 10,
      enabled: false,
    }).success,
    false,
  );
});
