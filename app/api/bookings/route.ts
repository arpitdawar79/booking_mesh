import { sendEmail, type EmailType } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendBookingWhatsApp } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

function generateBookingId(): string {
  const date = new Date();
  const prefix =
    date.getFullYear().toString().slice(2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${rand}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const bookings = await prisma.booking.findMany({
      where: { id },
      include: {
        emailsSent: { orderBy: { sentAt: "desc" }, take: 20 },
        whatsappMessages: { orderBy: { sentAt: "desc" }, take: 20 },
      },
    });
    return NextResponse.json({ bookings });
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { emailsSent: { orderBy: { sentAt: "desc" }, take: 5 } },
  });
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const data = await request.json();

  const bookingId = generateBookingId();
  const totalAmount = Number(data.totalAmount || 0);
  const amountPaidOnline = Number(data.amountPaidOnline || 0);
  const balanceAmount = totalAmount - amountPaidOnline;
  const paymentStatus = balanceAmount > 0 ? "Partially paid" : "Paid in full";

  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  const nightCount = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const booking = await prisma.booking.create({
    data: {
      bookingId,
      guestFirstName: data.guestFullName?.split(" ")[0] || data.guestFullName,
      guestFullName: data.guestFullName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone || null,
      adultCount: Number(data.adultCount || 1),
      childCount: Number(data.childCount || 0),
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      checkInTime: data.checkInTime || "1:00 PM",
      checkOutTime: data.checkOutTime || "10:00 AM",
      nightCount,
      roomCount: Number(data.roomCount || 1),
      roomType: data.roomType || "Boutique Room",
      mealPlan: data.mealPlan || "As per booking",
      currency: data.currency || "INR",
      totalAmount,
      amountPaidOnline,
      balanceAmount,
      paymentStatus,
      propertyAddress: data.propertyAddress || "The Stream by Ekantah",
      propertyPhone: data.propertyPhone || "+91 93193 47443, +91 99100 06437",
      propertyEmail: data.propertyEmail || "digital@ekantah.com",
      caretakerNumber: data.caretakerNumber || "+91 94599 89576",
      parkingDetails:
        data.parkingDetails ||
        "Available near the property. Please contact us before arrival for exact guidance.",
      mapLink:
        data.mapLink ||
        "https://maps.google.com/?q=The%20Stream%20by%20Ekantah%20Tirthan%20Valley",
      cancellationPolicy:
        data.cancellationPolicy ||
        "As per the booking terms shared at the time of reservation.",
      specialRequests: data.specialRequests || "None shared.",
      status: "confirmed",
    },
  });

  // Fire-and-forget WhatsApp + email on creation
  if (booking.guestPhone) {
    sendBookingWhatsApp("booking_confirmation", booking, {
      sendPdf: true,
    }).catch(() => {});
  }
  if (booking.guestEmail) {
    sendEmail("booking_confirmation", booking, { to: [booking.guestEmail] })
      .then(async (result) => {
        await prisma.emailSent.create({
          data: {
            bookingId: booking.id,
            type: "booking_confirmation",
            toEmail: booking.guestEmail,
            subject: `Booking confirmed: The Stream by Ekantah #${booking.bookingId}`,
            htmlBody: result.error ? "" : `Email sent to ${booking.guestEmail}`,
            status: result.error ? "failed" : "sent",
          },
        });
      })
      .catch(() => {});
  }

  return NextResponse.json({ booking });
}

export async function PATCH(request: Request) {
  const data = await request.json();
  const { id, status } = data;

  if (!id || !status) {
    return NextResponse.json(
      { error: "Missing id or status" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  let waType: string | null = null;
  let emailType: EmailType | null = null;
  if (status === "confirmed") {
    waType = "booking_confirmation";
    emailType = "booking_confirmation";
  }
  if (status === "cancelled") {
    waType = "cancellation";
    emailType = "cancellation";
  }

  if (booking.guestPhone && waType) {
    sendBookingWhatsApp(waType, booking, {
      sendPdf: waType === "booking_confirmation",
    }).catch(() => {});
  }

  if (booking.guestEmail && emailType) {
    const subjectMap: Record<string, string> = {
      booking_confirmation: `Booking confirmed: The Stream by Ekantah #${booking.bookingId}`,
      cancellation: `Booking cancelled: The Stream by Ekantah #${booking.bookingId}`,
    };
    sendEmail(emailType, booking, { to: [booking.guestEmail] })
      .then(async (result) => {
        await prisma.emailSent.create({
          data: {
            bookingId: booking.id,
            type: emailType as string,
            toEmail: booking.guestEmail,
            subject: subjectMap[emailType] || `${emailType} email`,
            htmlBody: result.error ? "" : `Email sent to ${booking.guestEmail}`,
            status: result.error ? "failed" : "sent",
          },
        });
      })
      .catch(() => {});
  }

  return NextResponse.json({ booking });
}
