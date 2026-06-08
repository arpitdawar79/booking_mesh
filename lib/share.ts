import type { Booking } from "@prisma/client";
import { formatDate } from "./utils";

export function formatBookingSummary(booking: Booking): string {
  const currency = booking.currency || "INR";
  const total = Number(booking.totalAmount).toLocaleString("en-IN");
  const paid = Number(booking.amountPaidOnline).toLocaleString("en-IN");
  const balance = Number(booking.balanceAmount).toLocaleString("en-IN");
  const checkIn = formatDate(booking.checkInDate);
  const checkOut = formatDate(booking.checkOutDate);

  return `
*Booking Confirmation – The Stream by Ekantah*

*Guest:* ${booking.guestFullName}
*Booking ID:* #${booking.bookingId}
*Dates:* ${checkIn} → ${checkOut} (${booking.nightCount} nights)
*Rooms:* ${booking.roomCount} × ${booking.roomType}
*Guests:* ${booking.adultCount} adults${booking.childCount ? `, ${booking.childCount} children` : ""}

*Payment:*
• Total: ${currency} ${total}
• Paid Online: ${currency} ${paid}
• Balance: ${currency} ${balance}
• Status: ${booking.paymentStatus}

*Property:*
${booking.propertyAddress}
Phone: ${booking.propertyPhone}
Caretaker: ${booking.caretakerNumber} (Ram)

*Map:* ${booking.mapLink}

We look forward to hosting you!
  `.trim();
}

export function formatPaymentReminder(booking: Booking): string {
  const currency = booking.currency || "INR";
  const balance = Number(booking.balanceAmount).toLocaleString("en-IN");
  const checkIn = formatDate(booking.checkInDate);
  const checkOut = formatDate(booking.checkOutDate);

  return `
Hi ${booking.guestFirstName},

This is a friendly reminder that your booking *#${booking.bookingId}* at *The Stream by Ekantah* has an outstanding balance of *${currency} ${balance}*.

Check-in: ${checkIn}
Check-out: ${checkOut}

Please settle the balance before arrival. Reply to this message for payment details.\n\nCaretaker: ${booking.caretakerNumber} (Ram)

Thank you!
  `.trim();
}

export function whatsappShareUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function smsShareUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const cleaned = phone.replace(/\D/g, "");
    return `sms:${cleaned}?body=${encoded}`;
  }
  return `sms:?body=${encoded}`;
}

export function emailShareUrl(
  subject: string,
  body: string,
  to?: string,
): string {
  const params = new URLSearchParams({ subject, body });
  if (to) {
    return `mailto:${to}?${params.toString()}`;
  }
  return `mailto:?${params.toString()}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

export async function nativeShare(
  title: string,
  text: string,
  url?: string,
  files?: File[],
): Promise<boolean> {
  const shareData: ShareData = { title, text };
  if (url) shareData.url = url;
  if (
    files &&
    files.length > 0 &&
    navigator.canShare &&
    navigator.canShare({ files })
  ) {
    shareData.files = files;
  }

  if (!navigator.share) return false;

  try {
    await navigator.share(shareData);
    return true;
  } catch {
    return false;
  }
}
