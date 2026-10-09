import assert from "node:assert/strict";
import { it } from "node:test";
import { importContextSchema } from "../contact-import-context";
import { buildImportMetadata } from "../contact-import-metadata";

const id = "bfe2b411-89b8-44a0-8218-dd186372a810";
it("validates bounded metadata and strips client-supplied IP/actor fields", () => {
  const context = importContextSchema.parse({id, method: "phone_picker", ip: "1.2.3.4", actorUserId: "spoofed"});
  assert.equal("ip" in context, false);
  assert.equal("actorUserId" in context, false);
  assert.equal(importContextSchema.safeParse({id, method: "contact_file", files: [{name: "x".repeat(256), format: "csv", bytes: 1}]}).success, false);
});

it("captures request metadata and labels unconfigured IP headers as unverified", () => {
  const metadata = buildImportMetadata(new Headers({"user-agent": "Synthetic browser", "x-forwarded-for": "203.0.113.7, 10.0.0.1"}), {id, method: "phone_picker"}, undefined, new Date("2026-10-09T12:00:00Z"));
  assert.equal(metadata.method, "phone_picker");
  assert.equal(metadata.browser.userAgent, "Synthetic browser");
  assert.deepEqual(metadata.network, {ip: "203.0.113.7", header: "x-forwarded-for", trust: "unverified_header"});
  assert.equal(metadata.capturedAt, "2026-10-09T12:00:00.000Z");
});

it("uses only the configured proxy header and rejects malformed IPs", () => {
  assert.equal(buildImportMetadata(new Headers({"x-real-ip": "203.0.113.8", "x-forwarded-for": "203.0.113.9"}), undefined, "x-real-ip").network.ip, "203.0.113.8");
  assert.equal(buildImportMetadata(new Headers({"x-real-ip": "203.0.113.8"}), undefined, "cf-connecting-ip").network.ip, null);
  assert.equal(buildImportMetadata(new Headers({"x-real-ip": "not an ip"}), undefined).network.ip, null);
});
