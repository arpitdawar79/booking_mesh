import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesDiscovery, discoverySegments, sortGuests } from "../discovery";
const guest = {
  name: "Aarav Sharma",
  phone: "919876543210",
  email: "aarav@example.com",
  city: "New Delhi",
  tags: ["Family"],
  preferences: "Vegetarian breakfast",
  notes: "Enjoys river walks",
  contacts: [{ kind: "phone", value: "919876543299" }],
  leads: [{ source: "phone_book", sourceGroupName: "Nature Club" }],
};
test("search combines words across profile, aliases and lead sources", () => {
  assert.equal(matchesDiscovery(guest, "delhi vegetarian family"), true);
  assert.equal(matchesDiscovery(guest, "+91 98765 43299"), true);
  assert.equal(matchesDiscovery(guest, "09876543299"), true);
  assert.equal(matchesDiscovery(guest, "phone book nature"), true);
  assert.equal(matchesDiscovery(guest, "river walks"), true);
  assert.equal(matchesDiscovery(guest, "delhi beach"), false);
});
test("discovery flags expiring balances, profile gaps and reachable guests", () => {
  assert.deepEqual(
    discoverySegments({
      phone: null,
      email: null,
      city: null,
      preferences: null,
      expiringPoints: 40,
      marketingEligible: false,
    }),
    ["expiring_rewards", "profile_incomplete"],
  );
  assert.deepEqual(
    discoverySegments({
      phone: "919876543210",
      email: null,
      city: "Delhi",
      preferences: "Quiet room",
      expiringPoints: 0,
      marketingEligible: true,
    }),
    ["ready_to_contact"],
  );
});
test("priority places recovery ahead of higher revenue; value and recency ordering are stable", () => {
  const rows = [
    {
      id: "b",
      name: "VIP",
      stats: { netRevenue: 50000, lastStay: new Date("2026-02-01") },
      actions: [{ priority: 60 }],
      wallet: 200,
    },
    {
      id: "a",
      name: "Help",
      stats: { netRevenue: 2000, lastStay: new Date("2026-03-01") },
      actions: [{ priority: 100 }],
      wallet: 100,
    },
  ];
  assert.equal(sortGuests(rows, "priority")[0].id, "a");
  assert.equal(sortGuests(rows, "value")[0].id, "b");
  assert.equal(sortGuests(rows, "recent_stay")[0].id, "a");
  assert.equal(sortGuests(rows, "name")[0].id, "a");
  assert.equal(rows[0].id, "b", "sorting leaves source order intact");
});
