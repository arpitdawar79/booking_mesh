import { EmailType, renderEmailHtml } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import type { Booking } from "@prisma/client";
import { NextResponse } from "next/server";

const DEMO_BOOKING: Booking = {
  id: "preview",
  bookingId: "2606151234",
  bookingDate: new Date(),
  guestFirstName: "Aarav",
  guestFullName: "Aarav Sharma",
  guestEmail: "aarav@example.com",
  guestPhone: null,
  adultCount: 2,
  childCount: 1,
  checkInDate: "2026-06-15",
  checkOutDate: "2026-06-18",
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",
  nightCount: 3,
  roomCount: 1,
  roomType: "Boutique Room",
  mealPlan: "Breakfast included",
  currency: "INR",
  totalAmount: 15000 as any,
  amountPaidOnline: 5000 as any,
  balanceAmount: 10000 as any,
  paymentStatus: "Partially paid",
  propertyAddress: "The Stream by Ekantah, Tirthan Valley, Himachal Pradesh",
  propertyPhone: "+91 98765 43210",
  propertyEmail: "digital@ekantah.com",
  caretakerNumber: "+91 94599 89576",
  parkingDetails:
    "Available near the property. Please contact us before arrival for exact guidance.",
  mapLink:
    "https://maps.google.com/?q=The%20Stream%20by%20Ekantah%20Tirthan%20Valley",
  cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
  specialRequests: "Early check-in preferred.",
  status: "confirmed",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function POST(request: Request) {
  const body = await request.json();
  const { bookingId, type, customMessage } = body;

  if (!type) {
    return NextResponse.json({ error: "Missing type" }, { status: 400 });
  }

  let booking: Booking | null = null;
  if (bookingId && bookingId !== "preview") {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
  }

  const html = await renderEmailHtml(
    type as EmailType,
    booking || DEMO_BOOKING,
    customMessage,
  );
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
