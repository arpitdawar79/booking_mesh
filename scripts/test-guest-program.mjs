// Creates and removes its own isolated local database. Never writes application data.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const source = new URL(process.env.DATABASE_URL || "");
if (!["localhost", "127.0.0.1", "::1"].includes(source.hostname))
  throw Error("Guest integration tests require local Postgres");
const name = `booking_mesh_guest_test_${process.pid}`;
const pg = {
  ...process.env,
  PGHOST: source.hostname,
  PGPORT: source.port || "5432",
  PGUSER: decodeURIComponent(source.username),
  PGPASSWORD: decodeURIComponent(source.password),
};
const dir = mkdtempSync(join(tmpdir(), "guest-program-"));
let created = false;
try {
  execFileSync("createdb", [name], { env: pg, stdio: "pipe" });
  created = true;
  const baseline = readFileSync("prisma/schema.prisma", "utf8").replace(
    /model (GuestContact|GuestActivity|GuestReward|GuestReferral|GuestOffer|GuestRedemption|GuestFeedback|GuestLink) \{[\s\S]*?\n\}\n/g,
    "",
  );
  // Remove only new guest-owned fields; unrelated lead fields remain in the baseline.
  const fields = {
    Guest: [
      "birthday",
      "city",
      "tags",
      "notes",
      "whatsappConsent",
      "emailConsent",
      "doNotContact",
      "lastMarketingAt",
      "referralCode",
      "mergedIntoId",
      "contacts",
      "leads",
      "activities",
      "rewards",
      "feedback",
      "links",
      "referrals",
      "referredBy",
      "redemptions",
    ],
    Booking: ["rewards", "guestRedemption", "guestFeedback", "guestLinks"],
    UserLead: ["guestId", "guest"],
    MarketingCampaign: ["guestIds"],
  };
  let old = baseline;
  for (const [model, names] of Object.entries(fields)) {
    old = old.replace(
      new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`),
      (block) =>
        block
          .split("\n")
          .filter(
            (line) =>
              !names.some((field) =>
                new RegExp(`^\\s+${field}\\s`).test(line),
              ) &&
              !line.includes("@@index([mergedIntoId])") &&
              !(model === "UserLead" && line.includes("@@index([guestId])")),
          )
          .join("\n"),
    );
  }
  const file = join(dir, "baseline.prisma");
  writeFileSync(file, old);
  const env = {
    ...process.env,
    APP_BASE_URL: "http://localhost:4041",
    GOOGLE_REVIEW_URL:
      "https://search.google.com/local/writereview?placeid=TEST",
    DATABASE_URL: new URL(`/${name}${source.search}`, source).toString(),
  };
  const sql = execFileSync(
    "pnpm",
    [
      "exec",
      "prisma",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      file,
      "--script",
    ],
    { env, encoding: "utf8" },
  );
  execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-d", name], {
    env: pg,
    input: sql,
    stdio: ["pipe", "pipe", "pipe"],
  });
  execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-d", name], {
    env: pg,
    input:
      "INSERT INTO guests (id,name,phone,created_at,updated_at) VALUES ('legacy','Legacy test guest','+91 98765 43210',now(),now());",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const migration = readFileSync(
    "prisma/migrations/20261009150000_unified_guest_program/migration.sql",
    "utf8",
  );
  execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-d", name], {
    env: pg,
    input: migration,
    stdio: ["pipe", "pipe", "pipe"],
  });
  execFileSync(
    "pnpm",
    ["exec", "tsx", "scripts/test-guest-program-integration.ts"],
    { env, stdio: "inherit" },
  );
  if (process.argv.includes("--ui")) {
    const fixture = join(dir, "ui-fixture.json");
    execFileSync("pnpm", ["exec", "tsx", "scripts/seed-guest-ui-fixture.ts"], {
      env: { ...env, GUEST_UI_FIXTURE_FILE: fixture },
      stdio: "inherit",
    });
    execFileSync("node", ["scripts/test-guest-ui.mjs"], {
      env: { ...env, GUEST_UI_FIXTURE_FILE: fixture },
      stdio: "inherit",
    });
  }
  console.log("Guest migration and database integration checks passed");
} catch (err) {
  if (err.stdout) console.error(String(err.stdout).slice(-3000));
  if (err.stderr) console.error(String(err.stderr).slice(-3000));
  throw err;
} finally {
  if (created) execFileSync("dropdb", [name], { env: pg, stdio: "pipe" });
  rmSync(dir, { recursive: true, force: true });
}
