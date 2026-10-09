// Isolated browser checks: synthetic contacts and a fake API; no database writes.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { compile } from "tailwindcss";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const work = await mkdtemp(join(tmpdir(), "contact-import-ui-"));
let browser;
let server;
try {
  const source = await readFile("components/leads/phone-contact-import.tsx", "utf8") + await readFile("components/leads/contact-source-history.tsx", "utf8");
  const css = await compile(await readFile("app/globals.css", "utf8"), {
    base: resolve("app"),
    loadStylesheet: async (id, base) => {
      const path = id.startsWith(".") ? resolve(base, id) : require.resolve(id === "tailwindcss" ? "tailwindcss/index.css" : id);
      return { path, base: dirname(path), content: await readFile(path, "utf8") };
    },
  });
  const styles = css.build(source.match(/[^\s"'`<>=]+/g));
  const bundle = await build({
    stdin: {
      contents: `import React, {useState} from 'react';
        import {createRoot} from 'react-dom/client';
        import {PhoneContactImport} from './components/leads/phone-contact-import';
        import {ContactSourceHistory} from './components/leads/contact-source-history';
        function Harness() {const [open,setOpen]=useState(true);return <>
          <button id="reopen" onClick={()=>setOpen(true)}>Open import</button>
          <PhoneContactImport open={open} onClose={()=>setOpen(false)} onImported={()=>{}} />
          <ContactSourceHistory leadId="synthetic-lead" source="phone_book" /></>}
        createRoot(document.getElementById('root')).render(<Harness/>);`,
      loader: "tsx", resolveDir: process.cwd(),
    }, bundle: true, write: false, platform: "browser", format: "iife",
    define: { "process.env.NODE_ENV": '"development"' },
  });
  const script = bundle.outputFiles[0].text;
  let requests = [];
  let contexts = [];
  let failSecond = false;
  let historyRequests = 0;
  server = createServer(async (req, res) => {
    if (req.url === "/api/leads/import") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const {contacts, importContext} = JSON.parse(body);
      contexts.push(importContext);
      requests.push(contacts);
      res.setHeader("Content-Type", "application/json");
      if (failSecond && requests.length === 2) {
        res.statusCode = 503;
        return res.end(JSON.stringify({error: "Synthetic unavailable server"}));
      }
      return res.end(JSON.stringify({received: contacts.length, created: contacts.length, updated: 0, skipped: 0, invalid: 0}));
    }
    if (req.url.startsWith("/api/leads/synthetic-lead/imports")) {
      historyRequests++;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({page: 1, hasMore: false, imports: [{
        id: contexts[0]?.id, createdAt: "2026-10-09T12:00:00Z", importedBy: {name: "Synthetic uploader"},
        metadata: {...contexts[0], network: {ip: "203.0.113.7", trust: "unverified_header"}, browser: {userAgent: "Synthetic browser"}},
      }]}));
    }
    if (req.url === "/bundle.js") {res.setHeader("Content-Type", "text/javascript");return res.end(script);}
    res.setHeader("Content-Type", "text/html");
    res.end(`<html><head><style>${styles}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  const url = `http://127.0.0.1:${server.address().port}`;
  const clickText = async (text) => {
    await page.waitForFunction((text) => [...document.querySelectorAll("button")].some((button) => button.textContent.includes(text)), {}, text);
    await page.evaluate((text) => [...document.querySelectorAll("button")].find((button) => button.textContent.includes(text)).click(), text);
  };
  const upload = async (text, name = "contacts.csv") => {
    const file = join(work, name);
    await writeFile(file, text);
    await (await page.$('input[type="file"]')).uploadFile(file);
    await page.waitForSelector('input[aria-label="Search imported contacts"]');
  };
  await page.goto(url);
  await page.waitForSelector("dialog[open]");
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewport({width, height: 900});
    assert.equal(await page.evaluate(() => {
      const dialog = document.querySelector("dialog");
      const rect = dialog.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && dialog.scrollWidth <= dialog.clientWidth;
    }), true, `Dialog overflow at ${width}px`);
  }
  assert.equal(await page.$('button::-p-text(Choose phone contacts)'), null);
  await upload("Name,Phone\nPat,9876543210\nPat duplicate,+919876543210\nLee,+14155551234");
  assert.equal(requests.length, 0, "Preview must not upload contacts");
  if (process.env.CONTACT_IMPORT_PREVIEW_PATH) {
    await page.setViewport({width: 320, height: 900});
    await page.screenshot({path: process.env.CONTACT_IMPORT_PREVIEW_PATH});
  }
  const checkboxes = await page.$$('input[type="checkbox"]');
  assert.equal(checkboxes.length, 3, "Select all plus two deduplicated numbers");
  await checkboxes[2].click();
  await clickText("Import 1 numbers");
  await page.waitForFunction(() => document.body.textContent.includes("Import complete"));
  assert.equal(requests[0].length, 1);
  assert.equal(requests[0][0].phone, "919876543210");
  assert.equal(contexts[0].method, "contact_file");
  assert.equal(contexts[0].files[0].name, "contacts.csv");
  assert.equal(contexts[0].device.persistence, "local_storage");
  const firstInstallationId = contexts[0].device.installationId;
  await clickText("Done");
  await page.waitForFunction(() => !document.querySelector("dialog").open);
  assert.equal(historyRequests, 0, "History loads only when expanded");
  await page.click("#root > details > summary");
  await page.waitForFunction(() => document.querySelector("#root > details").textContent.includes("Synthetic uploader"));
  assert.equal(await page.evaluate(() => document.querySelector("#root > details").textContent.includes("203.0.113.7 (unverified header)")), true);
  assert.equal(await page.evaluate(() => document.querySelector("#root > details").textContent.includes("contacts.csv")), true);
  if (process.env.CONTACT_IMPORT_HISTORY_PREVIEW_PATH) await page.screenshot({path: process.env.CONTACT_IMPORT_HISTORY_PREVIEW_PATH});
  await page.click("#reopen");
  await page.waitForSelector("dialog[open]");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog").open);

  // Simulate an available phone picker with the browser's standard contract.
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "contacts", {value: {select: async (fields, options) => {
      if (fields.join() !== "name,tel,email" || Object.keys(options).join() !== "multiple") throw Error("Invalid picker contract");
      return [{name: ["Synthetic phone contact"], tel: ["9876543210"]}];
    }}});
  });
  await page.goto(url);
  await clickText("Choose phone contacts");
  await page.waitForSelector('input[aria-label="Search imported contacts"]');
  assert.equal(await page.evaluate(() => document.body.textContent.includes("Synthetic phone contact")), true);
  await clickText("Choose another");
  requests = [];
  contexts = [];
  failSecond = true;
  await upload("Name,Phone\n" + Array.from({length: 501}, (_, index) => `Contact ${index},+1415555${String(index).padStart(4, "0")}`).join("\n"));
  await clickText("Import 501 numbers");
  await page.waitForSelector('[role="alert"]');
  assert.equal(await page.evaluate(() => document.querySelector('[role="alert"]').textContent.includes("500 of 501")), true);
  await clickText("Retry remaining");
  await page.waitForFunction(() => document.body.textContent.includes("Import complete"));
  assert.deepEqual(requests.map((contacts) => contacts.length), [500, 1, 1]);
  assert.equal(new Set(contexts.map((context) => context.id)).size, 1, "Chunks and retry share a logical import id");
  assert.equal(contexts[0].device.installationId, firstInstallationId, "Browser installation id persists across reloads");
  assert.deepEqual(contexts[0], contexts[2], "Retry preserves the source snapshot");
  assert.equal(await page.evaluate(() => document.body.textContent.includes("501")), true, "Totals retained after retry");
  // A browser that blocks localStorage can still import with an import-only label.
  await page.evaluateOnNewDocument(() => {
    Storage.prototype.getItem = () => {throw new DOMException("Storage blocked", "SecurityError")};
  });
  requests = [];
  contexts = [];
  failSecond = false;
  await page.goto(url);
  await clickText("Choose phone contacts");
  await page.waitForSelector('input[aria-label="Search imported contacts"]');
  await clickText("Import 1 numbers");
  await page.waitForFunction(() => document.body.textContent.includes("Import complete"));
  assert.equal(contexts[0].method, "phone_picker");
  assert.equal(contexts[0].device.persistence, "import_only");
  assert.deepEqual(errors, []);
  console.log("Browser checks passed: 4 viewport widths, fallback, preview before upload, deduplication, selection, close/reopen, Escape, native picker contract, batch retry and totals, source metadata, shared import id, persistent browser id, lazy source-history rendering; no React runtime errors.");
} finally {
  await browser?.close();
  if (server) await new Promise((done) => server.close(done));
  await rm(work, {recursive: true, force: true});
}
