import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  readFileSync,
  rmSync,
  cpSync,
  symlinkSync,
  mkdtempSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:net";
import puppeteer from "puppeteer";
const fixture = JSON.parse(
  readFileSync(process.env.GUEST_UI_FIXTURE_FILE, "utf8"),
);
const port = 4041,
  origin = `http://localhost:${port}`,
  work = mkdtempSync(join(tmpdir(), "booking-mesh-guest-ui-"));
for (const name of [
  "app",
  "components",
  "lib",
  "public",
  "prisma",
  "emails",
  "types",
  "jobs",
  "scripts",
  "next.config.ts",
  "package.json",
  "tsconfig.json",
  "next-env.d.ts",
  "middleware.ts",
  "postcss.config.mjs",
  "postcss.config.js",
]) {
  if (existsSync(name)) cpSync(name, join(work, name), { recursive: true });
}
symlinkSync(resolve("node_modules"), join(work, "node_modules"), "dir");
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, resolve);
});
await new Promise((resolve) => probe.close(resolve));
let browser,
  server,
  log = "";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const build = spawn(resolve("node_modules/.bin/next"), ["build", "--webpack"], {
    cwd: work, env: {...process.env,APP_BASE_URL:origin}, stdio:["ignore","pipe","pipe"],
  });
  build.stdout.on("data", d => {log=(log+d).slice(-15000);});
  build.stderr.on("data", d => {log=(log+d).slice(-15000);});
  const buildCode = await new Promise((resolve,reject) => {build.once("error",reject);build.once("exit",resolve);});
  assert.equal(buildCode,0,"Isolated production build must pass before browser checks");
  console.log("Isolated production build passed");
  server = spawn(
    resolve("node_modules/.bin/next"),
    ["start", "--port", String(port)],
    {
      cwd: work,
      env: { ...process.env, APP_BASE_URL: origin },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  server.stdout.on("data", (d) => {
    log = (log + d).slice(-15000);
  });
  server.stderr.on("data", (d) => {
    log = (log + d).slice(-15000);
  });
  for (let i = 0; i < 90; i++) {
    try {
      const response = await fetch(origin + "/login");
      if (response.ok) break;
    } catch {
      await sleep(1000);
    }
  }
  const unauthorized = await fetch(origin + "/api/guests");
  assert.equal(unauthorized.status, 401);
  const staff = await fetch(origin + "/api/guest-program", {
    method: "PATCH",
    headers: {
      Cookie: `access_token=${fixture.staffToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(staff.status, 403);
  browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(45000);
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem("stream-pwa-install-dismissed", "true"),
  );
  await page.setCookie({
    name: "access_token",
    value: fixture.token,
    url: origin,
    httpOnly: true,
    sameSite: "Lax",
  });
  const clickText = async (text) => {
    await page.bringToFront();
    await page.evaluate(() =>
      document.querySelector("button:has(svg.lucide-bell-off)")?.click(),
    );
    console.log("UI check: " + text);
    await page.locator(`button::-p-text(${JSON.stringify(text)})`).click();
  };
  const checkLayout = async () => {
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewport({ width, height: 1000 });
      await sleep(250);
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      );
      if (!fits) {
        console.log(
          "Overflow:",
          await page.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
              .slice(0, 10)
              .map((e) => ({
                tag: e.tagName,
                class: e.className,
                text: e.textContent?.slice(0, 80),
              })),
          ),
        );
        await page.screenshot({
          path: "/tmp/guest-ui-overflow.png",
          fullPage: true,
        });
      }
      assert.equal(fits, true, `Page overflow at ${width}px: ${page.url()}`);
    }
  };
  await page.goto(origin + "/dashboard/guests", { waitUntil: "networkidle0" });
  await page.waitForSelector("h1::-p-text(Guest relationships)");
  await page.waitForSelector("a::-p-text(Aarav Guest Test)");
  await clickText("Convert leads");
  await page.type(
    'input[aria-label="Search leads to convert"]',
    "Nisha Conversion Test",
  );
  await clickText("Preview lead conversion");
  await page.waitForSelector(
    'input[aria-label="Convert Nisha Conversion Test"]',
  );
  await checkLayout();
  await page
    .locator('input[aria-label="Convert Nisha Conversion Test"]')
    .click();
  assert.equal(
    await page.$eval(
      'input[aria-label="Convert Nisha Conversion Test"]',
      (i) => i.checked,
    ),
    true,
  );
  await clickText("Convert 1 selected lead(s)");
  await page.waitForSelector("p::-p-text(Selected leads converted)");
  const convertedUrl = await page.$eval("a::-p-text(Open guest profile)", (a) =>
    a.getAttribute("href"),
  );
  const convertedGuestId = convertedUrl.split("/").at(-1);
  const convertedProfile = await fetch(
    origin + `/api/guests?id=${convertedGuestId}`,
    { headers: { Cookie: `access_token=${fixture.token}` } },
  ).then((r) => r.json());
  assert.equal(convertedProfile.guest.doNotContact, true);
  assert.equal(convertedProfile.guest.whatsappConsent, false);
  assert.equal(convertedProfile.stats.lifecycle, "prospect");
  const repeatedConversion = await fetch(origin + "/api/guests/link-leads", {
    method: "POST",
    headers: {
      Cookie: `access_token=${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apply: true, leadIds: [fixture.conversionLeadId] }),
  }).then((r) => r.json());
  assert.equal(repeatedConversion.results[0].status, "already_linked");
  await clickText("Convert leads");
  const searchGuests = async (query, segment = "all", sort = "updated") =>
    fetch(
      origin +
        `/api/guests?${new URLSearchParams({ search: query, segment, sort })}`,
      { headers: { Cookie: `access_token=${fixture.token}` } },
    ).then((r) => r.json());
  assert.equal(
    (await searchGuests("+91 98765 43298")).guests[0].id,
    fixture.guestId,
    "Alias lookup handles phone formatting",
  );
  assert.equal(
    (await searchGuests("Delhi vegetarian family")).guests[0].id,
    fixture.guestId,
    "Multi-field discovery",
  );
  assert.ok(
    (await searchGuests("", "ready_to_contact")).guests.some(
      (g) => g.id === fixture.guestId,
    ),
  );
  assert.equal((await searchGuests("Nisha", "ready_to_contact")).total, 0);
  for (const sort of ["priority", "value", "recent_stay", "points", "name"])
    assert.ok(Array.isArray((await searchGuests("", "all", sort)).guests));
  const createBooking = async (contact, date) => {
    const response = await fetch(origin + "/api/bookings", {
      method: "POST",
      headers: {
        Cookie: `access_token=${fixture.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestFullName: "Automatic Profile Test",
        ...contact,
        checkInDate: `2020-${date}-01`,
        checkOutDate: `2020-${date}-02`,
        totalAmount: 1000,
      }),
    });
    const d = await response.json();
    assert.equal(response.status, 200, JSON.stringify(d));
    assert.ok(d.booking.guestId);
    return d.booking;
  };
  const phoneBooking = await createBooking(
    { guestPhone: "+91 98000 00003" },
    "01",
  );
  const emailBooking = await createBooking(
    { guestEmail: "EMAIL-AUTO@example.com" },
    "02",
  );
  const phoneRepeat = await createBooking({ guestPhone: "9800000003" }, "03");
  const emailRepeat = await createBooking(
    { guestEmail: "email-auto@example.com" },
    "04",
  );
  assert.equal(
    phoneRepeat.guestId,
    phoneBooking.guestId,
    "Repeated phone booking reuses profile",
  );
  assert.equal(
    emailRepeat.guestId,
    emailBooking.guestId,
    "Email-only booking reuses profile",
  );
  const conflictResponse = await fetch(origin + "/api/bookings", {
    method: "POST",
    headers: {
      Cookie: `access_token=${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      guestFullName: "Conflicting Auto Profile",
      guestPhone: "9800000003",
      guestEmail: "email-auto@example.com",
      checkInDate: "2020-05-01",
      checkOutDate: "2020-05-02",
      totalAmount: 1000,
    }),
  });
  assert.equal(conflictResponse.status, 409);

  await checkLayout();
  await page.click('input[aria-label="Select Aarav Guest Test for campaign"]');
  await clickText("Prepare campaign");
  await clickText("Preview audience");
  await page.waitForSelector("p::-p-text(1 eligible)");
  await clickText("Save draft");
  await page.waitForSelector("p::-p-text(Campaign draft saved)");
  await page.goto(origin + `/dashboard/guests/${fixture.guestId}`, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector("h1::-p-text(Aarav Guest Test)");
  await checkLayout();
  await page.setViewport({ width: 1440, height: 1050 });
  await page.screenshot({
    path: "/tmp/booking-mesh-guest-profile.png",
    fullPage: true,
  });
  await clickText("Loyalty & benefits");
  await page.waitForSelector("h2::-p-text(Loyalty wallet)");
  assert.ok((await page.content()).includes("1,000"));
  await checkLayout();
  await clickText("Referrals");
  await page.waitForSelector("h2::-p-text(Referral program)");
  await checkLayout();
  await clickText("Feedback & reviews");
  await page.waitForSelector("h2::-p-text(Feedback & Google reviews)");
  await checkLayout();
  await clickText("Stays & timeline");
  await page.waitForSelector("h2::-p-text(Relationship timeline)");
  await checkLayout();
  await clickText("Edit profile");
  await page.waitForSelector("h2::-p-text(Edit guest profile)");
  await checkLayout();
  await clickText("Cancel");
  await page.goto(origin + "/dashboard/guests/program", {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector("h2::-p-text(Loyalty & retention settings)");
  await checkLayout();
  await clickText("Preview historical linking");
  await sleep(500);
  const feedbackToken = fixture.feedbackUrl.split("/").at(-1);
  await fetch(origin + `/api/guest-feedback/${feedbackToken}`);
  const publicPage = await browser.newPage();
  publicPage.on("pageerror", (e) => errors.push(e.message));
  await publicPage.bringToFront();
  await publicPage.goto(
    fixture.feedbackUrl.replace(new URL(fixture.feedbackUrl).origin, origin),
    { waitUntil: "networkidle0" },
  );
  await publicPage.waitForSelector("a::-p-text(Write a Google review)");
  assert.equal(
    await publicPage.$("button::-p-text(Not now)"),
    null,
    "Guest form has no installation prompt",
  );
  await publicPage.waitForNetworkIdle({ idleTime: 1000 });
  await publicPage.click('input[type="radio"][value="1"]');
  await publicPage.type("textarea", "The room needed a little more attention.");
  await publicPage.click('input[type="checkbox"]');
  assert.equal(await publicPage.$eval("form", (f) => f.checkValidity()), true);
  assert.equal(
    await publicPage.$eval('input[value="1"]', (i) => i.checked),
    true,
  );
  await publicPage.click("button::-p-text(Share feedback)");
  await publicPage.waitForSelector(
    "div::-p-text(Thank you. Your feedback has been received.)",
  );
  assert.ok(
    await publicPage.$("a::-p-text(Write a Google review)"),
    "Google review remains available after low-rated feedback",
  );
  const token = fixture.feedbackUrl.split("/").at(-1);
  const repeat = await fetch(origin + `/api/guest-feedback/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: 5, followUp: false }),
  });
  assert.equal(repeat.status, 409);
  await page.bringToFront();
  await page.goto(origin + `/dashboard/guests/${fixture.guestId}`, {
    waitUntil: "networkidle0",
  });
  await page.waitForSelector("h3::-p-text(Resolve guest feedback)");
  await clickText("Feedback & reviews");
  await page.waitForSelector("p::-p-text(Guest requested follow-up)");
  await clickText("Record resolution");
  await page.type(
    "textarea",
    "Called guest and arranged a service recovery follow-up.",
  );
  await clickText("Save resolution");
  await page.waitForSelector("p::-p-text(Resolution: Called guest)");
  await publicPage.bringToFront();
  await publicPage.goto(
    fixture.preferencesUrl.replace(
      new URL(fixture.preferencesUrl).origin,
      origin,
    ),
    { waitUntil: "networkidle0" },
  );
  await publicPage.waitForSelector(
    "h1::-p-text(Your communication preferences)",
  );
  await publicPage.waitForNetworkIdle({ idleTime: 1000 });
  const checkboxes = await publicPage.$$('input[type="checkbox"]');
  await checkboxes[2].click();
  await publicPage.click("button::-p-text(Save preferences)");
  await publicPage.waitForSelector(
    "div::-p-text(Your preferences have been saved.)",
  );
  const profile = await fetch(origin + `/api/guests?id=${fixture.guestId}`, {
    headers: { Cookie: `access_token=${fixture.token}` },
  }).then((r) => r.json());
  assert.equal(profile.guest.doNotContact, true);
  assert.equal(profile.marketingEligible, false);
  const retained = await fetch(origin + "/api/guest-retention", {
    method: "POST",
    headers: {
      Cookie: `access_token=${fixture.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      guestIds: [fixture.guestId],
      name: "After opt-out",
      message: "Hi {{name}}",
      preview: true,
    }),
  }).then((r) => r.json());
  assert.equal(
    retained.eligible,
    0,
    "Opt-out after drafting changes eligibility",
  );
  await page.bringToFront();
  await page.goto(origin + "/dashboard/marketing", {
    waitUntil: "networkidle0",
  });
  await clickText("Leads");
  await page.waitForSelector(
    'input[aria-label="Select Dev Marketing Conversion for guest conversion"]',
  );
  await page.click(
    'input[aria-label="Select Dev Marketing Conversion for guest conversion"]',
  );
  await clickText("Convert 1 selected lead(s)");
  await clickText("Preview lead conversion");
  await page.waitForSelector(
    'input[aria-label="Convert Dev Marketing Conversion"]',
  );
  await page.click('input[aria-label="Convert Dev Marketing Conversion"]');
  // The selection toolbar and preview now both show conversion buttons; submit the preview button.
  await page
    .locator("section button::-p-text(Convert 1 selected lead(s))")
    .click();
  await page.waitForSelector("p::-p-text(Selected leads converted)");
  await checkLayout();
  assert.deepEqual(errors, [], "No browser JavaScript errors");
  console.log(
    "Browser checks passed: automatic phone/email booking profiles, repeat recognition and identity conflicts; lead conversion in Guests and Marketing; discovery searches and ordering; directory/profile/program at 320, 768, 1024, 1440px; campaign preview/draft; private feedback; independent review link; staff resolution; public opt-out; API access controls. No outbound messages sent.",
  );
} catch (err) {
  console.error(log.slice(-7000).replace(/[a-f0-9]{64}/g, "[test token]"));
  throw err;
} finally {
  await browser?.close();
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
    await sleep(1000);
  }
  rmSync(work, { recursive: true, force: true });
}
