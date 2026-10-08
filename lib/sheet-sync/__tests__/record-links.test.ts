import assert from "node:assert/strict";
import test from "node:test";
import {
  isRecordType,
  recordHref,
  rowRecordLink,
  terminalImportReason,
} from "../record-links";

test("every imported record type navigates to a page that can edit it", () => {
  assert.equal(recordHref("expense", "abc"), "/dashboard/expenses?edit=abc");
  assert.equal(
    recordHref("additional_sale", "abc"),
    "/dashboard/additional-sales?edit=abc",
  );
  assert.equal(recordHref("booking", "abc"), "/dashboard/booking/abc");
});

test("terminal classifications claim no record, so they must not link", () => {
  for (const type of ["not_imported", "excluded_property", "unsupported_revenue_type"]) {
    assert.equal(recordHref(type, "abc"), null, type);
    assert.ok(terminalImportReason(type), type);
  }
  assert.equal(terminalImportReason("excluded_property"), "property is out of scope for the app");
  assert.equal(terminalImportReason(null), null);
});

test("a link needs both halves, and rowRecordLink labels navigable rows", () => {
  assert.equal(recordHref("expense", null), null);
  assert.equal(recordHref(null, "abc"), null);
  assert.equal(rowRecordLink({ linkedRecordId: "abc", linkedRecordType: null }), null);
  assert.deepEqual(rowRecordLink({ linkedRecordId: "abc", linkedRecordType: "booking" }), {
    href: "/dashboard/booking/abc",
    label: "Booking",
  });
});

test("only the three record types are navigable", () => {
  assert.ok(isRecordType("additional_sale"));
  assert.ok(!isRecordType("payout"));
  assert.ok(!isRecordType(undefined));
});
