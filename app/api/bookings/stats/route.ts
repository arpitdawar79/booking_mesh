import { parseDateRangeParams } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = parseDateRangeParams(searchParams);
  // Stays overlapping the selected range
  const rangeWhere: Record<string, unknown> = range
    ? {
        checkInDate: { lt: range.endExclusive },
        checkOutDate: { gt: range.start },
      }
    : {};

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const todayStr = now.toISOString().split("T")[0];

  const [
    allBookings,
    confirmedBookings,
    cancelledBookings,
    thisMonthBookings,
    upcomingCheckinsRaw,
    totalRevenueAgg,
    outstandingBalanceAgg,
  ] = await Promise.all([
    prisma.booking.count({ where: rangeWhere }),
    prisma.booking.count({
      where: { ...rangeWhere, status: "confirmed" },
    }),
    prisma.booking.count({
      where: { ...rangeWhere, status: "cancelled" },
    }),
    prisma.booking.count({
      where: {
        bookingDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
    }),
    prisma.booking.findMany({
      where: { status: "confirmed" },
      orderBy: { checkInDate: "asc" },
      select: {
        id: true,
        bookingId: true,
        guestFullName: true,
        checkInDate: true,
        checkOutDate: true,
        nightCount: true,
        totalAmount: true,
      },
    }),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { ...rangeWhere, status: { not: "cancelled" } },
    }),
    prisma.booking.aggregate({
      _sum: { balanceAmount: true },
      where: {
        ...rangeWhere,
        status: "confirmed",
        balanceAmount: { gt: 0 },
      },
    }),
  ]);

  const upcomingCheckins = upcomingCheckinsRaw
    .filter((b) => {
      const checkInStr = String(b.checkInDate as unknown).split("T")[0];
      return checkInStr >= todayStr;
    })
    .slice(0, 5);

  const occupancyNights =
    confirmedBookings > 0
      ? await prisma.booking.aggregate({
          _sum: { nightCount: true },
          where: { ...rangeWhere, status: "confirmed" },
        })
      : { _sum: { nightCount: 0 } };

  return NextResponse.json({
    counts: {
      total: allBookings,
      confirmed: confirmedBookings,
      cancelled: cancelledBookings,
      thisMonth: thisMonthBookings,
    },
    revenue: {
      total: Number(totalRevenueAgg._sum.totalAmount || 0),
      outstanding: Number(outstandingBalanceAgg._sum.balanceAmount || 0),
    },
    occupancy: {
      totalNights: Number(occupancyNights._sum.nightCount || 0),
    },
    upcomingCheckins,
  });
}
