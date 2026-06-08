import {
    runAdminDigestJob,
    runCheckoutReminderJob,
    runJob,
    runPreArrivalReminderJob,
} from "@/lib/cron-jobs";
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

process.on("SIGINT", async () => {
  log("runner", "Received SIGINT, stopping cron jobs...");
  adminDigestJob.stop();
  checkoutReminderJob.stop();
  preArrivalReminderJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  log("runner", "Received SIGTERM, stopping cron jobs...");
  adminDigestJob.stop();
  checkoutReminderJob.stop();
  preArrivalReminderJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});
