import { NextResponse } from "next/server";
import { logoutWhatsApp } from "@/lib/whatsapp";

export async function POST() {
  try {
    await logoutWhatsApp();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
