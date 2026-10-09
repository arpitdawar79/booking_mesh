import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseContactsCsv, parseVcf } from "../contact-file-parsers";
import { normalizeContactPhone } from "../phone-normalize";

describe("normalizeContactPhone", () => {
  it("prefixes Indian 10-digit mobiles with 91", () => {
    assert.equal(normalizeContactPhone("98765 43210"), "919876543210");
    assert.equal(normalizeContactPhone("987-654-3210"), "919876543210");
  });
  it("keeps explicit country codes", () => {
    assert.equal(normalizeContactPhone("+91 98765 43210"), "919876543210");
    assert.equal(normalizeContactPhone("+1 415 555 1234"), "14155551234");
    assert.equal(normalizeContactPhone("0091-98765-43210"), "919876543210");
  });
  it("strips Indian trunk prefix 0", () => {
    assert.equal(normalizeContactPhone("09876543210"), "919876543210");
  });
  it("rejects too short / too long / empty", () => {
    assert.equal(normalizeContactPhone("12345"), null);
    assert.equal(normalizeContactPhone("1234567890123456"), null);
    assert.equal(normalizeContactPhone("  "), null);
  });
});

describe("parseVcf", () => {
  it("extracts names, phones, emails and folds wrapped lines", () => {
    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:Ravi Kumar",
      "TEL;TYPE=CELL:098765 432",
      " 10",
      `EMAIL:ravi@example.com`,
      "END:VCARD",
      "BEGIN:VCARD",
      "FN:No Phone",
      "END:VCARD",
      "BEGIN:VCARD",
      "FN:Two Phones",
      "TEL:+919876543210",
      "TEL:9876543210",
      "END:VCARD",
    ].join("\r\n");
    const contacts = parseVcf(vcf);
    assert.equal(contacts.length, 2);
    assert.equal(contacts[0].name, "Ravi Kumar");
    assert.deepEqual(contacts[0].phones, ["098765 43210"]);
    assert.equal(contacts[0].email, "ravi@example.com");
    assert.equal(contacts[1].phones.length, 2);
  });
});

describe("parseContactsCsv", () => {
  it("maps Google-style export columns", () => {
    const csv = [
      'Name,Given Name,Phone 1 Value,Phone 1 Type,E-mail 1 Value',
      '"Sharma, Alok",Alok,9822233344,Mobile,alok@example.com',
      'Solo Raj,Solo,,Mobile,',
    ].join("\n");
    const contacts = parseContactsCsv(csv);
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].name, "Sharma, Alok");
    assert.deepEqual(contacts[0].phones, ["9822233344"]);
    assert.equal(contacts[0].email, "alok@example.com");
  });
});

it("reads grouped Apple vCard fields and escaped names", () => {
  const contacts = parseVcf("BEGIN:VCARD\nVERSION:3.0\nFN;CHARSET=UTF-8:Pat\\, Lee\nitem1.TEL;TYPE=CELL:+14155551234\nitem2.EMAIL:pat@example.com\nEND:VCARD");
  assert.deepEqual(contacts, [{ name: "Pat, Lee", phones: ["+14155551234"], email: "pat@example.com" }]);
});

it("preserves delimiters inside CSV values and splits Google alternate numbers", () => {
  const contacts = parseContactsCsv("Name,Phone 1 - Value\nPat; Lee,+14155551234 ::: +14155555678");
  assert.equal(contacts[0].name, "Pat; Lee");
  assert.deepEqual(contacts[0].phones, ["+14155551234", "+14155555678"]);
});

it("prefers CSV display names over repeated given names", () => {
  assert.equal(parseContactsCsv("Name,Given Name,Family Name,Phone\nPat Lee,Pat,Lee,9876543210")[0].name, "Pat Lee");
});

it("merges duplicate phone metadata and keeps alternate numbers without blocking on malformed email", async () => {
  const { prepareContacts } = await import("../contact-import");
  const result = prepareContacts([
    { phones: ["9876543210", "123"] },
    { name: "Pat", email: "bad email", phones: ["+919876543210", "+14155551234"] },
    { email: "pat@example.com", phones: ["9876543210"] },
  ]);
  assert.equal(result.invalid, 1);
  assert.equal(result.duplicates, 2);
  assert.deepEqual(result.contacts, [
    { phone: "919876543210", name: "Pat", email: "pat@example.com" },
    { phone: "14155551234", name: "Pat", email: undefined },
  ]);
});

it("requests only supported contact fields with the standard multiple option", async () => {
  const { pickPhoneContacts } = await import("../contact-import");
  const records = await pickPhoneContacts({ select: async (fields, options) => {
    assert.deepEqual(fields, ["name", "tel", "email"]);
    assert.deepEqual(options, { multiple: true });
    return [{ name: ["Pat"], tel: ["9876543210"], email: ["pat@example.com"] }];
  } });
  assert.deepEqual(records, [{ name: "Pat", phones: ["9876543210"], email: "pat@example.com" }]);
});
