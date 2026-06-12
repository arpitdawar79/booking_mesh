import { prisma } from "@/lib/prisma";
import { generateBookingPdf } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { bookingId, type, customMessage } = body;

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

  try {
    const pdfBuffer = await generateBookingPdf(type, booking, customMessage);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Booking_${booking.bookingId}.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "PDF generation failed", details: message },
      { status: 500 },
    );
  }
}
