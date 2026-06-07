import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingWhatsApp } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const body = await request.json();
  const { bookingId, type, sendPdf } = body;

  if (!bookingId || !type) {
    return NextResponse.json(
      { error: "Missing bookingId or type" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.guestPhone) {
    return NextResponse.json(
      { error: "Guest phone number not available" },
      { status: 400 },
    );
  }

  const result = await sendBookingWhatsApp(type, booking, {
    customMessage: body.customMessage,
    sendPdf: sendPdf ?? true,
  });

  if (result.success) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: result.error }, { status: 500 });
}
