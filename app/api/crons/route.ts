import {
    runAdminDigestJob,
    runCheckoutReminderJob,
    runJob,
    runPreArrivalReminderJob,
} from "@/lib/cron-jobs";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const CRON_JOBS = [
  {
    name: "admin-digest",
    schedule: "0 7 * * *",
    timezone: "Asia/Kolkata",
    description: "Daily admin digest with check-ins and check-outs",
    label: "Admin Daily Digest",
  },
  {
    name: "checkout-reminder",
    schedule: "0 9 * * *",
    timezone: "Asia/Kolkata",
    description: "Send checkout reminders to guests checking out today",
    label: "Checkout Reminder",
  },
  {
    name: "pre-arrival",
    schedule: "0 10 * * *",
    timezone: "Asia/Kolkata",
    description: "Send pre-arrival reminders to guests checking in tomorrow",
    label: "Pre-arrival Reminder",
  },
];

function getJobFn(name: string) {
  switch (name) {
    case "admin-digest":
      return runAdminDigestJob;
    case "checkout-reminder":
      return runCheckoutReminderJob;
    case "pre-arrival":
      return runPreArrivalReminderJob;
    default:
      return null;
  }
}

export async function GET() {
  const latestRuns = await prisma.cronRun.groupBy({
    by: ["jobName"],
    _max: { startedAt: true },
  });

  const validRuns = latestRuns.filter(
    (r): r is typeof r & { _max: { startedAt: Date } } =>
      r._max.startedAt !== null,
  );

  const latestRunIds = await prisma.cronRun.findMany({
    where: {
      OR: validRuns.map((r) => ({
        jobName: r.jobName,
        startedAt: r._max.startedAt,
      })),
    },
    orderBy: { startedAt: "desc" },
  });

  const latestByName = new Map(latestRunIds.map((r) => [r.jobName, r]));

  const counts = await prisma.cronRun.groupBy({
    by: ["jobName", "status"],
    _count: { id: true },
  });

  const statsByName = new Map<
    string,
    { success: number; failed: number; total: number }
  >();
  for (const c of counts) {
    const existing = statsByName.get(c.jobName) || {
      success: 0,
      failed: 0,
      total: 0,
    };
    existing.total += c._count.id;
    if (c.status === "success") existing.success += c._count.id;
    if (c.status === "failed") existing.failed += c._count.id;
    statsByName.set(c.jobName, existing);
  }

  const jobs = CRON_JOBS.map((job) => {
    const latest = latestByName.get(job.name);
    const stats = statsByName.get(job.name) || {
      success: 0,
      failed: 0,
      total: 0,
    };
    return {
      ...job,
      latestRun: latest
        ? {
            id: latest.id,
            status: latest.status,
            startedAt: latest.startedAt.toISOString(),
            completedAt: latest.completedAt?.toISOString() || null,
            durationMs: latest.durationMs,
            triggeredBy: latest.triggeredBy,
          }
        : null,
      stats,
    };
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing job name" }, { status: 400 });
  }

  const jobDef = CRON_JOBS.find((j) => j.name === name);
  if (!jobDef) {
    return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  }

  const jobFn = getJobFn(name);
  if (!jobFn) {
    return NextResponse.json({ error: "Job not found" }, { status: 400 });
  }

  // Run without awaiting so the HTTP request returns immediately
  runJob(name, jobFn, "manual").catch(() => {});

  return NextResponse.json({ ok: true, message: `Triggered ${name}` });
}
