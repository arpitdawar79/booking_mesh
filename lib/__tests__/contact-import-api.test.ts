import assert from "node:assert/strict";
import { afterEach, it, mock } from "node:test";
import { NextRequest } from "next/server";
import { createAccessToken } from "../auth-edge";
import { logger } from "../logger";

interface Lead {id: string; phoneNumber: string; name: string | null; email: string | null}
interface Snapshot {id: string; importedById: string | null; metadata: Record<string, unknown>}
const snapshots = new Map<string, Snapshot>();
const links = new Map<string, Set<string>>();
let existingLeads: Lead[] = [];
const txDb = {
  userLead: {
    findMany: async (_args?: unknown): Promise<Lead[]> => existingLeads,
    findUnique: async (_args?: unknown) => ({id: "synthetic-lead"}),
    createMany: async (args: {data: {phoneNumber: string; name?: string; source: string; isWhatsAppUser: boolean}[]; skipDuplicates: boolean}) => ({count: args.data.length}),
    update: async (_args?: unknown) => ({id: "synthetic-lead"}),
  },
  contactImport: {
    upsert: async (args: {where: {id: string}; create: Snapshot; update: Record<string, never>}) => {
      if (!snapshots.has(args.where.id)) snapshots.set(args.where.id, args.create);
      return snapshots.get(args.where.id)!;
    },
    update: async (args: {where: {id: string}; data: {leads: {connect: {phoneNumber: string}[]}}}) => {
      const phones = links.get(args.where.id) ?? new Set<string>();
      for (const contact of args.data.leads.connect) phones.add(contact.phoneNumber);
      links.set(args.where.id, phones);
      return {id: args.where.id};
    },
    findMany: async (_args?: unknown) => [],
  },
};
const prisma = {...txDb, $transaction: async (work: (tx: typeof txDb) => Promise<unknown>, _options?: unknown) => work(txDb)};
(globalThis as unknown as {prisma: unknown}).prisma = prisma;
async function POST(request: NextRequest) {
  const route = await import("../../app/api/leads/import/route");
  return route.POST(request);
}

// These tests run the real route with a synthetic DB. No live DB connections.
afterEach(() => {
  mock.restoreAll(); snapshots.clear(); links.clear(); existingLeads = [];
});

async function request(contacts: unknown[], authenticated = true, importContext?: unknown) {
  const token = authenticated ? await createAccessToken({
    userId: "contact-import-test", email: "test@example.com", name: "Test", role: "admin",
  }) : null;
  return new NextRequest("http://localhost/api/leads/import", {
    method: "POST",
    headers: {"Content-Type": "application/json", "User-Agent": "Synthetic browser", ...(token ? {Cookie: `access_token=${token}`} : {})},
    body: JSON.stringify({contacts, importContext}),
  });
}

function stubDb() {
  const find = mock.method(txDb.userLead, "findMany");
  const create = mock.method(txDb.userLead, "createMany");
  const update = mock.method(txDb.userLead, "update");
  const transaction = mock.method(prisma, "$transaction");
  return {find, create, update, transaction};
}

it("rejects unauthenticated contact imports before accessing the database", async () => {
  const db = stubDb();
  assert.equal((await POST(await request([{phone: "9876543210"}], false))).status, 401);
  assert.equal(db.transaction.mock.callCount(), 0);
});

it("rejects oversized contacts or invalid context before accessing the database", async () => {
  const db = stubDb();
  assert.equal((await POST(await request(Array.from({length: 1001}, () => ({phone: "9876543210"}))))).status, 400);
  assert.equal((await POST(await request([{phone: "9876543210"}], true, {id: "not-a-uuid", method: "phone_picker"}))).status, 400);
  assert.equal(db.transaction.mock.callCount(), 0);
});

it("normalizes and deduplicates imports and links their provenance in a transaction", async () => {
  const db = stubDb();
  const response = await POST(await request([{phone: "9876543210"}, {phone: "+919876543210", name: "Pat"}, {phone: "12345"}]));
  assert.equal(response.status, 200);
  const {importId, ...counts} = await response.json();
  assert.deepEqual(counts, {success: true, received: 3, created: 1, updated: 0, skipped: 0, invalid: 1});
  assert.equal(db.transaction.mock.callCount(), 1);
  const args = db.create.mock.calls[0].arguments[0];
  assert.equal(args.data[0].phoneNumber, "919876543210");
  assert.equal(args.data[0].name, "Pat");
  assert.equal(args.data[0].source, "phone_book");
  assert.equal(args.data[0].isWhatsAppUser, false);
  assert.equal(args.skipDuplicates, true);
  assert.deepEqual([...links.get(importId)!], ["919876543210"]);
  assert.equal(snapshots.get(importId)?.importedById, "contact-import-test");
});

it("returns database and history-link failures as errors rather than skipped duplicates", async () => {
  const db = stubDb();
  mock.method(logger, "error", () => {});
  db.create.mock.mockImplementation(async () => {throw new Error("Synthetic database failure");});
  const response = await POST(await request([{phone: "9876543210"}]));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {error: "Internal server error"});
  db.create.mock.restore();
  mock.method(txDb.contactImport, "update", async () => {throw new Error("Synthetic link failure");});
  assert.equal((await POST(await request([{phone: "9876543210"}]))).status, 500);
});

const context = {id: "bfe2b411-89b8-44a0-8218-dd186372a810", method: "phone_picker"};
it("reuses one immutable import snapshot and links unchanged existing contacts on retry", async () => {
  stubDb();
  existingLeads = [{id: "synthetic-lead", phoneNumber: "919876543210", name: "Pat", email: null}];
  assert.equal((await POST(await request([{phone: "9876543210"}], true, context))).status, 200);
  const metadata = snapshots.get(context.id)?.metadata;
  const second = await POST(await request([{phone: "9876543210"}], true, context));
  assert.equal(second.status, 200);
  assert.equal((await second.json()).skipped, 1);
  assert.equal(snapshots.size, 1);
  assert.equal(links.get(context.id)?.size, 1);
  assert.equal(snapshots.get(context.id)?.metadata, metadata);
  assert.equal((await POST(await request([{phone: "9876543210"}], true, {...context, id: "ba8a9490-873f-4002-925e-22f497791ea8"}))).status, 200);
  assert.equal(snapshots.size, 2, "A new logical import retains additional history");
});

it("rejects an import id belonging to another actor or method", async () => {
  const db = stubDb();
  snapshots.set(context.id, {id: context.id, importedById: "other-user", metadata: {method: "phone_picker"}});
  assert.equal((await POST(await request([{phone: "9876543210"}], true, context))).status, 409);
  snapshots.set(context.id, {id: context.id, importedById: "contact-import-test", metadata: {method: "contact_file"}});
  assert.equal((await POST(await request([{phone: "9876543210"}], true, context))).status, 409);
  assert.equal(db.create.mock.callCount(), 0);
  assert.equal(links.size, 0);
});

it("protects source-history reads and returns a bounded uncached page", async () => {
  const {GET} = await import("../../app/api/leads/[id]/imports/route");
  const params = {params: Promise.resolve({id: "synthetic-lead"})};
  const unauthenticated = new NextRequest("http://localhost/api/leads/synthetic-lead/imports");
  assert.equal((await GET(unauthenticated, params)).status, 401);
  const auth = await request([], true);
  const rows = Array.from({length: 51}, (_, index) => ({id: String(index), metadata: {}, createdAt: new Date()}));
  const find = mock.method(txDb.contactImport, "findMany", async () => rows);
  const response = await GET(new NextRequest("http://localhost/api/leads/synthetic-lead/imports?page=2", {headers: auth.headers}), params);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.imports.length, 50);
  assert.equal(data.hasMore, true);
  assert.equal(data.page, 2);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((find.mock.calls[0].arguments[0] as {skip: number}).skip, 50);
});

it("accepts retries when JSONB reorders object keys without changing source values", async () => {
  stubDb();
  const fileContext = {
    ...context, method: "contact_file",
    files: [{name: "contacts.csv", format: "csv", bytes: 100}],
    device: {installationId: context.id, persistence: "local_storage", displayMode: "browser"},
  };
  assert.equal((await POST(await request([{phone: "9876543210"}], true, fileContext))).status, 200);
  const saved = snapshots.get(context.id)!;
  saved.metadata.files = [{bytes: 100, format: "csv", name: "contacts.csv"}];
  saved.metadata.device = {displayMode: "browser", persistence: "local_storage", installationId: context.id};
  assert.equal((await POST(await request([{phone: "9876543210"}], true, fileContext))).status, 200);
  assert.equal((await POST(await request([{phone: "9876543210"}], true, {...fileContext, files: [{name: "different.csv", format: "csv", bytes: 100}]}))).status, 409);
});
