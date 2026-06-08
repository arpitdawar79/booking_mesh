"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate } from "@/lib/utils";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface BookingStats {
  counts: {
    total: number;
    confirmed: number;
    cancelled: number;
    thisMonth: number;
  };
  revenue: { total: number; outstanding: number };
  occupancy: { totalNights: number };
  upcomingCheckins: Array<{
    id: string;
    bookingId: string;
    guestFullName: string;
    checkInDate: string | Date;
    checkOutDate: string | Date;
    nightCount: number;
    totalAmount: number;
  }>;
}

interface AnalyticsData {
  monthly: Array<{
    month: string;
    revenue: number;
    bookings: number;
    nights: number;
  }>;
  totals: {
    expenses: number;
    additionalSales: number;
    salaries: number;
  };
  topGuests: Array<{
    name: string;
    email: string;
    bookings: number;
    revenue: number;
    nights: number;
  }>;
}

export default function DashboardPage() {
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings/stats").then((r) => r.json()),
      fetch("/api/analytics").then((r) => r.json()),
    ])
      .then(([statsData, analyticsData]) => {
        setBookingStats(statsData);
        setAnalytics(analyticsData);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  const totalRevenue =
    analytics?.monthly.reduce((s, d) => s + d.revenue, 0) || 0;
  const totalExpenses = analytics?.totals.expenses || 0;
  const totalAdditionalSales = analytics?.totals.additionalSales || 0;
  const totalSalaries = analytics?.totals.salaries || 0;
  const netProfit =
    totalRevenue + totalAdditionalSales - totalExpenses - totalSalaries;

  const formatCurrency = (v: number) =>
    `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quick summary across bookings, revenue, expenses, and payroll.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={null}
          suffix="bookings"
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
        />
        <KpiCard
          label="Additional Sales"
          value={formatCurrency(totalAdditionalSales)}
          change={null}
          suffix="this year"
          icon={<ShoppingCart className="w-5 h-5 text-orange-400" />}
        />
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={null}
          suffix="this year"
          icon={<Receipt className="w-5 h-5 text-rose-400" />}
        />
        <KpiCard
          label="Net Profit / Loss"
          value={formatCurrency(netProfit)}
          change={null}
          suffix={netProfit >= 0 ? "in profit" : "in loss"}
          icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
          accent={netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<CalendarCheck className="w-5 h-5 text-teal-400" />}
          label="Total Bookings"
          value={bookingStats?.counts.total || 0}
          sub={`+${bookingStats?.counts.thisMonth || 0} this month`}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Confirmed"
          value={bookingStats?.counts.confirmed || 0}
          sub={`${bookingStats?.occupancy.totalNights || 0} nights booked`}
        />
        <StatCard
          icon={<Banknote className="w-5 h-5 text-violet-400" />}
          label="Salaries"
          value={formatCurrency(totalSalaries)}
          sub="payroll this year"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
          label="Outstanding"
          value={formatCurrency(bookingStats?.revenue.outstanding || 0)}
          sub="to collect"
        />
      </div>

      {bookingStats && bookingStats.upcomingCheckins.length > 0 && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold">Upcoming Check-ins</h2>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs text-teal-400 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {bookingStats.upcomingCheckins.map((u) => (
              <Link
                key={u.id}
                href={`/dashboard/booking/${u.id}`}
                className="min-w-[180px] snap-start rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition"
              >
                <div className="text-xs text-muted-foreground">
                  {formatDate(u.checkInDate)}
                </div>
                <div className="font-medium text-sm truncate">
                  {u.guestFullName}
                </div>
                <div className="text-xs mt-1">
                  {u.nightCount} nights · ₹
                  {Number(u.totalAmount).toLocaleString("en-IN")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ModuleCard
            href="/dashboard/bookings"
            icon={<ClipboardList className="w-5 h-5 text-teal-400" />}
            title="Bookings"
            description="Manage reservations, check-ins, and guest details."
          />
          <ModuleCard
            href="/dashboard/guests"
            icon={<Users className="w-5 h-5 text-blue-400" />}
            title="Guests"
            description="Guest directory and repeat visitor insights."
          />
          <ModuleCard
            href="/dashboard/expenses"
            icon={<Receipt className="w-5 h-5 text-rose-400" />}
            title="Expenses"
            description="Track operational costs and spending."
          />
          <ModuleCard
            href="/dashboard/additional-sales"
            icon={<ShoppingCart className="w-5 h-5 text-orange-400" />}
            title="Additional Sales"
            description="Track restaurant, activity, and stay sales."
          />
          <ModuleCard
            href="/dashboard/salary"
            icon={<Banknote className="w-5 h-5 text-violet-400" />}
            title="Salary & Payroll"
            description="Employee slips and payroll management."
          />
          <ModuleCard
            href="/dashboard/analytics"
            icon={<BarChart3 className="w-5 h-5 text-emerald-400" />}
            title="Analytics"
            description="Deep dive into revenue, occupancy & P&L."
          />
        </div>
      </div>

      {analytics && analytics.topGuests.length > 0 && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top Guests</h2>
            <Link
              href="/dashboard/guests"
              className="text-xs text-teal-400 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {analytics.topGuests.slice(0, 5).map((g, i) => (
              <div
                key={g.email}
                className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{g.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.bookings} bookings · {g.nights} nights
                    </div>
                  </div>
                </div>
                <div className="font-medium text-right shrink-0">
                  {formatCurrency(g.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
