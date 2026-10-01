import {
    runAdminDigestJob,
    runCheckoutReminderJob,
    runContactEnrichmentJob,
    runJob,
    runPreArrivalReminderJob,
} from "@/lib/cron-jobs";
import { runSheetDigestJob } from "@/lib/sheet-sync/digest";
import { runSheetSyncJob } from "@/lib/sheet-sync/job";
import { runWatchRenewalJob } from "@/lib/sheet-sync/watch";
import { prisma } from "@/lib/prisma";
import cron from "node-cron";

function log(label: string, message: string) {
  console.log(`[${new Date().toISOString()}] [${label}] ${message}`);
}

const adminDigestJob = cron.schedule(
  "0 7 * * *",
  async () => {
    await runJob("admin-digest", runAdminDigestJob);
  },
  { timezone: "Asia/Kolkata" },
);

const checkoutReminderJob = cron.schedule(
  "0 9 * * *",
  async () => {
    await runJob("checkout-reminder", runCheckoutReminderJob);
  },
  { timezone: "Asia/Kolkata" },
);

const preArrivalReminderJob = cron.schedule(
  "0 10 * * *",
  async () => {
    await runJob("pre-arrival", runPreArrivalReminderJob);
  },
  { timezone: "Asia/Kolkata" },
);

const contactEnrichmentJob = cron.schedule(
  "*/30 * * * *",
  async () => {
    await runJob("contact-enrichment", runContactEnrichmentJob);
  },
  { timezone: "Asia/Kolkata" },
);

const sheetSyncPollJob = cron.schedule(
  "7 * * * *",
  async () => {
    await runJob("sheet-sync-poll", async (log) => {
      await runSheetSyncJob(log);
    });
  },
  { timezone: "Asia/Kolkata" },
);

const sheetDigestJob = cron.schedule(
  "0 9,20 * * *",
  async () => {
    await runJob("sheet-digest", runSheetDigestJob);
  },
  { timezone: "Asia/Kolkata" },
);

const sheetWatchRenewJob = cron.schedule(
  "30 5 * * *",
  async () => {
    await runJob("sheet-watch-renew", runWatchRenewalJob);
  },
  { timezone: "Asia/Kolkata" },
);

log("runner", "Cron runner started. Registered jobs:");
log("runner", `- admin-digest: ${adminDigestJob.getStatus()} (7:00 AM)`);
log(
  "runner",
  `- checkout-reminder: ${checkoutReminderJob.getStatus()} (9:00 AM)`,
);
log(
  "runner",
  `- pre-arrival-reminder: ${preArrivalReminderJob.getStatus()} (10:00 AM)`,
);
log(
  "runner",
  `- contact-enrichment: ${contactEnrichmentJob.getStatus()} (every 30 min)`,
);
log(
  "runner",
  `- sheet-sync-poll: ${sheetSyncPollJob.getStatus()} (hourly, fallback to webhook)`,
);
log(
  "runner",
  `- sheet-digest: ${sheetDigestJob.getStatus()} (9:00 AM & 8:00 PM)`,
);
log(
  "runner",
  `- sheet-watch-renew: ${sheetWatchRenewJob.getStatus()} (5:30 AM daily)`,
);

process.on("SIGINT", async () => {
  log("runner", "Received SIGINT, stopping cron jobs...");
  adminDigestJob.stop();
  checkoutReminderJob.stop();
  preArrivalReminderJob.stop();
  contactEnrichmentJob.stop();
  sheetSyncPollJob.stop();
  sheetDigestJob.stop();
  sheetWatchRenewJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  log("runner", "Received SIGTERM, stopping cron jobs...");
  adminDigestJob.stop();
  checkoutReminderJob.stop();
  preArrivalReminderJob.stop();
  contactEnrichmentJob.stop();
  sheetSyncPollJob.stop();
  sheetDigestJob.stop();
  sheetWatchRenewJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});
