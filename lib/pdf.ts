import type { Booking } from "@prisma/client";
import { renderEmailHtml, type EmailType } from "./email";

export async function renderBookingPdfHtml(
  type: string,
  booking: Booking,
  customMessage?: string,
): Promise<string> {
  return renderEmailHtml(type as EmailType, booking, customMessage);
}
