import { sendEmail, type EmailType } from "@/lib/email";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
    bookingCreateSchema,
    bookingStatusSchema,
    bookingUpdateSchema,
} from "@/lib/validation";
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
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || "20")),
  );
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || undefined;

  if (id) {
    const bookings = await prisma.booking.findMany({
      where: { id },
      include: {
        emailsSent: { orderBy: { sentAt: "desc" }, take: 20 },
        whatsappMessages: { orderBy: { sentAt: "desc" }, take: 20 },
        payments: { orderBy: { createdAt: "desc" } },
        guest: true,
      },
    });
    return NextResponse.json({ bookings });
  }

  const where: Record<string, unknown> = {};
  if (statusFilter) {
    where.status = statusFilter;
  } else {
    where.status = { not: "archived" };
  }
  if (search.trim()) {
    const q = search.trim();
    where.OR = [
      { guestFullName: { contains: q, mode: "insensitive" } },
      { guestEmail: { contains: q, mode: "insensitive" } },
      { bookingId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { emailsSent: { orderBy: { sentAt: "desc" }, take: 5 } },
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    bookings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = bookingCreateSchema.safeParse(body);
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

  const data = parsed.data;
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  const nightCount = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Duplicate detection: same name + phone + check-in date within 24h
  if (data.guestPhone) {
    const recentDuplicate = await prisma.booking.findFirst({
      where: {
        guestFullName: { equals: data.guestFullName, mode: "insensitive" },
        guestPhone: data.guestPhone,
        checkInDate: checkIn,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        {
          error: "Duplicate booking detected",
          duplicateId: recentDuplicate.id,
        },
        { status: 409 },
      );
    }
  }

  // Overbooking guard
  const config = await prisma.propertyConfig.findUnique({
    where: { roomType: data.roomType },
  });
  if (config) {
    const overlapping = await prisma.booking.aggregate({
      _sum: { roomCount: true },
      where: {
        status: { in: ["confirmed", "completed"] },
        roomType: data.roomType,
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });
    const bookedRooms = Number(overlapping._sum.roomCount || 0);
    if (bookedRooms + data.roomCount > config.totalRooms) {
      return NextResponse.json(
        {
          error:
            "Overbooking guard: not enough rooms available for the selected dates",
        },
        { status: 409 },
      );
    }
  }

  const totalAmount = Number(data.totalAmount || 0);
  const amountPaidOnline = Number(data.amountPaidOnline || 0);
  const balanceAmount = totalAmount - amountPaidOnline;
  const paymentStatus = balanceAmount > 0 ? "partially_paid" : "paid_in_full";

  // GST calculation (default 18% for accommodation)
  const gstRate = data.totalAmount >= 7500 ? 18 : 12;
  const taxableValue = totalAmount / (1 + gstRate / 100);
  const gstAmount = totalAmount - taxableValue;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;

  // Auto-create or link existing guest
  let guestId: string | null = null;
  if (data.guestPhone || data.guestEmail) {
    const existingGuest = await prisma.guest.findFirst({
      where: {
        OR: [
          ...(data.guestPhone ? [{ phone: data.guestPhone }] : []),
          ...(data.guestEmail ? [{ email: data.guestEmail }] : []),
        ],
      },
    });
    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      const newGuest = await prisma.guest.create({
        data: {
          name: data.guestFullName,
          phone: data.guestPhone || null,
          email: data.guestEmail || null,
        },
      });
      guestId = newGuest.id;
    }
  }

  const booking = await prisma.booking.create({
    data: {
      bookingId: generateBookingId(),
      guestFirstName: data.guestFullName.split(" ")[0] || data.guestFullName,
      guestFullName: data.guestFullName,
      guestEmail: data.guestEmail || null,
      guestPhone: data.guestPhone || null,
      adultCount: data.adultCount,
      childCount: data.childCount,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      nightCount,
      roomCount: data.roomCount,
      roomType: data.roomType,
      extraMattressCount: data.extraMattressCount,
      mealPlan: data.mealPlan,
      currency: data.currency,
      totalAmount,
      amountPaidOnline,
      balanceAmount,
      paymentStatus,
      gstRate,
      cgstAmount,
      sgstAmount,
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
      guestId,
    },
  });

  logger.info("booking", `Created booking ${booking.bookingId}`, {
    bookingId: booking.id,
  });

  // Fire-and-forget WhatsApp + email on creation
  if (booking.guestPhone) {
    sendBookingWhatsApp("booking_confirmation", booking, {
      sendPdf: true,
    }).catch((err) => {
      logger.error(
        "whatsapp",
        `Failed to send confirmation for ${booking.bookingId}`,
        { error: String(err) },
      );
    });
  }
  if (booking.guestEmail) {
    const guestEmail = booking.guestEmail;
    sendEmail("booking_confirmation", booking, { to: [guestEmail] })
      .then(async (result) => {
        await prisma.emailSent.create({
          data: {
            bookingId: booking.id,
            type: "booking_confirmation",
            toEmail: guestEmail,
            subject: `Booking confirmed: The Stream by Ekantah #${booking.bookingId}`,
            htmlBody: result.error ? "" : `Email sent to ${guestEmail}`,
            status: result.error ? "failed" : "sent",
          },
        });
      })
      .catch((err) => {
        logger.error(
          "email",
          `Failed to send confirmation for ${booking.bookingId}`,
          { error: String(err) },
        );
      });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));

  // Support both simple status update and full booking update
  if (body.status && !body.guestFullName && !body.checkInDate) {
    const parsed = bookingStatusSchema.safeParse(body);
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

    const { id, status } = parsed.data;
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
      sendBookingWhatsApp(waType, booking, { sendPdf: true }).catch(() => {});
    }
    if (booking.guestEmail && emailType) {
      const guestEmail = booking.guestEmail;
      sendEmail(emailType, booking, { to: [guestEmail] })
        .then(async (result) => {
          await prisma.emailSent.create({
            data: {
              bookingId: booking.id,
              type: emailType as string,
              toEmail: guestEmail,
              subject:
                emailType === "booking_confirmation"
                  ? `Booking confirmed: The Stream by Ekantah #${booking.bookingId}`
                  : `Booking cancelled: The Stream by Ekantah #${booking.bookingId}`,
              htmlBody: result.error ? "" : `Email sent to ${guestEmail}`,
              status: result.error ? "failed" : "sent",
            },
          });
        })
        .catch(() => {});
    }

    return NextResponse.json({ booking });
  }

  const parsed = bookingUpdateSchema.safeParse(body);
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

  const data = parsed.data;
  const existing = await prisma.booking.findUnique({ where: { id: data.id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.guestFullName !== undefined)
    updateData.guestFullName = data.guestFullName;
  if (data.guestEmail !== undefined) updateData.guestEmail = data.guestEmail;
  if (data.guestPhone !== undefined) updateData.guestPhone = data.guestPhone;
  if (data.adultCount !== undefined) updateData.adultCount = data.adultCount;
  if (data.childCount !== undefined) updateData.childCount = data.childCount;
  if (data.checkInDate !== undefined)
    updateData.checkInDate = new Date(data.checkInDate);
  if (data.checkOutDate !== undefined)
    updateData.checkOutDate = new Date(data.checkOutDate);
  if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime;
  if (data.checkOutTime !== undefined)
    updateData.checkOutTime = data.checkOutTime;
  if (data.roomCount !== undefined) updateData.roomCount = data.roomCount;
  if (data.roomType !== undefined) updateData.roomType = data.roomType;
  if (data.extraMattressCount !== undefined)
    updateData.extraMattressCount = data.extraMattressCount;
  if (data.mealPlan !== undefined) updateData.mealPlan = data.mealPlan;
  if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
  if (data.amountPaidOnline !== undefined)
    updateData.amountPaidOnline = data.amountPaidOnline;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.paymentStatus !== undefined)
    updateData.paymentStatus = data.paymentStatus;
  if (data.specialRequests !== undefined)
    updateData.specialRequests = data.specialRequests;

  // Recompute night count if dates changed
  const inDate = (updateData.checkInDate as Date) || existing.checkInDate;
  const outDate = (updateData.checkOutDate as Date) || existing.checkOutDate;
  updateData.nightCount = Math.max(
    1,
    Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Recompute balance if amounts changed
  const total =
    updateData.totalAmount !== undefined
      ? Number(updateData.totalAmount)
      : Number(existing.totalAmount);
  const paidOnline =
    updateData.amountPaidOnline !== undefined
      ? Number(updateData.amountPaidOnline)
      : Number(existing.amountPaidOnline);
  const paymentsAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { bookingId: data.id, isRefund: false },
  });
  const totalPaid = paidOnline + Number(paymentsAgg._sum?.amount || 0);
  const newBalance = total - totalPaid;
  updateData.balanceAmount = newBalance;
  updateData.paymentStatus = newBalance > 0 ? "partially_paid" : "paid_in_full";

  // Recompute GST if total changed
  if (updateData.totalAmount !== undefined) {
    const gstRate = total >= 7500 ? 18 : 12;
    const taxableValue = total / (1 + gstRate / 100);
    const gstAmount = total - taxableValue;
    updateData.gstRate = gstRate;
    updateData.cgstAmount = gstAmount / 2;
    updateData.sgstAmount = gstAmount / 2;
  }

  const booking = await prisma.booking.update({
    where: { id: data.id },
    data: updateData,
  });

  logger.info("booking", `Updated booking ${booking.bookingId}`, {
    bookingId: booking.id,
  });
  return NextResponse.json({ booking });
}
