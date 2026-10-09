import { prisma } from "../prisma";
import { logger } from "../logger";
import { reconcileBooking, wallet } from "./rewards";
import { linkBookingLeads } from "./retention";
import type { LogFn } from "../cron-jobs";
export async function syncGuestBooking(bookingId: string) {
  try {
    await reconcileBooking(bookingId);
  } catch (err) {
    logger.error(
      "guest-program",
      `Guest reward reconciliation failed for booking ${bookingId}`,
      { error: err instanceof Error ? err.message : String(err) },
    );
  }
}
export async function runGuestProgramJob(log: LogFn) {
  // Repairs hooks interrupted by a server restart and processes point expiry.
  let cursor: string | undefined,
    total = 0;
  do {
    const bookings = await prisma.booking.findMany({
      where: { guestId: { not: null } },
      orderBy: { id: "asc" },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true },
    });
    for (const b of bookings) {
      await reconcileBooking(b.id);
      total++;
    }
    cursor =
      bookings.length === 100 ? bookings[bookings.length - 1].id : undefined;
  } while (cursor);
  let guestCursor: string | undefined;
  do {
    const guests = await prisma.guest.findMany({
      where: { mergedIntoId: null },
      orderBy: { id: "asc" },
      take: 100,
      ...(guestCursor ? { cursor: { id: guestCursor }, skip: 1 } : {}),
      select: { id: true },
    });
    for (const g of guests) await wallet(g.id);
    guestCursor =
      guests.length === 100 ? guests[guests.length - 1].id : undefined;
  } while (guestCursor);
  const linked = await linkBookingLeads();
  log(
    "guest-program",
    `Reconciled ${total} bookings, expired unspent points, linked ${linked} lead contacts. Campaigns remain drafts.`,
  );
}
