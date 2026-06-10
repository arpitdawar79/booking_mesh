"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { DashboardSkeleton } from "@/components/pwa/skeleton";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  Receipt,
  ShoppingCart,
  TrendingUp,
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
    return <DashboardSkeleton />;
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
    <div className="space-y-6 lg:space-y-8">
      {/* Header with TextReveal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-muted-foreground/80 mt-1.5 font-medium">
          Quick summary across bookings, revenue, expenses, and payroll.
        </p>
      </motion.div>

      {/* KPI Row with NumberTicker */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <KpiCard
          label="Total Revenue"
          value={
            <NumberTicker
              value={totalRevenue}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400"
            />
          }
          change={null}
          suffix="bookings"
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
        />
        <KpiCard
          label="Additional Sales"
          value={
            <NumberTicker
              value={totalAdditionalSales}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-orange-400"
            />
          }
          change={null}
          suffix="this year"
          icon={<ShoppingCart className="w-5 h-5 text-orange-400" />}
        />
        <KpiCard
          label="Total Expenses"
          value={
            <NumberTicker
              value={totalExpenses}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-400"
            />
          }
          change={null}
          suffix="this year"
          icon={<Receipt className="w-5 h-5 text-rose-400" />}
        />
        <KpiCard
          label="Net Profit / Loss"
          value={
            <NumberTicker
              value={netProfit}
              prefix="₹"
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            />
          }
          change={null}
          suffix={netProfit >= 0 ? "in profit" : "in loss"}
          icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
          accent={netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
        />
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard
          icon={<CalendarCheck className="w-5 h-5 text-teal-400" />}
          label="Total Bookings"
          value={
            <NumberTicker
              value={bookingStats?.counts.total || 0}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            />
          }
          sub={`+${bookingStats?.counts.thisMonth || 0} this month`}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Confirmed"
          value={
            <NumberTicker
              value={bookingStats?.counts.confirmed || 0}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            />
          }
          sub={`${bookingStats?.occupancy.totalNights || 0} nights booked`}
        />
        <StatCard
          icon={<Banknote className="w-5 h-5 text-violet-400" />}
          label="Salaries"
          value={
            <NumberTicker
              value={totalSalaries}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            />
          }
          sub="payroll this year"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
          label="Outstanding"
          value={
            <NumberTicker
              value={bookingStats?.revenue.outstanding || 0}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            />
          }
          sub="to collect"
        />
      </motion.div>

      {/* Upcoming Check-ins */}
      {bookingStats && bookingStats.upcomingCheckins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-3 sm:p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/15">
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              <h2 className="text-sm font-bold">Upcoming Check-ins</h2>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {bookingStats.upcomingCheckins.map((u) => (
              <Link
                key={u.id}
                href={`/dashboard/booking/${u.id}`}
                className="min-w-[180px] snap-start rounded-xl border border-border/50 bg-muted/10 p-3 hover:bg-muted/30 hover:border-teal-500/20 transition-all duration-300"
              >
                <div className="text-[11px] font-medium text-teal-400 mb-1">
                  {formatDate(u.checkInDate)}
                </div>
                <div className="font-semibold text-sm truncate">
                  {u.guestFullName}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-1 font-medium">
                  {u.nightCount} nights · ₹
                  {Number(u.totalAmount).toLocaleString("en-IN")}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modules Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground/60">
          Modules
        </h2>
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
      </motion.div>

      {/* Top Guests */}
      {analytics && analytics.topGuests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-3 sm:p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/15">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <h2 className="text-sm font-bold">Top Guests</h2>
            </div>
            <Link
              href="/dashboard/guests"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {analytics.topGuests.slice(0, 5).map((g, i) => (
              <motion.div
                key={g.email || `${g.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex items-center justify-between text-sm border-b border-border/40 py-2.5 last:border-0 hover:bg-muted/10 px-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {g.name}
                    </div>
                    <div className="text-xs text-muted-foreground/70 font-medium">
                      {g.bookings} bookings · {g.nights} nights
                    </div>
                  </div>
                </div>
                <div className="font-bold text-right shrink-0 text-emerald-400 text-sm">
                  {formatCurrency(g.revenue)}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
