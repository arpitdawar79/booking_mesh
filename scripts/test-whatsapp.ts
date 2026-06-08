import { prisma } from "@/lib/prisma";
import {
  formatWhatsAppMessage,
  generateBookingPdf,
  initWhatsApp,
  sendBookingWhatsApp,
  sendWhatsAppGroupMessage,
  sendWhatsAppGroupPdf,
  sendWhatsAppMessage,
  sendWhatsAppPdf,
} from "@/lib/whatsapp";

// --- CONFIG ---
// Set exactly one of these. Leave the other empty/commented.
const TEST_PHONE = ""; // e.g. "9876543210"
const TEST_GROUP_JID = "120363284385430251@g.us"; // e.g. "123456789@g.us" or just "123456789"

// When true, generates and sends a PDF. If TEST_PHONE or TEST_GROUP_JID is set,
// the PDF goes to that destination; otherwise it falls back to the booking's guestPhone.
const TEST_PDF = true;

const MESSAGE_TYPES: string[] = [
  "booking_confirmation",
  "cancellation",
  "checkout_reminder",
  "thank_you",
  "refund_credited",
  "notification",
  "pre_arrival_reminder",
];
// ----------------

async function main() {
  const mode = TEST_PHONE ? "phone" : TEST_GROUP_JID ? "group" : null;

  if (!TEST_PDF && !mode) {
    console.error(
      "Please configure exactly one destination:\n" +
        "  - TEST_PHONE for a direct phone number send\n" +
        "  - TEST_GROUP_JID for a group send\n" +
        "  - Or set TEST_PDF = true to test PDF via the booking's guestPhone\n",
    );
    process.exit(1);
  }

  console.log("Initializing WhatsApp connection...");
  await initWhatsApp();

  // Give the socket a moment to connect / show QR if needed
  await new Promise((r) => setTimeout(r, 3000));

  // if (mode === "group") {
  //   console.log("\nFetching available WhatsApp groups...");
  //   const groups = await getWhatsAppGroups();
  //   if (groups && groups.length) {
  //     console.log("Available groups:");
  //     for (const g of groups) {
  //       console.log(`  - ${g.name} (${g.id})`);
  //     }
  //   } else {
  //     console.log("  (no groups found or not connected)");
  //   }
  // }

  console.log("Fetching a confirmed booking from the database...");
  const booking = await prisma.booking.findFirst({
    where: { status: "confirmed" },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    console.error("No confirmed booking found in the database.");
    process.exit(1);
  }

  console.log(
    `Using booking: ${booking.bookingId} (${booking.guestFullName})\n`,
  );

  for (const type of MESSAGE_TYPES) {
    console.log(`Sending ${type}...`);

    let result: { success: boolean; error?: string };

    const message = formatWhatsAppMessage(type, booking, undefined);

    if (TEST_PDF) {
      if (mode === "phone") {
        const pdfBuffer = await generateBookingPdf(type, booking, undefined);
        result = await sendWhatsAppPdf(
          TEST_PHONE,
          pdfBuffer,
          `Booking_${booking.bookingId}.pdf`,
          message,
        );
      } else if (mode === "group") {
        const pdfBuffer = await generateBookingPdf(type, booking, undefined);
        result = await sendWhatsAppGroupPdf(
          TEST_GROUP_JID,
          pdfBuffer,
          `Booking_${booking.bookingId}.pdf`,
          message,
        );
      } else {
        result = await sendBookingWhatsApp(type, booking, { sendPdf: true });
      }
    } else {
      if (mode === "phone") {
        result = await sendWhatsAppMessage(TEST_PHONE, message);
      } else if (mode === "group") {
        result = await sendWhatsAppGroupMessage(TEST_GROUP_JID, message);
      } else {
        result = await sendBookingWhatsApp(type, booking);
      }
    }

    if (result.success) {
      console.log("  Sent successfully");
    } else {
      console.error(`  Failed: ${result.error}`);
    }
  }

  console.log("\nAll done!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
