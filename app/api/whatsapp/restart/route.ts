import { NextResponse } from "next/server";
import { disconnectWhatsApp, initWhatsApp } from "@/lib/whatsapp";

export async function POST() {
  try {
    await disconnectWhatsApp();
    await initWhatsApp();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
