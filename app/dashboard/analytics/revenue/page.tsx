"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#14b8a6",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

interface AnalyticsData {
  monthly: Array<{
    month: string;
    revenue: number;
    bookings: number;
    nights: number;
  }>;
  paymentStatus: Array<{
    status: string;
    count: number;
    revenue: number;
    outstanding: number;
  }>;
  roomType: Array<{
    type: string;
    count: number;
    revenue: number;
    nights: number;
  }>;
  weeklyTrend: Array<{ week: string; bookings: number; revenue: number }>;
  lastYearMonthly: Array<{ month: string; revenue: number }>;
  topGuests: Array<{
    name: string;
    email: string;
    bookings: number;
    revenue: number;
    nights: number;
  }>;
  monthlyExpenses: Array<{ month: string; total: number }>;
  monthlyAdditionalSales: Array<{
    month: string;
    total: number;
  }>;
  monthlySalaries: Array<{ month: string; total: number }>;
  expenseCategories: Array<{ category: string; total: number }>;
  topSaleTypes: Array<{
    saleType: string;
    revenue: number;
  }>;
  totals: {
    expenses: number;
    additionalSales: number;
    salaries: number;
  };
}

export default function RevenueReportPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatCurrency = (v: number) => `₹${v.toLocaleString("en-IN")}`;
  const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    return `${month}/${year.slice(2)}`;
  };

  const revenueTable = useMemo(() => {
    if (!data) return [];
    return data.monthly.map((m) => {
      const ly = data.lastYearMonthly.find((l) => l.month === m.month);
      const change =
        ly && ly.revenue > 0
          ? ((m.revenue - ly.revenue) / ly.revenue) * 100
          : null;
      const revPerNight = m.nights > 0 ? m.revenue / m.nights : 0;
      const revPerBooking = m.bookings > 0 ? m.revenue / m.bookings : 0;
      return { ...m, change, revPerNight, revPerBooking };
    });
  }, [data]);

  if (loading)
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl p-4 h-24 animate-pulse"
            />
          ))}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl h-64 animate-pulse" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  if (!data)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-10 text-center"
      >
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm text-muted-foreground font-medium">
          Failed to load.
        </p>
      </motion.div>
    );

  const totalRevenue = data.monthly.reduce((s, d) => s + d.revenue, 0);
  const totalOutstanding = data.paymentStatus.reduce(
    (s, d) => s + d.outstanding,
    0,
  );
  const collected = totalRevenue - totalOutstanding;
  const collectionRate =
    totalRevenue > 0 ? (collected / totalRevenue) * 100 : 0;

  const totalAdditionalSales = data.totals.additionalSales;
  const totalExpenses = data.totals.expenses;
  const totalSalaries = data.totals.salaries;
  const netProfit =
    totalRevenue + totalAdditionalSales - totalExpenses - totalSalaries;

  // Build unified P&L by month
  const allMonths = new Set<string>();
  data.monthly.forEach((d) => allMonths.add(d.month));
  data.monthlyExpenses.forEach((d) => allMonths.add(d.month));
  data.monthlyAdditionalSales.forEach((d) => allMonths.add(d.month));
  data.monthlySalaries.forEach((d) => allMonths.add(d.month));
  const pnlTable = Array.from(allMonths)
    .sort()
    .map((month) => {
      const rev = data.monthly.find((d) => d.month === month)?.revenue || 0;
      const rs =
        data.monthlyAdditionalSales.find((d) => d.month === month)?.total || 0;
      const exp =
        data.monthlyExpenses.find((d) => d.month === month)?.total || 0;
      const sal =
        data.monthlySalaries.find((d) => d.month === month)?.total || 0;
      return {
        month,
        revenue: rev,
        additionalSales: rs,
        expenses: exp,
        salaries: sal,
        net: rev + rs - exp - sal,
      };
    });

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="p-2 -ml-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Revenue Report
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              Detailed revenue breakdown and collection status.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <Kpi label="Total Revenue" value={formatCurrency(totalRevenue)} />
        <Kpi label="Collected" value={formatCurrency(collected)} />
        <Kpi label="Outstanding" value={formatCurrency(totalOutstanding)} />
        <Kpi label="Collection Rate" value={`${collectionRate.toFixed(1)}%`} />
      </motion.div>

      {/* Business KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <Kpi
          label="Additional Sales"
          value={formatCurrency(totalAdditionalSales)}
        />
        <Kpi label="Total Expenses" value={formatCurrency(totalExpenses)} />
        <Kpi label="Salaries" value={formatCurrency(totalSalaries)} />
        <Kpi label="Net Profit" value={formatCurrency(netProfit)} />
      </motion.div>

      {/* Monthly Revenue Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl overflow-x-auto"
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Month
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Revenue
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Bookings
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Nights
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Rev/Night
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Rev/Booking
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                YoY Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {revenueTable.map((row) => (
              <tr
                key={row.month}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground/60">
                  {formatMonth(row.month)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.bookings}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.nights}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground/70">
                  {formatCurrency(row.revPerNight)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground/70">
                  {formatCurrency(row.revPerBooking)}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.change !== null ? (
                    <span
                      className={
                        row.change >= 0
                          ? "text-emerald-400 font-bold"
                          : "text-rose-400 font-bold"
                      }
                    >
                      {row.change >= 0 ? "+" : ""}
                      {row.change.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid md:grid-cols-2 gap-4 lg:gap-6"
      >
        <ChartCard
          title="Revenue by Room Type"
          subtitle="Share of total revenue"
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.roomType}
                dataKey="revenue"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                label={(d: any) =>
                  `${d.type}: ${formatCurrency(Number(d.revenue))}`
                }
              >
                {data.roomType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Status" subtitle="Outstanding vs collected">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.paymentStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="status" stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Bar
                dataKey="revenue"
                fill="#14b8a6"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
              <Bar
                dataKey="outstanding"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name="Outstanding"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* P&L Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl overflow-x-auto"
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Month
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Revenue
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Additional
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Total In
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Expenses
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Salaries
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Total Out
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {pnlTable.map((row) => (
              <tr
                key={row.month}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground/60">
                  {formatMonth(row.month)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(row.additionalSales)}
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  {formatCurrency(row.revenue + row.additionalSales)}
                </td>
                <td className="px-4 py-3 text-right text-rose-400 font-medium">
                  {formatCurrency(row.expenses)}
                </td>
                <td className="px-4 py-3 text-right text-rose-400 font-medium">
                  {formatCurrency(row.salaries)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-rose-400">
                  {formatCurrency(row.expenses + row.salaries)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-bold ${row.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {formatCurrency(row.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* YoY Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <ChartCard
          title="Year-over-Year Revenue"
          subtitle="Current vs previous year"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={data.monthly.map((m) => {
                const ly = data.lastYearMonthly.find(
                  (l) => l.month === m.month,
                );
                return {
                  month: m.month,
                  current: m.revenue,
                  lastYear: ly?.revenue || 0,
                };
              })}
            >
              <defs>
                <linearGradient id="curGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="#94a3b8"
                fontSize={12}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#14b8a6"
                fill="url(#curGrad)"
                strokeWidth={2}
                name="This Year"
              />
              <Area
                type="monotone"
                dataKey="lastYear"
                stroke="#94a3b8"
                fill="url(#lyGrad)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Last Year"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-3 sm:p-4 space-y-1 overflow-hidden group hover:border-teal-500/20 transition-colors"
    >
      <div className="absolute -inset-px bg-linear-to-br from-teal-500/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
          {label}
        </div>
        <div className="text-lg sm:text-xl font-black tracking-tight">
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/15 backdrop-blur-xl p-4 sm:p-5 space-y-4 hover:border-teal-500/10 transition-colors">
      <div>
        <h3 className="font-bold text-sm sm:text-base">{title}</h3>
        <p className="text-xs text-muted-foreground/70 font-medium">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}
