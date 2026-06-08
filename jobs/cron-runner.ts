import { renderAdminDigestHtml, sendEmail, sendRawEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  generatePdfFromHtml,
  sendBookingWhatsApp,
  sendWhatsAppGroupMessage,
  sendWhatsAppGroupPdf,
} from "@/lib/whatsapp";
import { format } from "date-fns";
import cron from "node-cron";

function log(label: string, message: string) {
  console.log(`[${new Date().toISOString()}] [${label}] ${message}`);
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

function getTomorrowRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  return { start, end };
}

async function wasEmailSent(bookingId: string, type: string) {
  const existing = await prisma.emailSent.findFirst({
    where: { bookingId, type },
  });
  return !!existing;
}

async function wasWhatsAppSent(bookingId: string, type: string) {
  const existing = await prisma.whatsAppMessage.findFirst({
    where: { bookingId, type },
  });
  return !!existing;
}

async function getAdminWhatsAppGroupId(): Promise<string | null> {
  const config = await prisma.appConfig.findUnique({
    where: { key: "adminWhatsAppGroupId" },
  });
  return config?.value ?? null;
}

async function recordEmailSent(
  bookingId: string,
  type: string,
  toEmail: string,
  subject: string,
  htmlBody: string,
  status: "sent" | "failed" = "sent",
) {
  await prisma.emailSent.create({
    data: {
      bookingId,
      type,
      toEmail,
      subject,
      htmlBody,
      status,
    },
  });
}

// Cron 2: Admin daily digest — runs at 7:00 AM
const adminDigestJob = cron.schedule(
  "0 7 * * *",
  async () => {
    log("admin-digest", "Starting admin daily digest...");
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const { start: todayStart, end: todayEnd } = getTodayRange();
      const adminEmail = process.env.ADMIN_EMAIL || "digital@ekantah.com";

      const checkIns = await prisma.booking.findMany({
        where: {
          status: "confirmed",
          checkInDate: { gte: todayStart, lt: todayEnd },
        },
        select: {
          bookingId: true,
          guestFullName: true,
          guestEmail: true,
          guestPhone: true,
          checkInDate: true,
          checkOutDate: true,
          checkInTime: true,
          checkOutTime: true,
          nightCount: true,
          roomCount: true,
          roomType: true,
          extraMattressCount: true,
          mealPlan: true,
          adultCount: true,
          childCount: true,
          caretakerNumber: true,
          specialRequests: true,
          balanceAmount: true,
          paymentStatus: true,
          currency: true,
        },
      });

      const checkOuts = await prisma.booking.findMany({
        where: {
          status: { in: ["confirmed", "completed"] },
          checkOutDate: { gte: todayStart, lt: todayEnd },
        },
        select: {
          bookingId: true,
          guestFullName: true,
          guestEmail: true,
          guestPhone: true,
          checkInDate: true,
          checkOutDate: true,
          checkInTime: true,
          checkOutTime: true,
          nightCount: true,
          roomCount: true,
          roomType: true,
          extraMattressCount: true,
          mealPlan: true,
          adultCount: true,
          childCount: true,
          caretakerNumber: true,
          specialRequests: true,
          balanceAmount: true,
          paymentStatus: true,
          currency: true,
        },
      });

      const googleReviewUrl = process.env.GOOGLE_REVIEW_URL;
      const instagramUrl = process.env.INSTAGRAM_URL;

      const html = await renderAdminDigestHtml(
        todayStr,
        checkIns.map((b) => ({
          bookingId: b.bookingId,
          guestFullName: b.guestFullName,
          guestEmail: b.guestEmail,
          guestPhone: b.guestPhone,
          checkInDate: formatDate(b.checkInDate),
          checkOutDate: formatDate(b.checkOutDate),
          checkInTime: b.checkInTime,
          checkOutTime: b.checkOutTime,
          nightCount: b.nightCount,
          roomCount: b.roomCount,
          roomType: b.roomType,
          extraMattressCount: b.extraMattressCount,
          mealPlan: b.mealPlan,
          adultCount: b.adultCount,
          childCount: b.childCount,
          caretakerNumber: b.caretakerNumber,
          specialRequests: b.specialRequests || "None shared.",
          balanceAmount: Number(b.balanceAmount || 0),
          paymentStatus: b.paymentStatus,
          currency: b.currency,
          googleReviewUrl,
          instagramUrl,
        })),
        checkOuts.map((b) => ({
          bookingId: b.bookingId,
          guestFullName: b.guestFullName,
          guestEmail: b.guestEmail,
          guestPhone: b.guestPhone,
          checkInDate: formatDate(b.checkInDate),
          checkOutDate: formatDate(b.checkOutDate),
          checkInTime: b.checkInTime,
          checkOutTime: b.checkOutTime,
          nightCount: b.nightCount,
          roomCount: b.roomCount,
          roomType: b.roomType,
          extraMattressCount: b.extraMattressCount,
          mealPlan: b.mealPlan,
          adultCount: b.adultCount,
          childCount: b.childCount,
          caretakerNumber: b.caretakerNumber,
          specialRequests: b.specialRequests || "None shared.",
          balanceAmount: Number(b.balanceAmount || 0),
          paymentStatus: b.paymentStatus,
          currency: b.currency,
          googleReviewUrl,
          instagramUrl,
        })),
      );

      const result = await sendRawEmail({
        to: [adminEmail],
        subject: `Daily Digest — ${todayStr} | The Stream by Ekantah`,
        html,
        text: `Daily Digest for ${todayStr}\n\nCheck-ins: ${checkIns.length}\nCheck-outs: ${checkOuts.length}`,
      });

      if (result.error) {
        log("admin-digest", `Failed to send: ${result.error}`);
      } else {
        log(
          "admin-digest",
          `Sent to ${adminEmail}. Check-ins: ${checkIns.length}, Check-outs: ${checkOuts.length}`,
        );
      }

      const adminGroupId = await getAdminWhatsAppGroupId();
      if (adminGroupId && (checkIns.length > 0 || checkOuts.length > 0)) {
        let waMessage = `*Daily Digest — ${todayStr}* \n\n`;
        waMessage += `📥 Check-ins today: ${checkIns.length}\n`;
        if (checkIns.length > 0) {
          checkIns.forEach((b, i) => {
            waMessage += `${i + 1}. ${b.guestFullName} (#${b.bookingId})\n`;
            waMessage += `   📞 ${b.guestPhone || "—"} · ${b.adultCount} adults${b.childCount > 0 ? `, ${b.childCount} children` : ""}\n`;
            waMessage += `   🛏 ${b.roomCount}x ${b.roomType} · 🍽 ${b.mealPlan}\n`;
            if (b.specialRequests && b.specialRequests !== "None shared.") {
              waMessage += `   📝 ${b.specialRequests}\n`;
            }
            waMessage += `\n`;
          });
        }
        waMessage += `📤 Check-outs today: ${checkOuts.length}\n`;
        if (checkOuts.length > 0) {
          checkOuts.forEach((b, i) => {
            const bal = Number(b.balanceAmount || 0);
            waMessage += `${i + 1}. ${b.guestFullName} (#${b.bookingId})\n`;
            waMessage += `   📞 ${b.guestPhone || "—"}\n`;
            if (bal > 0) {
              waMessage += `   💰 Balance: ${b.currency} ${bal.toLocaleString("en-IN")} (${b.paymentStatus})\n`;
            }
            waMessage += `   ✅ Ask for review · Ask for group photo · Ask for Instagram mention\n`;
            if (instagramUrl) waMessage += `   📸 IG: ${instagramUrl}\n`;
            waMessage += `\n`;
          });
        }

        const waResult = await sendWhatsAppGroupMessage(
          adminGroupId,
          waMessage,
        );
        if (waResult.error) {
          log("admin-digest", `WA group failed: ${waResult.error}`);
        } else {
          log("admin-digest", `WA group sent to ${adminGroupId}`);
        }

        try {
          const pdfBuffer = await generatePdfFromHtml(html);
          const waPdfResult = await sendWhatsAppGroupPdf(
            adminGroupId,
            pdfBuffer,
            `Daily_Digest_${todayStr}.pdf`,
            `Daily Digest — ${todayStr}`,
          );
          if (waPdfResult.error) {
            log("admin-digest", `WA group PDF failed: ${waPdfResult.error}`);
          } else {
            log("admin-digest", `WA group PDF sent to ${adminGroupId}`);
          }
        } catch (pdfErr) {
          log(
            "admin-digest",
            `WA group PDF error: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`,
          );
        }
      }
    } catch (err) {
      log("admin-digest", `Error: ${err}`);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

// Cron 1: Checkout reminder — runs at 9:00 AM
const checkoutReminderJob = cron.schedule(
  "0 9 * * *",
  async () => {
    log("checkout-reminder", "Starting checkout reminders...");
    try {
      const { start: todayStart, end: todayEnd } = getTodayRange();

      const bookings = await prisma.booking.findMany({
        where: {
          status: "confirmed",
          checkOutDate: { gte: todayStart, lt: todayEnd },
        },
      });

      let sentCount = 0;
      for (const booking of bookings) {
        const alreadySent = await wasEmailSent(booking.id, "checkout_reminder");
        if (alreadySent) {
          log(
            "checkout-reminder",
            `Skipping ${booking.bookingId} — already sent`,
          );
          continue;
        }

        const result = await sendEmail("checkout_reminder", booking, {
          to: [booking.guestEmail],
        });

        if (result.error) {
          log(
            "checkout-reminder",
            `Failed ${booking.bookingId}: ${result.error}`,
          );
          await recordEmailSent(
            booking.id,
            "checkout_reminder",
            booking.guestEmail,
            `Checkout reminder — ${booking.bookingId}`,
            "",
            "failed",
          );
        } else {
          log(
            "checkout-reminder",
            `Sent to ${booking.guestEmail} (${booking.bookingId})`,
          );
          await recordEmailSent(
            booking.id,
            "checkout_reminder",
            booking.guestEmail,
            `Checkout reminder — ${booking.bookingId}`,
            "",
            "sent",
          );
          // Mark booking as completed after checkout email
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "completed" },
          });
          sentCount++;
        }

        if (booking.guestPhone) {
          const alreadySentWA = await wasWhatsAppSent(
            booking.id,
            "checkout_reminder",
          );
          if (!alreadySentWA) {
            const waResult = await sendBookingWhatsApp(
              "checkout_reminder",
              booking,
              { sendPdf: true },
            );
            if (!waResult.success) {
              log(
                "checkout-reminder",
                `WA failed ${booking.bookingId}: ${waResult.error}`,
              );
            }
          }
        }
      }

      log(
        "checkout-reminder",
        `Finished. Sent ${sentCount}/${bookings.length} reminders.`,
      );
    } catch (err) {
      log("checkout-reminder", `Error: ${err}`);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

// Cron 3: Pre-arrival reminder — runs at 10:00 AM
const preArrivalReminderJob = cron.schedule(
  "0 10 * * *",
  async () => {
    log("pre-arrival", "Starting pre-arrival reminders...");
    try {
      const { start: tomorrowStart, end: tomorrowEnd } = getTomorrowRange();

      const bookings = await prisma.booking.findMany({
        where: {
          status: "confirmed",
          checkInDate: { gte: tomorrowStart, lt: tomorrowEnd },
        },
      });

      let sentCount = 0;
      for (const booking of bookings) {
        const alreadySent = await wasEmailSent(
          booking.id,
          "pre_arrival_reminder",
        );
        if (alreadySent) {
          log("pre-arrival", `Skipping ${booking.bookingId} — already sent`);
          continue;
        }

        const result = await sendEmail("pre_arrival_reminder", booking, {
          to: [booking.guestEmail],
        });

        if (result.error) {
          log("pre-arrival", `Failed ${booking.bookingId}: ${result.error}`);
          await recordEmailSent(
            booking.id,
            "pre_arrival_reminder",
            booking.guestEmail,
            `Pre-arrival reminder — ${booking.bookingId}`,
            "",
            "failed",
          );
        } else {
          log(
            "pre-arrival",
            `Sent to ${booking.guestEmail} (${booking.bookingId})`,
          );
          await recordEmailSent(
            booking.id,
            "pre_arrival_reminder",
            booking.guestEmail,
            `Pre-arrival reminder — ${booking.bookingId}`,
            "",
            "sent",
          );
          sentCount++;
        }

        if (booking.guestPhone) {
          const alreadySentWA = await wasWhatsAppSent(
            booking.id,
            "pre_arrival_reminder",
          );
          if (!alreadySentWA) {
            const waResult = await sendBookingWhatsApp(
              "pre_arrival_reminder",
              booking,
              { sendPdf: true },
            );
            if (!waResult.success) {
              log(
                "pre-arrival",
                `WA failed ${booking.bookingId}: ${waResult.error}`,
              );
            }
          }
        }
      }

      log(
        "pre-arrival",
        `Finished. Sent ${sentCount}/${bookings.length} reminders.`,
      );
    } catch (err) {
      log("pre-arrival", `Error: ${err}`);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

log("runner", "Cron runner started. Registered jobs:");
log("runner", `- admin-digest: ${adminDigestJob.getStatus()} (7:00 AM)`);
log(
  "runner",
  `- checkout-reminder: ${checkoutReminderJob.getStatus()} (9:00 AM)`,
);
log(
  "runner",
  `- pre-arrival-reminder: ${preArrivalReminderJob.getStatus()} (10:00 AM)`,
);

// Graceful shutdown
process.on("SIGINT", async () => {
  log("runner", "Received SIGINT, stopping cron jobs...");
  adminDigestJob.stop();
  checkoutReminderJob.stop();
  preArrivalReminderJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  log("runner", "Received SIGTERM, stopping cron jobs...");
  adminDigestJob.stop();
  checkoutReminderJob.stop();
  preArrivalReminderJob.stop();
  await prisma.$disconnect();
  process.exit(0);
});
