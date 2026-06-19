import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [
    total,
    active,
    optedOut,
    bySource,
    topGroups,
    topTags,
  ] = await Promise.all([
    prisma.userLead.count(),
    prisma.userLead.count({ where: { status: "active" } }),
    prisma.userLead.count({ where: { status: "opted_out" } }),
    prisma.userLead.groupBy({
      by: ["source"],
      _count: true,
    }),
    prisma.userLead.groupBy({
      by: ["sourceGroupName"],
      _count: true,
      orderBy: { _count: { sourceGroupName: "desc" } },
      take: 10,
    }),
    prisma.userLead.findMany({
      select: { tags: true },
      distinct: undefined,
    }),
  ]);

  const tagCounts: Record<string, number> = {};
  for (const lead of topTags) {
    for (const tag of lead.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({
    total,
    active,
    optedOut,
    bySource: bySource.map((s) => ({ source: s.source, count: s._count })),
    topGroups: topGroups
      .filter((g) => g.sourceGroupName !== null)
      .map((g) => ({ name: g.sourceGroupName, count: g._count })),
    topTags: sortedTags,
  });
}
