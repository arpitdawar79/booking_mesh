"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { DashboardSkeleton } from "@/components/pwa/skeleton";
import { MagicCard } from "@/components/ui/magic-card";
import { cn, formatDate } from "@/lib/utils";
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
    <div className="space-y-4 lg:space-y-5">
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
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400"
            />
          }
          change={null}
          suffix="bookings"
          icon={
            <div className="p-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
              <IndianRupee className="w-4.5 h-4.5" />
            </div>
          }
        />
        <KpiCard
          label="Additional Sales"
          value={
            <NumberTicker
              value={totalAdditionalSales}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400"
            />
          }
          change={null}
          suffix="this year"
          icon={
            <div className="p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <ShoppingCart className="w-4.5 h-4.5" />
            </div>
          }
        />
        <KpiCard
          label="Total Expenses"
          value={
            <NumberTicker
              value={totalExpenses}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-700 dark:text-rose-400"
            />
          }
          change={null}
          suffix="this year"
          icon={
            <div className="p-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shrink-0">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          }
        />
        <KpiCard
          label="Net Profit / Loss"
          value={
            <NumberTicker
              value={netProfit}
              prefix="₹"
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                netProfit >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
            />
          }
          change={null}
          suffix={netProfit >= 0 ? "in profit" : "in loss"}
          icon={
            <div className={cn(
              "p-1.5 rounded-xl shrink-0 border",
              netProfit >= 0
                ? "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/10 dark:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
            )}>
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
          }
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
          icon={
            <div className="p-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
          }
          label="Total Bookings"
          value={
            <NumberTicker
              value={bookingStats?.counts.total || 0}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400"
            />
          }
          sub={`+${bookingStats?.counts.thisMonth || 0} this month`}
        />
        <StatCard
          icon={
            <div className="p-1.5 rounded-xl bg-teal-500/10 dark:bg-teal-500/10 border border-teal-500/20 dark:border-teal-500/20 text-teal-700 dark:text-teal-400 shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
          }
          label="Confirmed"
          value={
            <NumberTicker
              value={bookingStats?.counts.confirmed || 0}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-700 dark:text-teal-400"
            />
          }
          sub={`${bookingStats?.occupancy.totalNights || 0} nights booked`}
        />
        <StatCard
          icon={
            <div className="p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <Banknote className="w-4.5 h-4.5" />
            </div>
          }
          label="Salaries"
          value={
            <NumberTicker
              value={totalSalaries}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400"
            />
          }
          sub="payroll this year"
        />
        <StatCard
          icon={
            <div className="p-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shrink-0">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
          }
          label="Outstanding"
          value={
            <NumberTicker
              value={bookingStats?.revenue.outstanding || 0}
              prefix="₹"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-700 dark:text-rose-400"
            />
          }
          sub="to collect"
        />
      </motion.div>

      {/* Visual Pipeline Showcase */}
      {/* <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <WorkflowShowcase />
      </motion.div> */}

      {/* Upcoming Check-ins */}
      {bookingStats && bookingStats.upcomingCheckins.length > 0 && (
        <MagicCard className="p-3 sm:p-3.5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10 border border-primary/15">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Upcoming Check-ins
                </h2>
              </div>
              <Link
                href="/dashboard/bookings"
                className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {bookingStats.upcomingCheckins.map((u) => (
                <Link
                  key={u.id}
                  href={`/dashboard/booking/${u.id}`}
                  className="min-w-[160px] snap-start rounded-xl border border-border/40 bg-card/40 p-2.5 hover:bg-muted/20 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="text-[10px] font-bold text-primary mb-0.5">
                    {formatDate(u.checkInDate)}
                  </div>
                  <div className="font-semibold text-xs truncate">
                    {u.guestFullName}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
                    {u.nightCount} nights · ₹
                    {Number(u.totalAmount).toLocaleString("en-IN")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </MagicCard>
      )}

      {/* Modules Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xs font-bold mb-2.5 uppercase tracking-wider text-muted-foreground/60">
          Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ModuleCard
            href="/dashboard/bookings"
            icon={
              <div className="p-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                <ClipboardList className="w-4.5 h-4.5" />
              </div>
            }
            title="Bookings"
            description="Manage reservations, check-ins, and guest details."
          />
          <ModuleCard
            href="/dashboard/guests"
            icon={
              <div className="p-1.5 rounded-xl bg-teal-500/10 dark:bg-teal-500/10 border border-teal-500/20 dark:border-teal-500/20 text-teal-700 dark:text-teal-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
            }
            title="Guests"
            description="Guest directory and repeat visitor insights."
          />
          <ModuleCard
            href="/dashboard/expenses"
            icon={
              <div className="p-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                <Receipt className="w-4.5 h-4.5" />
              </div>
            }
            title="Expenses"
            description="Track operational costs and spending."
          />
          <ModuleCard
            href="/dashboard/additional-sales"
            icon={
              <div className="p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                <ShoppingCart className="w-4.5 h-4.5" />
              </div>
            }
            title="Additional Sales"
            description="Track restaurant, activity, and stay sales."
          />
          <ModuleCard
            href="/dashboard/salary"
            icon={
              <div className="p-1.5 rounded-xl bg-amber-600/10 dark:bg-amber-500/10 border border-amber-600/20 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                <Banknote className="w-4.5 h-4.5" />
              </div>
            }
            title="Salary & Payroll"
            description="Employee slips and payroll management."
          />
          <ModuleCard
            href="/dashboard/analytics"
            icon={
              <div className="p-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
            }
            title="Analytics"
            description="Deep dive into revenue, occupancy & P&L."
          />
        </div>
      </motion.div>

      {/* Top Guests */}
      {analytics && analytics.topGuests.length > 0 && (
        <MagicCard className="p-3 sm:p-3.5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10 border border-primary/15">
                  <Users className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Top Guests
                </h2>
              </div>
              <Link
                href="/dashboard/guests"
                className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {analytics.topGuests.slice(0, 5).map((g, i) => (
                <div
                  key={g.email || `${g.name}-${i}`}
                  className="flex items-center justify-between text-xs border-b border-border/30 py-1.5 last:border-0 hover:bg-muted/10 px-1.5 -mx-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">
                        {g.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 font-medium">
                        {g.bookings} bookings · {g.nights} nights
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-right shrink-0 text-primary text-xs">
                    {formatCurrency(g.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MagicCard>
      )}
    </div>
  );
}
