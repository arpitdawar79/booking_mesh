"use client";

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
      <div className="text-muted-foreground">Loading revenue report...</div>
    );
  if (!data)
    return <div className="text-muted-foreground">Failed to load.</div>;

  const totalRevenue = data.monthly.reduce((s, d) => s + d.revenue, 0);
  const totalOutstanding = data.paymentStatus.reduce(
    (s, d) => s + d.outstanding,
    0,
  );
  const collected = totalRevenue - totalOutstanding;
  const collectionRate =
    totalRevenue > 0 ? (collected / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="p-2 -ml-2 rounded-md hover:bg-muted transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Revenue Report</h1>
            <p className="text-sm text-muted-foreground">
              Detailed revenue breakdown and collection status.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total Revenue" value={formatCurrency(totalRevenue)} />
        <Kpi label="Collected" value={formatCurrency(collected)} />
        <Kpi label="Outstanding" value={formatCurrency(totalOutstanding)} />
        <Kpi label="Collection Rate" value={`${collectionRate.toFixed(1)}%`} />
      </div>

      {/* Monthly Revenue Table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Month</th>
              <th className="text-right px-4 py-3 font-medium">Revenue</th>
              <th className="text-right px-4 py-3 font-medium">Bookings</th>
              <th className="text-right px-4 py-3 font-medium">Nights</th>
              <th className="text-right px-4 py-3 font-medium">Rev/Night</th>
              <th className="text-right px-4 py-3 font-medium">Rev/Booking</th>
              <th className="text-right px-4 py-3 font-medium">YoY Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {revenueTable.map((row) => (
              <tr key={row.month} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">
                  {formatMonth(row.month)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="px-4 py-3 text-right">{row.bookings}</td>
                <td className="px-4 py-3 text-right">{row.nights}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatCurrency(row.revPerNight)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatCurrency(row.revPerBooking)}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.change !== null ? (
                    <span
                      className={
                        row.change >= 0 ? "text-green-400" : "text-red-400"
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
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
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
      </div>

      {/* YoY Comparison */}
      <ChartCard
        title="Year-over-Year Revenue"
        subtitle="Current vs previous year"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={data.monthly.map((m) => {
              const ly = data.lastYearMonthly.find((l) => l.month === m.month);
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
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3 sm:p-4 space-y-1">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
        {label}
      </div>
      <div className="text-lg sm:text-xl font-bold">{value}</div>
    </div>
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
    <div className="rounded-xl border border-border p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
