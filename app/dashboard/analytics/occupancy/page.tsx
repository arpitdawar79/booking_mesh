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
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl p-4 h-24 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl p-5 h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  if (!data || !occupancyMetrics)
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
            className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Occupancy Report
            </h1>
            <p className="text-sm text-muted-foreground/80 font-medium">
              Guest flow, room utilization, and upcoming projections.
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
      </motion.div>

      {/* Monthly Nights vs Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ChartCard title="Monthly Nights & Bookings" subtitle="Volume trends">
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
                  color: "var(--card-foreground)"
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar
                dataKey="nights"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                name="Nights"
              />
              <Bar
                dataKey="bookings"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
                name="Bookings"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Lead Time */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <ChartCard
          title="Booking Lead Time"
          subtitle="How far in advance guests book"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.leadTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)"
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Room Type Utilization */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ChartCard
          title="Room Type Utilization"
          subtitle="Nights sold by room type"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.roomType} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
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
                  color: "var(--card-foreground)"
                }}
                labelStyle={{ color: "var(--card-foreground)" }}
              />
              <Bar
                dataKey="nights"
                fill="var(--primary)"
                radius={[0, 4, 4, 0]}
                name="Nights"
              />
              <Bar
                dataKey="count"
                fill="var(--accent)"
                radius={[0, 4, 4, 0]}
                name="Bookings"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Upcoming Occupancy Projection */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <ChartCard
          title="Upcoming Occupancy Projection"
          subtitle="Next 90 days – weekly aggregates"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={upcomingByWeek}>
              <defs>
                <linearGradient id="roomsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="guestsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--card-foreground)"
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
                fill="url(#roomsGrad)"
                strokeWidth={2}
                name="Rooms"
              />
              <Area
                type="monotone"
                dataKey="guests"
                stroke="var(--accent)"
                fill="url(#guestsGrad)"
                strokeWidth={2}
                name="Guests"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Daily upcoming table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm"
      >
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Date
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Rooms
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Guests
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.upcomingOccupancy.slice(0, 20).map((row) => (
              <tr
                key={row.date}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground/60">
                  {row.date}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.rooms}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.guests}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(row.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative rounded-2xl border border-border bg-card p-3 sm:p-4 space-y-1 overflow-hidden group hover:border-primary/20 transition-all shadow-sm"
    >
      <div className="absolute -inset-px bg-linear-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
