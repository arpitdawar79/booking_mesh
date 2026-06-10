import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  // Monthly revenue breakdown
  const monthlyData = await prisma.$queryRaw<
    Array<{
      month: string;
      revenue: number;
      bookings: number;
      nights: number;
    }>
  >`
    SELECT 
      TO_CHAR(booking_date, 'YYYY-MM') as month,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as bookings,
      COALESCE(SUM(night_count), 0) as nights
    FROM bookings
    WHERE status != 'cancelled'
      AND booking_date >= ${startOfYear}
      AND booking_date < ${endOfYear}
    GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
    ORDER BY month ASC
  `;

  // Payment status distribution
  const paymentStatusData = await prisma.booking.groupBy({
    by: ["paymentStatus"],
    _count: { id: true },
    _sum: { totalAmount: true, balanceAmount: true },
    where: { status: { not: "cancelled" } },
  });

  // Room type distribution
  const roomTypeData = await prisma.booking.groupBy({
    by: ["roomType"],
    _count: { id: true },
    _sum: { totalAmount: true, nightCount: true },
    where: { status: { not: "cancelled" } },
  });

  // Status distribution
  const statusData = await prisma.booking.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  // Weekly booking trend (last 12 weeks)
  const weeklyData = await prisma.$queryRaw<
    Array<{
      week: string;
      bookings: number;
      revenue: number;
    }>
  >`
    SELECT 
      TO_CHAR(booking_date, 'IYYY-IW') as week,
      COUNT(*) as bookings,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM bookings
    WHERE booking_date >= ${new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000)}
    GROUP BY TO_CHAR(booking_date, 'IYYY-IW')
    ORDER BY week ASC
  `;

  // Lead time analysis (days between booking and check-in)
  const leadTimeData = await prisma.$queryRaw<
    Array<{
      bucket: string;
      count: number;
    }>
  >`
    SELECT bucket, COUNT(*) as count
    FROM (
      SELECT 
        CASE 
          WHEN check_in_date::date - booking_date::date <= 7 THEN '0-7 days'
          WHEN check_in_date::date - booking_date::date <= 14 THEN '8-14 days'
          WHEN check_in_date::date - booking_date::date <= 30 THEN '15-30 days'
          WHEN check_in_date::date - booking_date::date <= 60 THEN '31-60 days'
          ELSE '60+ days'
        END as bucket
      FROM bookings
      WHERE status NOT IN ('cancelled', 'archived')
    ) sub
    GROUP BY bucket
    ORDER BY 
      CASE 
        WHEN bucket = '0-7 days' THEN 1
        WHEN bucket = '8-14 days' THEN 2
        WHEN bucket = '15-30 days' THEN 3
        WHEN bucket = '31-60 days' THEN 4
        ELSE 5
      END
  `;

  // Revenue by month with last year comparison
  const lastYearStart = new Date(currentYear - 1, 0, 1);
  const lastYearEnd = new Date(currentYear, 0, 1);
  const lastYearMonthly = await prisma.$queryRaw<
    Array<{
      month: string;
      revenue: number;
    }>
  >`
    SELECT 
      TO_CHAR(booking_date, 'YYYY-MM') as month,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM bookings
    WHERE status != 'cancelled'
      AND booking_date >= ${lastYearStart}
      AND booking_date < ${lastYearEnd}
    GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
    ORDER BY month ASC
  `;

  // Top guests by revenue
  const topGuests = await prisma.booking.groupBy({
    by: ["guestFullName", "guestEmail"],
    _count: { id: true },
    _sum: { totalAmount: true, nightCount: true },
    where: { status: { not: "cancelled" } },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });

  // Upcoming 90 days occupancy projection
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const future90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcomingOccupancy = await prisma.$queryRaw<
    Array<{
      date: Date;
      rooms: number;
      guests: number;
      revenue: number;
    }>
  >`
    SELECT 
      check_in_date as date,
      COALESCE(SUM(room_count), 0) as rooms,
      COALESCE(SUM(adult_count + child_count), 0) as guests,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM bookings
    WHERE status = 'confirmed'
      AND check_in_date >= ${today}::timestamp
      AND check_in_date < ${future90}::timestamp
    GROUP BY check_in_date
    ORDER BY date ASC
  `;

  // Monthly expenses
  const monthlyExpenses = await prisma.$queryRaw<
    Array<{ month: string; total: number }>
  >`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE date >= ${startOfYear}
      AND date < ${endOfYear}
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month ASC
  `;

  // Monthly additional sales
  const monthlyAdditionalSales = await prisma.$queryRaw<
    Array<{ month: string; total: number }>
  >`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      COALESCE(SUM(amount), 0) as total
    FROM additional_sales
    WHERE date >= ${startOfYear}
      AND date < ${endOfYear}
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month ASC
  `;

  // Monthly salaries
  const monthlySalaries = await prisma.$queryRaw<
    Array<{ month: string; total: number }>
  >`
    SELECT 
      CONCAT(year, '-', LPAD(month::text, 2, '0')) as month,
      COALESCE(SUM(net_salary), 0) as total
    FROM salary_slips
    WHERE year = ${currentYear}
    GROUP BY year, month
    ORDER BY year ASC, month ASC
  `;

  // Expense category breakdown (current year)
  const expenseCategories = await prisma.$queryRaw<
    Array<{ category: string; total: number }>
  >`
    SELECT 
      category,
      COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE date >= ${startOfYear}
      AND date < ${endOfYear}
    GROUP BY category
    ORDER BY total DESC
  `;

  // Top sale types (current year)
  const topSaleTypes = await prisma.$queryRaw<
    Array<{ sale_type: string; revenue: number }>
  >`
    SELECT 
      sale_type,
      COALESCE(SUM(amount), 0) as revenue
    FROM additional_sales
    WHERE date >= ${startOfYear}
      AND date < ${endOfYear}
    GROUP BY sale_type
    ORDER BY revenue DESC
  `;

  // Total expenses, additional sales, salaries (all-time/current year for quick KPIs)
  const totalExpensesAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfYear, lt: endOfYear } },
  });

  const totalAdditionalSalesAgg = await prisma.additionalSale.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfYear, lt: endOfYear } },
  });

  const totalSalariesAgg = await prisma.salarySlip.aggregate({
    _sum: { netSalary: true },
    where: { year: currentYear },
  });

  return NextResponse.json({
    monthly: monthlyData.map(
      (d: {
        month: string;
        revenue: number;
        bookings: number;
        nights: number;
      }) => ({
        month: d.month,
        revenue: Number(d.revenue),
        bookings: Number(d.bookings),
        nights: Number(d.nights),
      }),
    ),
    paymentStatus: paymentStatusData.map(
      (d: {
        paymentStatus: string;
        _count: { id: number };
        _sum: { totalAmount: any | null; balanceAmount: any | null };
      }) => ({
        status: d.paymentStatus,
        count: d._count.id,
        revenue: Number(d._sum.totalAmount || 0),
        outstanding: Number(d._sum.balanceAmount || 0),
      }),
    ),
    roomType: roomTypeData.map(
      (d: {
        roomType: string;
        _count: { id: number };
        _sum: { totalAmount: any | null; nightCount: number | null };
      }) => ({
        type: d.roomType,
        count: d._count.id,
        revenue: Number(d._sum.totalAmount || 0),
        nights: Number(d._sum.nightCount || 0),
      }),
    ),
    statusDistribution: statusData.map(
      (d: {
        status: string;
        _count: { id: number };
        _sum: { totalAmount: any | null };
      }) => ({
        status: d.status,
        count: d._count.id,
        revenue: Number(d._sum.totalAmount || 0),
      }),
    ),
    weeklyTrend: weeklyData.map(
      (d: { week: string; bookings: number; revenue: number }) => ({
        week: d.week,
        bookings: Number(d.bookings),
        revenue: Number(d.revenue),
      }),
    ),
    leadTime: leadTimeData.map((d: { bucket: string; count: number }) => ({
      bucket: d.bucket,
      count: Number(d.count),
    })),
    lastYearMonthly: lastYearMonthly.map(
      (d: { month: string; revenue: number }) => ({
        month: d.month,
        revenue: Number(d.revenue),
      }),
    ),
    topGuests: topGuests.map(
      (g: {
        guestFullName: string;
        guestEmail: string | null;
        _count: { id: number };
        _sum: { totalAmount: any | null; nightCount: number | null };
      }) => ({
        name: g.guestFullName,
        email: g.guestEmail,
        bookings: g._count.id,
        revenue: Number(g._sum.totalAmount || 0),
        nights: Number(g._sum.nightCount || 0),
      }),
    ),
    upcomingOccupancy: upcomingOccupancy.map(
      (d: { date: Date; rooms: number; guests: number; revenue: number }) => ({
        date: d.date.toISOString().split("T")[0],
        rooms: Number(d.rooms),
        guests: Number(d.guests),
        revenue: Number(d.revenue),
      }),
    ),
    monthlyExpenses: monthlyExpenses.map(
      (d: { month: string; total: number }) => ({
        month: d.month,
        total: Number(d.total),
      }),
    ),
    monthlyAdditionalSales: monthlyAdditionalSales.map(
      (d: { month: string; total: number }) => ({
        month: d.month,
        total: Number(d.total),
      }),
    ),
    monthlySalaries: monthlySalaries.map(
      (d: { month: string; total: number }) => ({
        month: d.month,
        total: Number(d.total),
      }),
    ),
    expenseCategories: expenseCategories.map(
      (d: { category: string; total: number }) => ({
        category: d.category,
        total: Number(d.total),
      }),
    ),
    topSaleTypes: topSaleTypes.map(
      (d: { sale_type: string; revenue: number }) => ({
        saleType: d.sale_type,
        revenue: Number(d.revenue),
      }),
    ),
    totals: {
      expenses: Number(totalExpensesAgg._sum?.amount || 0),
      additionalSales: Number(totalAdditionalSalesAgg._sum?.amount || 0),
      salaries: Number(totalSalariesAgg._sum?.netSalary || 0),
    },
  });
}
