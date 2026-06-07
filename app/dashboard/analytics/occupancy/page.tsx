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
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

interface AnalyticsData {
  monthly: Array<{
    month: string;
    revenue: number;
    bookings: number;
    nights: number;
  }>;
  roomType: Array<{
    type: string;
    count: number;
    revenue: number;
    nights: number;
  }>;
  leadTime: Array<{ bucket: string; count: number }>;
  upcomingOccupancy: Array<{
    date: string;
    rooms: number;
    guests: number;
    revenue: number;
  }>;
  statusDistribution: Array<{ status: string; count: number; revenue: number }>;
}

export default function OccupancyReportPage() {
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

  const occupancyMetrics = useMemo(() => {
    if (!data) return null;
    const totalNights = data.monthly.reduce((s, d) => s + d.nights, 0);
    const totalBookings = data.monthly.reduce((s, d) => s + d.bookings, 0);
    const avgNights = totalBookings > 0 ? totalNights / totalBookings : 0;
    const avgGuests = data.upcomingOccupancy.reduce((s, d) => s + d.guests, 0);
    const totalRooms = data.roomType.reduce((s, d) => s + d.count, 0);
    return { totalNights, totalBookings, avgNights, avgGuests, totalRooms };
  }, [data]);

  // Bucket upcoming occupancy by week
  const upcomingByWeek = useMemo(() => {
    if (!data) return [];
    const buckets: Record<
      string,
      { week: string; rooms: number; guests: number; revenue: number }
    > = {};
    data.upcomingOccupancy.forEach((d) => {
      const date = new Date(d.date);
      const year = date.getFullYear();
      const week = Math.ceil(
        (date.getTime() - new Date(year, 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      );
      const key = `${year}-W${String(week).padStart(2, "0")}`;
      if (!buckets[key])
        buckets[key] = { week: key, rooms: 0, guests: 0, revenue: 0 };
      buckets[key].rooms += d.rooms;
      buckets[key].guests += d.guests;
      buckets[key].revenue += d.revenue;
    });
    return Object.values(buckets).slice(0, 12);
  }, [data]);

  if (loading)
    return (
      <div className="text-muted-foreground">Loading occupancy report...</div>
    );
  if (!data || !occupancyMetrics)
    return <div className="text-muted-foreground">Failed to load.</div>;

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
            <h1 className="text-2xl font-bold">Occupancy Report</h1>
            <p className="text-sm text-muted-foreground">
              Guest flow, room utilization, and upcoming projections.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Total Nights Booked"
          value={String(occupancyMetrics.totalNights)}
        />
        <Kpi
          label="Total Bookings"
          value={String(occupancyMetrics.totalBookings)}
        />
        <Kpi
          label="Avg Stay Length"
          value={`${occupancyMetrics.avgNights.toFixed(1)} nights`}
        />
        <Kpi
          label="Total Rooms Sold"
          value={String(occupancyMetrics.totalRooms)}
        />
      </div>

      {/* Monthly Nights vs Bookings */}
      <ChartCard title="Monthly Nights & Bookings" subtitle="Volume trends">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Bar
              dataKey="nights"
              fill="#14b8a6"
              radius={[4, 4, 0, 0]}
              name="Nights"
            />
            <Bar
              dataKey="bookings"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Bookings"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Lead Time */}
      <ChartCard
        title="Booking Lead Time"
        subtitle="How far in advance guests book"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.leadTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Room Type Utilization */}
      <ChartCard
        title="Room Type Utilization"
        subtitle="Nights sold by room type"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.roomType} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              horizontal={false}
            />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
            <YAxis
              dataKey="type"
              type="category"
              width={100}
              stroke="#94a3b8"
              fontSize={11}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
            />
            <Bar
              dataKey="nights"
              fill="#f59e0b"
              radius={[0, 4, 4, 0]}
              name="Nights"
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              name="Bookings"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Upcoming Occupancy Projection */}
      <ChartCard
        title="Upcoming Occupancy Projection"
        subtitle="Next 90 days – weekly aggregates"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={upcomingByWeek}>
            <defs>
              <linearGradient id="roomsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="guestsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
              formatter={(v: any, n: any) => [
                n === "revenue" ? formatCurrency(Number(v)) : v,
                n,
              ]}
            />
            <Area
              type="monotone"
              dataKey="rooms"
              stroke="#14b8a6"
              fill="url(#roomsGrad)"
              strokeWidth={2}
              name="Rooms"
            />
            <Area
              type="monotone"
              dataKey="guests"
              stroke="#3b82f6"
              fill="url(#guestsGrad)"
              strokeWidth={2}
              name="Guests"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Daily upcoming table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-right px-4 py-3 font-medium">Rooms</th>
              <th className="text-right px-4 py-3 font-medium">Guests</th>
              <th className="text-right px-4 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.upcomingOccupancy.slice(0, 20).map((row) => (
              <tr key={row.date} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{row.date}</td>
                <td className="px-4 py-3 text-right">{row.rooms}</td>
                <td className="px-4 py-3 text-right">{row.guests}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(row.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
