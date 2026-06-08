import { prisma } from "@/lib/prisma";
import { getWhatsAppGroups } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      const liveGroups = await getWhatsAppGroups();
      if (liveGroups === null) {
        return NextResponse.json(
          { error: "WhatsApp not connected" },
          { status: 503 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.whatsAppGroupCache.deleteMany({});
        for (const g of liveGroups) {
          await tx.whatsAppGroupCache.upsert({
            where: { groupId: g.id },
            update: { name: g.name },
            create: { groupId: g.id, name: g.name },
          });
        }
      });

      return NextResponse.json({ groups: liveGroups, refreshed: true });
    }

    const cached = await prisma.whatsAppGroupCache.findMany({
      orderBy: { name: "asc" },
    });
    const groups = cached.map((g) => ({ id: g.groupId, name: g.name }));
    return NextResponse.json({ groups, cached: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
