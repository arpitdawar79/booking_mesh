import { prisma } from "@/lib/prisma";
import { sendWhatsAppSchema } from "@/lib/validation";
import { sendBookingWhatsApp } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = sendWhatsAppSchema.safeParse(body);
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

  const { bookingId, type, sendPdf, customMessage } = parsed.data;

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
    customMessage,
    sendPdf: sendPdf ?? true,
  });

  if (result.success) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: result.error }, { status: 500 });
}
