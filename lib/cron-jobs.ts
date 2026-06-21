import { renderAdminDigestHtml, sendEmail, sendRawEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
    enrichContactProfile,
    generatePdfFromHtml,
    sendBookingWhatsApp,
    sendWhatsAppGroupMessage,
    sendWhatsAppGroupPdf,
} from "@/lib/whatsapp";
import { format } from "date-fns";

export type LogFn = (label: string, message: string) => void;

const defaultLog: LogFn = (label, message) => {
  console.log(`[${new Date().toISOString()}] [${label}] ${message}`);
};

class LogBuffer {
  lines: string[] = [];
  log: LogFn = (label, message) => {
    const line = `[${new Date().toISOString()}] [${label}] ${message}`;
    console.log(line);
    this.lines.push(line);
  };
}

export async function runJob(
  name: string,
  fn: (log: LogFn) => Promise<void>,
  triggeredBy: "schedule" | "manual" = "schedule",
) {
  const buffer = new LogBuffer();
  const startedAt = new Date();
  const run = await prisma.cronRun.create({
    data: { jobName: name, status: "running", startedAt, triggeredBy },
  });

  const start = Date.now();
  try {
    await fn(buffer.log);
    const durationMs = Date.now() - start;
    await prisma.cronRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        completedAt: new Date(),
        durationMs,
        logs: buffer.lines.join("\n"),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    await prisma.cronRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        durationMs,
        logs: buffer.lines.join("\n"),
        error,
      },
    });
  }
}

function getTodayRange() {
  const now = new Date();
  const istStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const parts = istStr.split(/[\/\,\:]/);
  const istMonth = parseInt(parts[0]) - 1;
  const istDay = parseInt(parts[1]);
  const istYear = parseInt(parts[2].split(" ")[0]);

  const todayIST = new Date(Date.UTC(istYear, istMonth, istDay, 0, 0, 0));
  const start = new Date(todayIST.getTime() - 5.5 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function getTomorrowRange() {
  const now = new Date();
  const istStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const parts = istStr.split(/[\/\,\:]/);
  const istMonth = parseInt(parts[0]) - 1;
  const istDay = parseInt(parts[1]);
  const istYear = parseInt(parts[2].split(" ")[0]);

  const tomorrowIST = new Date(
    Date.UTC(istYear, istMonth, istDay + 1, 0, 0, 0),
  );
  const start = new Date(tomorrowIST.getTime() - 5.5 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
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

export async function runAdminDigestJob(log: LogFn = defaultLog) {
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

      const waResult = await sendWhatsAppGroupMessage(adminGroupId, waMessage);
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
    throw err;
  }
}

export async function runCheckoutReminderJob(log: LogFn = defaultLog) {
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

      if (booking.guestEmail) {
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
          sentCount++;
        }
        const balance = Number(booking.balanceAmount);
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "completed",
            amountPaidOnline: booking.totalAmount,
            balanceAmount: 0,
            paymentStatus: "paid_in_full",
          },
        });
        if (balance > 0) {
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              amount: balance,
              method: "cash",
              referenceNumber: "Auto-settled: checkout reminder",
              recordedBy: "System",
            },
          });
          log(
            "checkout-reminder",
            `Marked ${booking.bookingId} fully paid (balance ${balance} cleared)`,
          );
        }
      } else {
        log(
          "checkout-reminder",
          `Skipping email for ${booking.bookingId} — no guest email`,
        );
        const balance = Number(booking.balanceAmount);
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "completed",
            amountPaidOnline: booking.totalAmount,
            balanceAmount: 0,
            paymentStatus: "paid_in_full",
          },
        });
        if (balance > 0) {
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              amount: balance,
              method: "cash",
              referenceNumber: "Auto-settled: checkout reminder",
              recordedBy: "System",
            },
          });
          log(
            "checkout-reminder",
            `Marked ${booking.bookingId} fully paid (balance ${balance} cleared)`,
          );
        }
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
    throw err;
  }
}

export async function runPreArrivalReminderJob(log: LogFn = defaultLog) {
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

      if (booking.guestEmail) {
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
      } else {
        log(
          "pre-arrival",
          `Skipping email for ${booking.bookingId} — no guest email`,
        );
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
    throw err;
  }
}

// ─── Contact Profile Enrichment Cron ───
//
// Runs periodically (every 30 min via cron-runner). Picks up leads that have
// never been enriched OR were last enriched >7 days ago. Processes a small
// batch (20) each run to avoid rate-limiting. This decouples enrichment from
// extraction so contact extraction stays fast.

const ENRICH_BATCH_SIZE = 20;
const ENRICH_REVALIDATE_DAYS = 7;
const ENRICH_TIMEOUT_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runContactEnrichmentJob(log: LogFn = defaultLog) {
  log("enrichment", "Starting contact profile enrichment batch...");

  // Check WhatsApp connection status before doing anything
  const { getConnectionStatus } = await import("@/lib/whatsapp");
  const waStatus = getConnectionStatus();
  if (waStatus.status !== "open") {
    log(
      "enrichment",
      `WhatsApp not connected (status: ${waStatus.status}). Skipping enrichment batch.`,
    );
    return;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ENRICH_REVALIDATE_DAYS);

  const leads = await prisma.userLead.findMany({
    where: {
      OR: [{ lastEnrichedAt: null }, { lastEnrichedAt: { lt: cutoff } }],
      status: "active",
    },
    take: ENRICH_BATCH_SIZE,
    orderBy: { lastEnrichedAt: "asc" },
  });

  if (leads.length === 0) {
    log("enrichment", "No leads need enrichment. Skipping.");
    return;
  }

  log("enrichment", `Enriching ${leads.length} leads...`);

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (const lead of leads) {
    const jid = `${lead.phoneNumber}@s.whatsapp.net`;

    try {
      const profile = await Promise.race([
        enrichContactProfile(jid),
        sleep(ENRICH_TIMEOUT_MS).then(() => null),
      ]);

      if (profile === null) {
        // Timed out — don't mark lastEnrichedAt so it gets retried next run
        log("enrichment", `Timeout for ${jid}, will retry next batch`);
        skipped++;
        await sleep(300);
        continue;
      }

      const hasData =
        profile.profilePicUrl !== null || profile.aboutText !== null;

      await prisma.userLead.update({
        where: { id: lead.id },
        data: {
          profilePicUrl: profile.profilePicUrl,
          aboutText: profile.aboutText,
          isWhatsAppUser: profile.isWhatsAppUser,
          lastEnrichedAt: new Date(),
        },
      });

      if (hasData) {
        enriched++;
      } else {
        // Profile is private/no data — still mark as attempted
        log(
          "enrichment",
          `No profile data for ${jid} (private/no pic/no about)`,
        );
        failed++;
      }
    } catch (err) {
      // Mark as attempted even on failure to avoid retrying the same lead every run
      log(
        "enrichment",
        `Error enriching ${jid}: ${err instanceof Error ? err.message : String(err)}`,
      );
      await prisma.userLead.update({
        where: { id: lead.id },
        data: { lastEnrichedAt: new Date() },
      });
      failed++;
    }

    // Small delay between contacts to avoid WhatsApp rate-limiting
    await sleep(500);
  }

  log(
    "enrichment",
    `Batch complete. Enriched: ${enriched}, Failed/no data: ${failed}, Skipped/timeouts: ${skipped}, Total: ${leads.length}`,
  );
}
