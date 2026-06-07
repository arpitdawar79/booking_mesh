import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
    10,
  );
  const month = parseInt(
    searchParams.get("month") || String(new Date().getMonth() + 1),
    10,
  );

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];

  // Occupancy per night: a booking occupies rooms on each night from check_in to check_out - 1
  const occupancyData = await prisma.$queryRaw<
    Array<{
      date: Date;
      rooms: number;
      guests: number;
      revenue: number;
      bookings: number;
    }>
  >`
    WITH dates AS (
      SELECT generate_series(${startStr}::date, ${endStr}::date, '1 day'::interval)::date as date
    )
    SELECT 
      dates.date as date,
      COALESCE(SUM(b.room_count), 0)::int as rooms,
      COALESCE(SUM(b.adult_count + b.child_count), 0)::int as guests,
      COALESCE(SUM(b.total_amount / NULLIF(b.night_count, 0)), 0)::float as revenue,
      COUNT(DISTINCT b.id)::int as bookings
    FROM dates
    LEFT JOIN bookings b 
      ON dates.date >= b.check_in_date::date 
      AND dates.date < b.check_out_date::date
      AND b.status != 'cancelled'
    GROUP BY dates.date
    ORDER BY dates.date ASC
  `;

  // Check-ins on each day
  const checkinsData = await prisma.$queryRaw<
    Array<{
      date: string;
      checkins: number;
      checkinRevenue: number;
    }>
  >`
    SELECT 
      check_in_date as date,
      COALESCE(SUM(room_count), 0)::int as checkins,
      COALESCE(SUM(total_amount), 0)::float as checkinRevenue
    FROM bookings
    WHERE status != 'cancelled'
      AND check_in_date >= ${startStr}
      AND check_in_date <= ${endStr}
    GROUP BY check_in_date
    ORDER BY check_in_date ASC
  `;

  // Check-outs on each day
  const checkoutsData = await prisma.$queryRaw<
    Array<{
      date: string;
      checkouts: number;
    }>
  >`
    SELECT 
      check_out_date as date,
      COALESCE(SUM(room_count), 0)::int as checkouts
    FROM bookings
    WHERE status != 'cancelled'
      AND check_out_date >= ${startStr}
      AND check_out_date <= ${endStr}
    GROUP BY check_out_date
    ORDER BY check_out_date ASC
  `;

  const checkinsMap = new Map<
    string,
    { date: string; checkins: number; checkinRevenue: number }
  >(
    checkinsData.map(
      (d: { date: string; checkins: number; checkinRevenue: number }) => [
        d.date,
        d,
      ],
    ) as [string, { date: string; checkins: number; checkinRevenue: number }][],
  );
  const checkoutsMap = new Map<string, { date: string; checkouts: number }>(
    checkoutsData.map((d: { date: string; checkouts: number }) => [
      d.date,
      d,
    ]) as [string, { date: string; checkouts: number }][],
  );

  interface DayData {
    date: string;
    rooms: number;
    guests: number;
    revenue: number;
    bookings: number;
    checkins: number;
    checkinRevenue: number;
    checkouts: number;
  }

  const days: DayData[] = occupancyData.map(
    (d: {
      date: Date;
      rooms: number;
      guests: number;
      revenue: number;
      bookings: number;
    }) => {
      const dateStr = d.date.toISOString().split("T")[0];
      const checkin = checkinsMap.get(dateStr);
      const checkout = checkoutsMap.get(dateStr);
      return {
        date: dateStr,
        rooms: Number(d.rooms),
        guests: Number(d.guests),
        revenue: Number(d.revenue),
        bookings: Number(d.bookings),
        checkins: checkin ? Number(checkin.checkins) : 0,
        checkinRevenue: checkin ? Number(checkin.checkinRevenue) : 0,
        checkouts: checkout ? Number(checkout.checkouts) : 0,
      };
    },
  );

  // Month summary
  const monthSummary = {
    totalRooms: days.reduce((s: number, d: DayData) => s + d.rooms, 0),
    totalGuests: days.reduce((s: number, d: DayData) => s + d.guests, 0),
    totalRevenue: days.reduce((s: number, d: DayData) => s + d.revenue, 0),
    totalCheckins: days.reduce((s: number, d: DayData) => s + d.checkins, 0),
    totalCheckouts: days.reduce((s: number, d: DayData) => s + d.checkouts, 0),
    avgRooms:
      days.length > 0
        ? days.reduce((s: number, d: DayData) => s + d.rooms, 0) / days.length
        : 0,
    avgRevenue:
      days.length > 0
        ? days.reduce((s: number, d: DayData) => s + d.revenue, 0) / days.length
        : 0,
  };

  return NextResponse.json({ year, month, days, summary: monthSummary });
}
