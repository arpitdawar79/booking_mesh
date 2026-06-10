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

  const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

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
      date: Date;
      checkins: number;
      checkinrevenue: number;
    }>
  >`
    SELECT 
      check_in_date as date,
      COALESCE(SUM(room_count), 0)::int as checkins,
      COALESCE(SUM(total_amount), 0)::float as checkinrevenue
    FROM bookings
    WHERE status != 'cancelled'
      AND check_in_date::date >= ${startStr}::date
      AND check_in_date::date <= ${endStr}::date
    GROUP BY check_in_date
    ORDER BY check_in_date ASC
  `;

  // Check-outs on each day
  const checkoutsData = await prisma.$queryRaw<
    Array<{
      date: Date;
      checkouts: number;
    }>
  >`
    SELECT 
      check_out_date as date,
      COALESCE(SUM(room_count), 0)::int as checkouts
    FROM bookings
    WHERE status != 'cancelled'
      AND check_out_date::date >= ${startStr}::date
      AND check_out_date::date <= ${endStr}::date
    GROUP BY check_out_date
    ORDER BY check_out_date ASC
  `;

  const checkinsMap = new Map<
    string,
    { date: string; checkins: number; checkinrevenue: number }
  >(
    checkinsData.map(
      (d: { date: Date; checkins: number; checkinrevenue: number }) => [
        d.date.toISOString().split("T")[0],
        {
          date: d.date.toISOString().split("T")[0],
          checkins: Number(d.checkins),
          checkinrevenue: Number(d.checkinrevenue),
        },
      ],
    ) as [string, { date: string; checkins: number; checkinrevenue: number }][],
  );
  const checkoutsMap = new Map<string, { date: string; checkouts: number }>(
    checkoutsData.map((d: { date: Date; checkouts: number }) => [
      d.date.toISOString().split("T")[0],
      {
        date: d.date.toISOString().split("T")[0],
        checkouts: Number(d.checkouts),
      },
    ]) as [string, { date: string; checkouts: number }][],
  );

  // Active bookings in the month range (occupying rooms on any night)
  const activeBookings = await prisma.$queryRaw<
    Array<{
      id: string;
      booking_id: string;
      guest_full_name: string;
      room_count: number;
      adult_count: number;
      child_count: number;
      total_amount: number;
      check_in_date: Date;
      check_out_date: Date;
      status: string;
      payment_status: string;
    }>
  >`
    SELECT 
      id,
      booking_id,
      guest_full_name,
      room_count,
      adult_count,
      child_count,
      total_amount,
      check_in_date,
      check_out_date,
      status,
      payment_status
    FROM bookings
    WHERE status != 'cancelled'
      AND check_in_date::date <= ${endStr}::date
      AND check_out_date::date >= ${startStr}::date
    ORDER BY check_in_date ASC
  `;

  interface BookingInfo {
    id: string;
    bookingId: string;
    guestFullName: string;
    roomCount: number;
    guestCount: number;
    totalAmount: number;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    paymentStatus: string;
  }

  // Group active bookings by each date they occupy
  const bookingsByDate = new Map<string, BookingInfo[]>();

  for (const b of activeBookings) {
    const checkIn = new Date(b.check_in_date);
    const checkOut = new Date(b.check_out_date);
    const bookingInfo: BookingInfo = {
      id: String(b.id),
      bookingId: String(b.booking_id),
      guestFullName: String(b.guest_full_name),
      roomCount: Number(b.room_count),
      guestCount: Number(b.adult_count) + Number(b.child_count),
      totalAmount: Number(b.total_amount),
      checkInDate: checkIn.toISOString().split("T")[0],
      checkOutDate: checkOut.toISOString().split("T")[0],
      status: String(b.status),
      paymentStatus: String(b.payment_status),
    };

    // Add booking to every date it occupies (check_in to check_out - 1)
    const current = new Date(checkIn);
    while (current < checkOut) {
      const dateStr = current.toISOString().split("T")[0];
      if (dateStr >= startStr && dateStr <= endStr) {
        if (!bookingsByDate.has(dateStr)) {
          bookingsByDate.set(dateStr, []);
        }
        bookingsByDate.get(dateStr)!.push(bookingInfo);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  interface DayData {
    date: string;
    rooms: number;
    guests: number;
    revenue: number;
    bookings: number;
    checkins: number;
    checkinrevenue: number;
    checkouts: number;
    bookingsList: BookingInfo[];
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
        checkinrevenue: checkin ? Number(checkin.checkinrevenue) : 0,
        checkouts: checkout ? Number(checkout.checkouts) : 0,
        bookingsList: bookingsByDate.get(dateStr) || [],
      };
    },
  );

  // Monthly additional sales & expenses
  const additionalSales = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COALESCE(SUM(amount), 0)::float as total
    FROM additional_sales
    WHERE date >= ${startStr}::date AND date <= ${endStr}::date
  `;

  const expenses = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COALESCE(SUM(amount), 0)::float as total
    FROM expenses
    WHERE date >= ${startStr}::date AND date <= ${endStr}::date
  `;

  const totalAdditionalSales = Number(additionalSales[0]?.total || 0);
  const totalExpenses = Number(expenses[0]?.total || 0);

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
    totalAdditionalSales,
    totalExpenses,
  };

  return NextResponse.json({ year, month, days, summary: monthSummary });
}
