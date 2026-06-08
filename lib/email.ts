import nodemailer from "nodemailer";
import React from "react";

import { AdminDailyDigestEmail } from "@/emails/admin-daily-digest-email";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation-email";
import { CancellationEmail } from "@/emails/cancellation-email";
import { CheckoutEmail } from "@/emails/checkout-email";
import { NotificationEmail } from "@/emails/notification-email";
import { PreArrivalEmail } from "@/emails/pre-arrival-email";
import { RefundCreditedEmail } from "@/emails/refund-credited-email";
import { ThankYouEmail } from "@/emails/thank-you-email";
import type { Booking } from "@prisma/client";

export type EmailType =
  | "booking_confirmation"
  | "cancellation"
  | "notification"
  | "thank_you"
  | "refund_credited"
  | "checkout_reminder"
  | "pre_arrival_reminder";

export interface EmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  customMessage?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USERNAME || "digital@ekantah.com";
  const pass = process.env.SMTP_PASSWORD || "";
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function formatAmount(
  amount: number | string | { toString(): string },
): string {
  const raw = typeof amount === "object" ? amount.toString() : String(amount);
  const num = parseFloat(raw);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return formatted;
}

function generateUpiQrUrl(booking: Booking): string | undefined {
  const balance = Number(booking.balanceAmount);
  if (balance <= 0) return undefined;

  const upiId = "mab.037215011470041@axisbank";
  const merchantName = "The Stream by Ekantah";
  const note = `Booking payment for ${booking.bookingId}`;

  let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&tn=${encodeURIComponent(note)}`;
  upiString += `&am=${encodeURIComponent(String(balance))}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;
}

function formatDate(date: Date | string): string {
  if (date instanceof Date) return date.toISOString().split("T")[0];
  return String(date);
}

function bookingToProps(booking: Booking) {
  return {
    bookingId: booking.bookingId,
    bookingDate: booking.bookingDate.toISOString().split("T")[0],
    guestFirstName: booking.guestFirstName,
    guestFullName: booking.guestFullName,
    guestEmail: booking.guestEmail,
    adultCount: String(booking.adultCount),
    childCount: String(booking.childCount),
    checkInDate: formatDate(booking.checkInDate),
    checkOutDate: formatDate(booking.checkOutDate),
    checkInTime: booking.checkInTime,
    checkOutTime: booking.checkOutTime,
    nightCount: String(booking.nightCount),
    roomCount: String(booking.roomCount),
    roomType: booking.roomType,
    mealPlan: booking.mealPlan,
    currency: booking.currency,
    totalBookingAmount: formatAmount(booking.totalAmount),
    amountPaidOnline: formatAmount(booking.amountPaidOnline),
    balanceAmount: formatAmount(booking.balanceAmount),
    paymentStatus: booking.paymentStatus,
    propertyAddress: booking.propertyAddress,
    propertyPhone: booking.propertyPhone,
    propertyEmail: booking.propertyEmail,
    caretakerNumber: booking.caretakerNumber,
    parkingDetails: booking.parkingDetails,
    mapLink: booking.mapLink,
    cancellationPolicy: booking.cancellationPolicy,
    specialRequests: booking.specialRequests,
    upiQrCodeUrl: generateUpiQrUrl(booking),
  };
}

export async function renderEmailHtml(
  type: EmailType,
  booking: Booking,
  customMessage?: string,
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const props = bookingToProps(booking);

  let element: React.ReactElement;
  switch (type) {
    case "booking_confirmation":
      element = React.createElement(BookingConfirmationEmail, props);
      break;
    case "cancellation":
      element = React.createElement(CancellationEmail, {
        ...props,
        customMessage,
      });
      break;
    case "notification":
      element = React.createElement(NotificationEmail, {
        ...props,
        customMessage,
      });
      break;
    case "thank_you":
      element = React.createElement(ThankYouEmail, props);
      break;
    case "refund_credited":
      element = React.createElement(RefundCreditedEmail, {
        ...props,
        customMessage,
      });
      break;
    case "checkout_reminder":
      element = React.createElement(CheckoutEmail, {
        ...props,
        googleReviewUrl: process.env.GOOGLE_REVIEW_URL,
        instagramUrl: process.env.INSTAGRAM_URL,
      });
      break;
    case "pre_arrival_reminder":
      element = React.createElement(PreArrivalEmail, {
        ...props,
        caretakerNumber: booking.caretakerNumber,
        parkingDetails: booking.parkingDetails,
        mapLink: booking.mapLink,
      });
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  return renderToStaticMarkup(element);
}

export async function sendEmail(
  type: EmailType,
  booking: Booking,
  payload: EmailPayload,
): Promise<{ messageId?: string; error?: string }> {
  const html = await renderEmailHtml(type, booking, payload.customMessage);
  const transporter = getTransporter();

  const subject =
    payload.subject ||
    (() => {
      switch (type) {
        case "booking_confirmation":
          return `Booking confirmed: The Stream by Ekantah #${booking.bookingId}`;
        case "cancellation":
          return `Booking cancelled: The Stream by Ekantah #${booking.bookingId}`;
        case "notification":
          return `Update regarding your stay at The Stream by Ekantah #${booking.bookingId}`;
        case "thank_you":
          return `Thank you for staying at The Stream by Ekantah #${booking.bookingId}`;
        case "refund_credited":
          return `Refund credited: The Stream by Ekantah #${booking.bookingId}`;
        case "checkout_reminder":
          return `It's time to checkout — The Stream by Ekantah #${booking.bookingId}`;
        case "pre_arrival_reminder":
          return `Your stay is tomorrow — The Stream by Ekantah #${booking.bookingId}`;
      }
    })();

  const textBody = `Dear ${booking.guestFirstName},\n\nPlease view the HTML version of this email for full details.\n\nBooking ID: ${booking.bookingId}`;

  try {
    const info = await transporter.sendMail({
      from: `"The Stream by Ekantah" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME || "digital@ekantah.com"}>`,
      to: payload.to.join(", "),
      cc: payload.cc?.join(", "),
      bcc: payload.bcc?.join(", "),
      subject,
      text: textBody,
      html,
    });
    return { messageId: info.messageId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function renderAdminDigestHtml(
  date: string,
  checkIns: Array<{
    bookingId: string;
    guestFullName: string;
    guestEmail: string;
    guestPhone: string | null;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    nightCount: number;
    roomCount: number;
    roomType: string;
    mealPlan: string;
    adultCount: number;
    childCount: number;
    caretakerNumber: string;
    specialRequests: string;
    balanceAmount: number;
    paymentStatus: string;
    currency: string;
    googleReviewUrl?: string;
    instagramUrl?: string;
  }>,
  checkOuts: Array<{
    bookingId: string;
    guestFullName: string;
    guestEmail: string;
    guestPhone: string | null;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    nightCount: number;
    roomCount: number;
    roomType: string;
    mealPlan: string;
    adultCount: number;
    childCount: number;
    caretakerNumber: string;
    specialRequests: string;
    balanceAmount: number;
    paymentStatus: string;
    currency: string;
    googleReviewUrl?: string;
    instagramUrl?: string;
  }>,
): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const element = React.createElement(AdminDailyDigestEmail, {
    date,
    checkIns,
    checkOuts,
  });
  return renderToStaticMarkup(element);
}

export async function sendRawEmail(options: {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
}): Promise<{ messageId?: string; error?: string }> {
  const transporter = getTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"The Stream by Ekantah" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME || "digital@ekantah.com"}>`,
      to: options.to.join(", "),
      cc: options.cc?.join(", "),
      bcc: options.bcc?.join(", "),
      subject: options.subject,
      text: options.text || "Please view the HTML version of this email.",
      html: options.html,
    });
    return { messageId: info.messageId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
