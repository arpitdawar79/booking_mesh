import { requireGuestStaff } from "@/lib/guests/auth";
import { resolveGuest } from "@/lib/guests/identity";
import { syncGuestBooking } from "@/lib/guests/jobs";
import { parseDateRangeParams } from "@/lib/date-range";
import { sendEmail, type EmailType } from "@/lib/email";
import { HttpError, toErrorResponse } from "@/lib/http-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { findCapacityViolation } from "@/lib/room-allocations";
import {
    bookingAdjustTotalSchema,
    bookingCreateSchema,
    bookingPartialCancelSchema,
    bookingStatusSchema,
    bookingUpdateSchema,
} from "@/lib/validation";
import { sendBookingWhatsApp } from "@/lib/whatsapp";
import { Prisma } from "@prisma/client";
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

// Retries until the random suffix doesn't clash with an existing bookingId,
// so the @unique constraint can't surface as an opaque 500 on a busy day.
async function generateUniqueBookingId(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const id = generateBookingId();
    const clash = await prisma.booking.findUnique({
      where: { bookingId: id },
      select: { id: true },
    });
    if (!clash) return id;
  }
  return `${generateBookingId()}${Date.now().toString().slice(-3)}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function gstBreakdown(total: number) {
  const gstRate = total >= 7500 ? 18 : 12;
  const taxableValue = round2(total / (1 + gstRate / 100));
  const gstAmount = round2(total - taxableValue);
  const cgstAmount = round2(gstAmount / 2);
  return { gstRate, cgstAmount, sgstAmount: round2(gstAmount - cgstAmount) };
}

const UPDATE_FIELD_LABELS: Record<string, string> = {
  guestFullName: "Guest name",
  guestEmail: "Email",
  guestPhone: "Phone",
  adultCount: "Adults",
  childCount: "Children",
  checkInDate: "Check-in",
  checkOutDate: "Check-out",
  checkInTime: "Check-in time",
  checkOutTime: "Check-out time",
  roomCount: "Rooms",
  roomType: "Room type",
  extraMattressCount: "Extra mattresses",
  mealPlan: "Meal plan",
  totalAmount: "Total amount",
  amountPaidOnline: "Paid online",
  status: "Status",
  specialRequests: "Special requests",
};

async function recomputeFromLedger(
  db: Prisma.TransactionClient,
  bookingId: string,
  totalAmount: number,
) {
  const [booking, paymentsAgg, refundsAgg] = await Promise.all([
    db.booking.findUniqueOrThrow({ where: { id: bookingId } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { bookingId, isRefund: false },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { bookingId, isRefund: true },
    }),
  ]);
  const totalPaid =
    Number(booking.amountPaidOnline) + Number(paymentsAgg._sum?.amount || 0);
  const totalRefunded = Number(refundsAgg._sum?.amount || 0);
  const balance = round2(totalAmount - totalPaid + totalRefunded);
  const paymentStatus =
    balance <= 0 ? "paid_in_full" : totalPaid > 0 ? "partially_paid" : "pending";
  return { balanceAmount: balance, paymentStatus } as const;
}

// Serializes concurrent money mutations on the same booking (Postgres row lock).
async function lockBookingRow(db: Prisma.TransactionClient, bookingId: string) {
  await db.$queryRaw`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`;
}

export async function GET(request: Request) {
  try { await requireGuestStaff(); } catch (err) { return toErrorResponse(err); }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || "20")),
  );
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || undefined;
  const range = parseDateRangeParams(searchParams);

  if (id) {
    const bookings = await prisma.booking.findMany({
      where: { id },
      include: {
        emailsSent: { orderBy: { sentAt: "desc" }, take: 20 },
        whatsappMessages: { orderBy: { sentAt: "desc" }, take: 20 },
        payments: { orderBy: { date: "desc" } },
        amendments: { orderBy: { createdAt: "desc" }, take: 50 },
        guest: true,
      },
    });
    return NextResponse.json({ bookings });
  }

  const where: Record<string, unknown> = {};
  if (searchParams.get("source") === "sheet") where.sourceKey = { not: null };
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
  // Stays overlapping the selected date range
  if (range) {
    where.checkInDate = { lt: range.endExclusive };
    where.checkOutDate = { gt: range.start };
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
  try {
    return await handlePost(request);
  } catch (err) {
    return toErrorResponse(err, "POST /api/bookings");
  }
}

async function handlePost(request: Request) {
  await requireGuestStaff();
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

  // Backdated entries: stay already started (or fully over) when recorded
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isBackdated = checkIn < todayStart;
  const stayFullyPast = checkOut < todayStart;
  const status = stayFullyPast ? "completed" : "confirmed";

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

  // Overbooking guard — warn instead of blocking when the stay already happened
  let warning: string | null = null;
  const violation = await findCapacityViolation({
    roomType: data.roomType,
    roomCount: data.roomCount,
    checkIn,
    checkOut,
  });
  if (violation) {
    if (stayFullyPast) {
      warning = `Over capacity: ${violation.booked + violation.requested} ${violation.roomType} rooms recorded against ${violation.total} available for those dates — saved anyway since the stay is in the past.`;
    } else {
      return NextResponse.json(
        {
          error: `Overbooking guard: ${violation.booked + violation.requested} ${violation.roomType} rooms would exceed the ${violation.total} available for those dates`,
        },
        { status: 409 },
      );
    }
  }

  const totalAmount = Number(data.totalAmount || 0);
  const amountPaidOnline = Number(data.amountPaidOnline || 0);
  const paymentsSum = (data.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const balanceAmount = round2(totalAmount - amountPaidOnline - paymentsSum);
  const paymentStatus =
    balanceAmount <= 0
      ? "paid_in_full"
      : amountPaidOnline + paymentsSum > 0
        ? "partially_paid"
        : "pending";

  const gst = gstBreakdown(totalAmount);

  const guestId = await resolveGuest({ name: data.guestFullName, phone: data.guestPhone, email: data.guestEmail });

  const booking = await prisma.booking.create({
    data: {
      bookingId: await generateUniqueBookingId(),
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
      ...gst,
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
      status,
      isBackdated,
      bookingDate: data.bookingDate ? new Date(data.bookingDate) : undefined,
      guestId,
    },
  });

  // Record any payments collected at the time of the stay
  if (data.payments?.length) {
    await prisma.payment.createMany({
      data: data.payments.map((p) => ({
        bookingId: booking.id,
        amount: p.amount,
        method: p.method,
        referenceNumber: p.referenceNumber || null,
        recordedBy: p.recordedBy || null,
      })),
    });
  }

  logger.info("booking", `Created booking ${booking.bookingId}`, {
    bookingId: booking.id,
  });

  // Fire-and-forget WhatsApp + email on creation — never for completed past stays
  if (booking.status === "confirmed" && booking.guestPhone) {
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
  if (booking.status === "confirmed" && booking.guestEmail) {
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

  await syncGuestBooking(booking.id);
  return NextResponse.json({ booking, warning });
}

export async function PATCH(request: Request) {
  try {
    return await handlePatch(request);
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/bookings");
  }
}

async function handlePatch(request: Request) {
  await requireGuestStaff();
  const body = await request.json().catch(() => ({}));
  if (body.totalAmount !== undefined || body.adjustTotal || body.partialCancel) {
    const benefit = typeof body.id === "string" ? await prisma.guestRedemption.findUnique({ where: { bookingId: body.id } }) : null;
    if (benefit && !benefit.reversedAt) throw new HttpError(409, "Reverse the guest benefit from the guest profile before changing the booking price or partially cancelling.");
  }

  // Dedicated mark-fully-paid action
  if (body.markFullyPaid) {
    const { id } = body;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const total = Number(existing.totalAmount);
    const booking = await prisma.$transaction(async (tx) => {
      const before = await recomputeFromLedger(tx, id, total);
      if (before.balanceAmount > 0) {
        await tx.payment.create({
          data: {
            bookingId: id,
            amount: before.balanceAmount,
            method: "cash",
            referenceNumber: "Auto-settled: mark fully paid",
            recordedBy: "System",
          },
        });
      }
      const after = await recomputeFromLedger(tx, id, total);
      return tx.booking.update({
        where: { id },
        data: {
          balanceAmount: after.balanceAmount,
          paymentStatus: after.paymentStatus,
        },
      });
    });

    logger.info("booking", `Marked fully paid ${booking.bookingId}`, {
      bookingId: booking.id,
    });
    await syncGuestBooking(booking.id);
    return NextResponse.json({ booking: await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }) });
  }

  // Partial cancellation: reduce room count and adjust totals
  if (body.partialCancel) {
    const parsed = bookingPartialCancelSchema.safeParse(body);
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
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 409 },
      );
    }
    if (data.roomsToRemove >= existing.roomCount) {
      return NextResponse.json(
        {
          error:
            "Cannot remove all rooms — cancel the whole booking instead (partial cancel must leave at least 1 room)",
        },
        { status: 400 },
      );
    }

    const oldRoomCount = existing.roomCount;
    const oldTotal = Number(existing.totalAmount);
    const newRoomCount = oldRoomCount - data.roomsToRemove;
    const perRoomRate = oldTotal / oldRoomCount;
    const newTotal =
      data.newTotalAmount ?? Math.max(0, Math.round(perRoomRate * newRoomCount));

    if (newTotal > oldTotal) {
      return NextResponse.json(
        {
          error: `New total cannot exceed current total in a partial cancellation (current: ${existing.currency} ${oldTotal.toLocaleString("en-IN")})`,
        },
        { status: 400 },
      );
    }

    const refundAmount = data.refundAmount ?? 0;
    const gst = gstBreakdown(newTotal);

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        await lockBookingRow(tx, existing.id);

        if (refundAmount > 0) {
          const [paidAgg, refundAgg] = await Promise.all([
            tx.payment.aggregate({
              where: { bookingId: existing.id, isRefund: false },
              _sum: { amount: true },
            }),
            tx.payment.aggregate({
              where: { bookingId: existing.id, isRefund: true },
              _sum: { amount: true },
            }),
          ]);
          const collected =
            Number(existing.amountPaidOnline) +
            Number(paidAgg._sum.amount || 0) -
            Number(refundAgg._sum.amount || 0);
          if (refundAmount > collected) {
            throw new HttpError(
              400,
              `Refund exceeds amount collected (${existing.currency} ${collected.toLocaleString("en-IN")})`,
            );
          }
          await tx.payment.create({
            data: {
              bookingId: existing.id,
              amount: refundAmount,
              method: data.refundMethod ?? "cash",
              isRefund: true,
              refundReason:
                data.reason ||
                `Partial cancellation: ${data.roomsToRemove} room(s) released`,
              recordedBy: data.changedBy || null,
            },
          });
        }

        const { balanceAmount, paymentStatus } = await recomputeFromLedger(
          tx,
          existing.id,
          newTotal,
        );

        const updated = await tx.booking.update({
          where: { id: existing.id },
          data: {
            roomCount: newRoomCount,
            totalAmount: newTotal,
            balanceAmount,
            paymentStatus,
            ...gst,
          },
        });

        await tx.bookingAmendment.create({
          data: {
            bookingId: existing.id,
            type: "partial_cancel",
            summary: [
              `Cancelled ${data.roomsToRemove} of ${oldRoomCount} ${existing.roomType} room(s) — now ${newRoomCount} room(s)`,
              `Total ${existing.currency} ${oldTotal.toLocaleString("en-IN")} → ${newTotal.toLocaleString("en-IN")}`,
              refundAmount > 0
                ? `Refund of ${existing.currency} ${refundAmount.toLocaleString("en-IN")} recorded`
                : null,
              data.reason ? `Reason: ${data.reason}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            changedBy: data.changedBy || null,
          },
        });

        return updated;
      });
    } catch (err) {
      return toErrorResponse(err, "partial cancel");
    }

    logger.info(
      "booking",
      `Partial cancel on ${booking.bookingId}: -${data.roomsToRemove} room(s)`,
      { bookingId: booking.id },
    );
    await syncGuestBooking(booking.id);
    return NextResponse.json({ booking: await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }) });
  }

  // Price renegotiation: adjust total amount and recompute balance/GST
  if (body.adjustTotal) {
    const parsed = bookingAdjustTotalSchema.safeParse(body);
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

    const oldTotal = Number(existing.totalAmount);
    const newTotal = data.newTotalAmount;
    const gst = gstBreakdown(newTotal);

    const booking = await prisma.$transaction(async (tx) => {
      await lockBookingRow(tx, existing.id);
      const { balanceAmount, paymentStatus } = await recomputeFromLedger(
        tx,
        existing.id,
        newTotal,
      );

      const updated = await tx.booking.update({
        where: { id: existing.id },
        data: {
          totalAmount: newTotal,
          balanceAmount,
          paymentStatus,
          ...gst,
        },
      });

      await tx.bookingAmendment.create({
        data: {
          bookingId: existing.id,
          type: "price_adjustment",
          summary: [
            `Total renegotiated ${existing.currency} ${oldTotal.toLocaleString("en-IN")} → ${newTotal.toLocaleString("en-IN")}`,
            data.reason ? `Reason: ${data.reason}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          changedBy: data.changedBy || null,
        },
      });

      return updated;
    });

    logger.info("booking", `Adjusted total on ${booking.bookingId}`, {
      bookingId: booking.id,
    });
    await syncGuestBooking(booking.id);
    return NextResponse.json({ booking: await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }) });
  }

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
    const previous = await prisma.booking.findUnique({
      where: { id },
      select: { status: true },
    });
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    if (previous && previous.status !== status) {
      await prisma.bookingAmendment.create({
        data: {
          bookingId: id,
          type: "status_change",
          summary: `Status changed from ${previous.status} to ${status}`,
        },
      });
    }

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
      sendBookingWhatsApp(waType, booking, { sendPdf: true }).catch((err) =>
        logger.error(
          "whatsapp",
          `Failed to send ${waType} for ${booking.bookingId}`,
          { error: String(err) },
        ),
      );
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
        .catch((err) =>
          logger.error(
            "email",
            `Failed to send ${emailType} for ${booking.bookingId}`,
            { error: String(err) },
          ),
        );
    }

    await syncGuestBooking(booking.id);
    return NextResponse.json({ booking: await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }) });
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

  // Optimistic locking: reject writes based on a stale client snapshot
  if (
    data.expectedUpdatedAt &&
    data.expectedUpdatedAt !== existing.updatedAt.toISOString()
  ) {
    return NextResponse.json(
      {
        error:
          "This booking was modified elsewhere — reload the page and try again",
        stale: true,
        updatedAt: existing.updatedAt.toISOString(),
      },
      { status: 409 },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (data.guestPhone !== undefined || data.guestEmail !== undefined) {
    const linkedGuestId = await resolveGuest({ name: data.guestFullName || existing.guestFullName,
      phone: data.guestPhone === undefined ? existing.guestPhone : data.guestPhone,
      email: data.guestEmail === undefined ? existing.guestEmail : data.guestEmail });
    if (linkedGuestId !== existing.guestId && (await prisma.guestReward.count({ where: { bookingId: existing.id } }) || await prisma.guestRedemption.count({ where: { bookingId: existing.id } }))) {
      throw new HttpError(409, "This booking has guest rewards. Resolve or merge the guest profiles before changing its identity.");
    }
    updateData.guestId = linkedGuestId;
  }
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
  if (outDate <= inDate) {
    return NextResponse.json(
      { error: "Check-out date must be after check-in date" },
      { status: 400 },
    );
  }
  updateData.nightCount = Math.ceil(
    (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Overbooking guard: recheck capacity when the stay shape changes
  const stayFieldsChanged = [
    "roomCount",
    "roomType",
    "checkInDate",
    "checkOutDate",
  ].some((k) => updateData[k] !== undefined);
  if (stayFieldsChanged) {
    const newStatus =
      (updateData.status as string | undefined) ?? existing.status;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (
      (newStatus === "confirmed" || newStatus === "completed") &&
      outDate >= todayStart
    ) {
      const roomType =
        (updateData.roomType as string | undefined) ?? existing.roomType;
      const roomCount =
        (updateData.roomCount as number | undefined) ?? existing.roomCount;
      const violation = await findCapacityViolation({
        roomType,
        roomCount,
        checkIn: inDate,
        checkOut: outDate,
        excludeBookingId: data.id,
      });
      if (violation) {
        return NextResponse.json(
          {
            error: `Overbooking guard: ${violation.booked + violation.requested} ${violation.roomType} rooms would exceed the ${violation.total} available for those dates`,
          },
          { status: 409 },
        );
      }
    }
  }

  // Recompute balance from the full ledger (payments + refunds)
  const total =
    updateData.totalAmount !== undefined
      ? Number(updateData.totalAmount)
      : Number(existing.totalAmount);
  const paidOnline =
    updateData.amountPaidOnline !== undefined
      ? Number(updateData.amountPaidOnline)
      : Number(existing.amountPaidOnline);
  const [paymentsAgg, refundsAgg] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { bookingId: data.id, isRefund: false },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { bookingId: data.id, isRefund: true },
    }),
  ]);
  const totalPaid = paidOnline + Number(paymentsAgg._sum?.amount || 0);
  const totalRefunded = Number(refundsAgg._sum?.amount || 0);
  const newBalance = round2(total - totalPaid + totalRefunded);
  updateData.balanceAmount = newBalance;
  updateData.paymentStatus =
    newBalance <= 0
      ? "paid_in_full"
      : totalPaid > 0
        ? "partially_paid"
        : "pending";

  // Recompute GST if total changed
  if (updateData.totalAmount !== undefined) {
    Object.assign(updateData, gstBreakdown(total));
  }

  const booking = await prisma.booking.update({
    where: { id: data.id },
    data: updateData,
  });

  const changes: string[] = [];
  for (const [key, value] of Object.entries(updateData)) {
    if (
      [
        "nightCount",
        "balanceAmount",
        "paymentStatus",
        "gstRate",
        "cgstAmount",
        "sgstAmount",
      ].includes(key)
    )
      continue;
    const prev = (existing as unknown as Record<string, unknown>)[key];
    const prevStr =
      prev instanceof Date ? prev.toISOString().slice(0, 10) : String(prev ?? "");
    const nextStr =
      value instanceof Date
        ? value.toISOString().slice(0, 10)
        : String(value ?? "");
    if (prevStr !== nextStr) {
      changes.push(
        `${UPDATE_FIELD_LABELS[key] || key}: ${prevStr || "—"} → ${nextStr || "—"}`,
      );
    }
  }
  if (changes.length) {
    await prisma.bookingAmendment.create({
      data: {
        bookingId: data.id,
        type: "field_update",
        summary: changes.join(", "),
      },
    });
  }

  logger.info("booking", `Updated booking ${booking.bookingId}`, {
    bookingId: booking.id,
  });
  await syncGuestBooking(booking.id);
    return NextResponse.json({ booking: await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } }) });
}
