import { prisma } from "@/lib/prisma";
import { whatsAppConfigSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

const CONFIG_KEY = "adminWhatsAppGroupId";

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    return NextResponse.json({ adminGroupId: config?.value ?? null });
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

    const { adminGroupId } = parsed.data;

    await prisma.appConfig.upsert({
      where: { key: CONFIG_KEY },
      update: { value: adminGroupId },
      create: { key: CONFIG_KEY, value: adminGroupId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
