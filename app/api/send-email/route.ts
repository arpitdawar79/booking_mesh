import { EmailType, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendEmailSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = sendEmailSchema.safeParse(body);
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

  const { bookingId, type, to, cc, bcc, subject, customMessage } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const result = await sendEmail(type as EmailType, booking, {
    to,
    cc,
    bcc,
    subject,
    customMessage,
  });

  const htmlBody =
    result.error || !result.messageId ? "" : `Email sent to ${to.join(", ")}`;

  await prisma.emailSent.create({
    data: {
      bookingId: booking.id,
      type,
      toEmail: to.join(", "),
      ccEmails: cc?.join(", ") || null,
      subject: subject || `${type} email`,
      htmlBody,
      status: result.error ? "failed" : "sent",
    },
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
