import { prisma } from "@/lib/prisma";
import { whatsAppConfigSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

const ADMIN_KEY = "adminWhatsAppGroupId";
const OPS_KEY = "opsWhatsAppGroupId";

export async function GET() {
  try {
    const cfgs = await prisma.appConfig.findMany({
      where: { key: { in: [ADMIN_KEY, OPS_KEY] } },
    });
    const map = Object.fromEntries(cfgs.map((c) => [c.key, c.value]));
    return NextResponse.json({
      adminGroupId: map[ADMIN_KEY] ?? null,
      opsGroupId: map[OPS_KEY] ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = whatsAppConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.issues.map(
            (i) => `${String(i.path)}: ${i.message}`,
          ),
        },
        { status: 400 },
      );
    }

    const writes: Promise<unknown>[] = [];
    if (parsed.data.adminGroupId !== undefined) {
      writes.push(
        prisma.appConfig.upsert({
          where: { key: ADMIN_KEY },
          update: { value: parsed.data.adminGroupId },
          create: { key: ADMIN_KEY, value: parsed.data.adminGroupId },
        }),
      );
    }
    if (parsed.data.opsGroupId !== undefined) {
      writes.push(
        prisma.appConfig.upsert({
          where: { key: OPS_KEY },
          update: { value: parsed.data.opsGroupId },
          create: { key: OPS_KEY, value: parsed.data.opsGroupId },
        }),
      );
    }
    await Promise.all(writes);
    // Sheet-sync resolves the ops key — bust its cache so changes are live.
    const { bustOpsGroupJidCache } = await import(
      "@/lib/sheet-sync/admin-jid"
    );
    bustOpsGroupJidCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
