import { prisma } from "@/lib/prisma";
import {
  runAdminDigestJob,
  runCheckoutReminderJob,
  runContactEnrichmentJob,
  runJob,
  runPreArrivalReminderJob,
} from "@/lib/cron-jobs";
import type { LogFn } from "@/lib/cron-jobs";
import { runSheetDigestJob } from "@/lib/sheet-sync/digest";
import { runSheetSyncJob } from "@/lib/sheet-sync/job";
import { runWatchRenewalJob } from "@/lib/sheet-sync/watch";
import { runGuestProgramJob } from "@/lib/guests/jobs";

type JobFn = (log: LogFn, opts?: Record<string, unknown>) => Promise<unknown>;

const jobs: Record<string, JobFn> = {
  "admin-digest": runAdminDigestJob,
  "checkout-reminder": runCheckoutReminderJob,
  "pre-arrival": runPreArrivalReminderJob,
  "contact-enrichment": runContactEnrichmentJob,
  "sheet-sync-poll": (log) => runSheetSyncJob(log),
  "sheet-digest": runSheetDigestJob,
  "sheet-watch-renew": runWatchRenewalJob,
  "guest-program": runGuestProgramJob,
};

async function main() {
  const [name, ...flags] = process.argv.slice(2);
  const usage = `Usage: pnpm cron:job <job> [--dry-run]\nJobs: ${Object.keys(jobs).join(", ")}`;

  if (!name || !jobs[name]) {
    console.error(name ? `Unknown job "${name}".\n${usage}` : usage);
    process.exit(1);
  }

  const opts = flags.includes("--dry-run") ? { dryRun: true } : {};

  // runJob writes the CronRun row and swallows job errors, so read the outcome back.
  await runJob(name, (log) => jobs[name](log, opts) as Promise<void>, "manual");

  const run = await prisma.cronRun.findFirst({
    where: { jobName: name },
    orderBy: { startedAt: "desc" },
  });
  await prisma.$disconnect();

  if (run?.status === "failed") {
    console.error(`\nJob "${name}" failed: ${run.error}`);
    process.exit(1);
  }
  console.log(`\nJob "${name}" finished (${run?.status ?? "unknown"}).`);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
