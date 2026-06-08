import {
    renderAdminDigestHtml,
    sendEmail,
    sendRawEmail,
    type EmailType,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

// const TEST_EMAIL = "akshat.dawar8848@gmail.com";
const TEST_EMAIL = "arpitdawar79@gmail.com";

const EMAIL_TYPES: EmailType[] = [
  "booking_confirmation",
  "cancellation",
  "notification",
  "thank_you",
  "refund_credited",
  "checkout_reminder",
  "pre_arrival_reminder",
];

async function main() {
  console.log("Fetching a booking from the database...");

  const booking = await prisma.booking.findFirst({
    where: { status: "confirmed" },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    console.error("No confirmed booking found in the database.");
    process.exit(1);
  }

  console.log(`Using booking: ${booking.bookingId} (${booking.guestFullName})`);

  for (const type of EMAIL_TYPES) {
    console.log(`Sending ${type}...`);
    const result = await sendEmail(type, booking, {
      to: [TEST_EMAIL],
      customMessage:
        type === "cancellation" ||
        type === "notification" ||
        type === "refund_credited"
          ? "This is a test email. Please disregard."
          : undefined,
    });

    if (result.error) {
      console.error(`  Failed: ${result.error}`);
    } else {
      console.log(`  Sent: ${result.messageId}`);
    }
  }

  console.log("Sending admin daily digest...");
  const today = new Date().toISOString().split("T")[0];
  const googleReviewUrl = process.env.GOOGLE_REVIEW_URL;
  const instagramUrl = process.env.INSTAGRAM_URL;

  const digestHtml = await renderAdminDigestHtml(
    today,
    [
      {
        bookingId: booking.bookingId,
        guestFullName: booking.guestFullName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        checkInDate: formatDate(booking.checkInDate),
        checkOutDate: formatDate(booking.checkOutDate),
        checkInTime: booking.checkInTime,
        checkOutTime: booking.checkOutTime,
        nightCount: booking.nightCount,
        roomCount: booking.roomCount,
        roomType: booking.roomType,
        extraMattressCount: booking.extraMattressCount,
        mealPlan: booking.mealPlan,
        adultCount: booking.adultCount,
        childCount: booking.childCount,
        caretakerNumber: booking.caretakerNumber,
        specialRequests: booking.specialRequests || "None shared.",
        balanceAmount: Number(booking.balanceAmount || 0),
        paymentStatus: booking.paymentStatus,
        currency: booking.currency,
        googleReviewUrl,
        instagramUrl,
      },
    ],
    [
      {
        bookingId: booking.bookingId,
        guestFullName: booking.guestFullName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        checkInDate: formatDate(booking.checkInDate),
        checkOutDate: formatDate(booking.checkOutDate),
        checkInTime: booking.checkInTime,
        checkOutTime: booking.checkOutTime,
        nightCount: booking.nightCount,
        roomCount: booking.roomCount,
        roomType: booking.roomType,
        extraMattressCount: booking.extraMattressCount,
        mealPlan: booking.mealPlan,
        adultCount: booking.adultCount,
        childCount: booking.childCount,
        caretakerNumber: booking.caretakerNumber,
        specialRequests: booking.specialRequests || "None shared.",
        balanceAmount: Number(booking.balanceAmount || 0),
        paymentStatus: booking.paymentStatus,
        currency: booking.currency,
        googleReviewUrl,
        instagramUrl,
      },
    ],
  );

  const digestResult = await sendRawEmail({
    to: [TEST_EMAIL],
    subject: `Admin Daily Digest — ${today}`,
    html: digestHtml,
  });

  if (digestResult.error) {
    console.error(`  Failed: ${digestResult.error}`);
  } else {
    console.log(`  Sent: ${digestResult.messageId}`);
  }

  console.log("\nAll done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
