"use client";

import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const COLORS = [
  "#2c4a3f", // deep spruce sage
  "#e2c29d", // champagne gold / brass
  "#8f7a66", // warm taupe
  "#5c7f70", // lighter sage
  "#c86b5c", // terracotta / rust
  "#a39274", // clay / olive
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
  statusDistribution: Array<{ status: string; count: number; revenue: number }>;
  weeklyTrend: Array<{ week: string; bookings: number; revenue: number }>;
  leadTime: Array<{ bucket: string; count: number }>;
  lastYearMonthly: Array<{ month: string; revenue: number }>;
  topGuests: Array<{
    name: string;
    email: string;
    bookings: number;
    revenue: number;
    nights: number;
  }>;
  upcomingOccupancy: Array<{
    date: string;
    rooms: number;
    guests: number;
    revenue: number;
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

export default function AnalyticsPage() {
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl p-5 space-y-3 h-28 animate-pulse"
            />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl p-5 h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-10 text-center"
      >
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm text-muted-foreground font-medium">
          Failed to load analytics.
        </p>
      </motion.div>
    );
  }

  const totalRevenue = data.monthly.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = data.monthly.reduce((s, d) => s + d.bookings, 0);
  const totalNights = data.monthly.reduce((s, d) => s + d.nights, 0);
  const avgNights =
    totalBookings > 0 ? (totalNights / totalBookings).toFixed(1) : "0";
  const outstandingTotal = data.paymentStatus.reduce(
    (s, d) => s + d.outstanding,
    0,
  );

  // Revenue vs last year comparison
  const currentRev = totalRevenue;
  const lastYearRev = data.lastYearMonthly.reduce((s, d) => s + d.revenue, 0);
  const revChange =
    lastYearRev > 0 ? ((currentRev - lastYearRev) / lastYearRev) * 100 : 0;

  const totalExpenses = data.totals.expenses;
  const totalAdditionalSales = data.totals.additionalSales;
  const totalSalaries = data.totals.salaries;
  const netProfit =
    totalRevenue + totalAdditionalSales - totalExpenses - totalSalaries;

  // Build unified P&L by month
  const allMonths = new Set<string>();
  data.monthly.forEach((d) => allMonths.add(d.month));
  data.monthlyExpenses.forEach((d) => allMonths.add(d.month));
  data.monthlyAdditionalSales.forEach((d) => allMonths.add(d.month));
  data.monthlySalaries.forEach((d) => allMonths.add(d.month));
  const pnlData = Array.from(allMonths)
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

  const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    return `${month}/${year.slice(2)}`;
  };

  const formatWeek = (w: string) => {
    const parts = w.split("-");
    return `W${parts[1]}`;
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5 font-medium">
            Insights into bookings, revenue, and occupancy.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/dashboard/analytics/revenue"
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-secondary hover:border-primary/20 transition-all shadow-sm"
          >
            Revenue Report →
          </Link>
          <Link
            href="/dashboard/analytics/occupancy"
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-secondary hover:border-primary/20 transition-all shadow-sm"
          >
            Occupancy Report →
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={revChange}
          suffix="vs last year"
        />
        <KpiCard
          label="Total Bookings"
          value={String(totalBookings)}
          change={null}
          suffix="this year"
        />
        <KpiCard
          label="Avg Stay"
          value={`${avgNights} nights`}
          change={null}
          suffix="per booking"
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(outstandingTotal)}
          change={null}
          suffix="to collect"
        />
      </motion.div>

      {/* Business KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <KpiCard
          label="Additional Sales"
          value={formatCurrency(totalAdditionalSales)}
          change={null}
          suffix="this year"
        />
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={null}
          suffix="this year"
        />
        <KpiCard
          label="Salaries"
          value={formatCurrency(totalSalaries)}
          change={null}
          suffix="this year"
        />
        <KpiCard
          label="Net Profit"
          value={formatCurrency(netProfit)}
          change={null}
          suffix={netProfit >= 0 ? "in profit" : "in loss"}
        />
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
      >
        <ChartCard title="Monthly Revenue" subtitle="Revenue trend this year">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthly}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                fill="url(#revGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Bookings vs Nights" subtitle="Volume trend">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar
                dataKey="bookings"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="nights"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"
      >
        <ChartCard title="Payment Status" subtitle="Booking distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.paymentStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {data.paymentStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {data.paymentStatus.map((d, i) => (
              <div key={d.status} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground">{d.status}</span>
                <span className="font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Room Type Breakdown" subtitle="By revenue">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.roomType} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis
                dataKey="type"
                type="category"
                width={100}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
              <Bar
                dataKey="revenue"
                fill="var(--primary)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Booking Lead Time"
          subtitle="Days between booking & check-in"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.leadTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="bucket"
                stroke="var(--muted-foreground)"
                fontSize={11}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Business Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
      >
        <ChartCard
          title="P&L Overview"
          subtitle="Revenue vs Expenses & Salaries"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                formatter={(v: any, n: any) => [formatCurrency(Number(v)), n]}
              />
              <Bar
                dataKey="revenue"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
              <Bar
                dataKey="additionalSales"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
                name="Additional"
              />
              <Bar
                dataKey="expenses"
                fill="#b24a37"
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
              <Bar
                dataKey="salaries"
                fill="#8f7a66"
                radius={[4, 4, 0, 0]}
                name="Salaries"
              />
              <Bar
                dataKey="net"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                name="Net"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown" subtitle="By category this year">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.expenseCategories}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {data.expenseCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                formatter={(v: any) => formatCurrency(Number(v))}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {data.expenseCategories.map((d, i) => (
              <div
                key={d.category}
                className="flex items-center gap-1.5 text-xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-muted-foreground">{d.category}</span>
                <span className="font-medium">{formatCurrency(d.total)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </motion.div>

      {data.topSaleTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
        >
          <ChartCard
            title="Additional Sales Trend"
            subtitle="Monthly sales this year"
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.monthlyAdditionalSales}>
                <defs>
                  <linearGradient id="rsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--card-foreground)",
                  }}
                  labelStyle={{ color: "var(--card-foreground)" }}
                  formatter={(v: any) => formatCurrency(Number(v))}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--primary)"
                  fill="url(#rsGrad)"
                  strokeWidth={2}
                  name="Sales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sale Types" subtitle="By revenue this year">
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {data.topSaleTypes.map((item, i) => (
                <div
                  key={item.saleType}
                  className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate capitalize">
                        {item.saleType.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-right shrink-0">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </motion.div>
      )}

      {/* Charts Row 3 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
      >
        <ChartCard title="Weekly Booking Trend" subtitle="Last 12 weeks">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeek}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                formatter={(v: any, n: any) => [
                  n === "revenue" ? formatCurrency(Number(v)) : v,
                  n,
                ]}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                yAxisId={1}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Guests" subtitle="By lifetime revenue">
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {data.topGuests.map((g, i) => (
              <div
                key={g.email ?? i}
                className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
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
        </ChartCard>
      </motion.div>

      {/* Upcoming Occupancy */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
      >
        <ChartCard
          title="Upcoming Occupancy (Next 90 Days)"
          subtitle="Projected check-ins"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.upcomingOccupancy}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                fontSize={11}
                interval={6}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
                formatter={(v: any, n: any) => [
                  n === "revenue" ? formatCurrency(Number(v)) : v,
                  n,
                ]}
              />
              <Area
                type="monotone"
                dataKey="rooms"
                stroke="var(--primary)"
                fill="url(#occGrad)"
                strokeWidth={2}
                name="Rooms"
              />
              <Line
                type="monotone"
                dataKey="guests"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                name="Guests"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  suffix,
}: {
  label: string;
  value: string;
  change: number | null;
  suffix: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-2 overflow-hidden shadow-sm group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="absolute -inset-px bg-linear-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
          {label}
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight">
          {value}
        </div>
        {change !== null && (
          <div className="flex items-center gap-1.5 text-xs font-semibold pt-1">
            {change > 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />+{change.toFixed(1)}%
              </span>
            ) : change < 0 ? (
              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30 border border-red-200/50 dark:border-red-500/10 px-2.5 py-0.5 rounded-full">
                <TrendingDown className="w-3.5 h-3.5" />
                {change.toFixed(1)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                <Minus className="w-3.5 h-3.5" />
                0%
              </span>
            )}
            <span className="text-muted-foreground/70 font-medium ml-0.5">
              {suffix}
            </span>
          </div>
        )}
        {change === null && (
          <div className="text-xs text-muted-foreground/70 font-medium">
            {suffix}
          </div>
        )}
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
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 hover:border-primary/20 transition-all shadow-sm">
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
