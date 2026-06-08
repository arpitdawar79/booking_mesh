import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobName = searchParams.get("jobName");
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));

  const where: any = {};
  if (jobName) where.jobName = jobName;
  if (status) where.status = status;

  const [runs, total] = await Promise.all([
    prisma.cronRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cronRun.count({ where }),
  ]);

  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      jobName: r.jobName,
      status: r.status,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() || null,
      durationMs: r.durationMs,
      logs: r.logs,
      error: r.error,
      triggeredBy: r.triggeredBy,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
