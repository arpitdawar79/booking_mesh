import { NextResponse } from "next/server";
import { getConnectionStatus, initWhatsApp } from "@/lib/whatsapp";

export async function GET() {
  const status = getConnectionStatus();

  if (status.status === "close" && !status.qrCode) {
    try {
      await initWhatsApp();
    } catch {
      // ignore init errors
    }
  }

  return NextResponse.json(getConnectionStatus());
}
