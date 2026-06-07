import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();
  let dbHealthy = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  const uptime = process.uptime();
  const memory = process.memoryUsage();

  const status = dbHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptime),
      db: dbHealthy ? "connected" : "disconnected",
      responseTimeMs: Date.now() - startedAt,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
      },
    },
    { status },
  );
}
