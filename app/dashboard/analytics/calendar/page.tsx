"use client";

import {
    ArrowLeft,
    BedDouble,
    ChevronLeft,
    ChevronRight,
    DoorOpen,
    IndianRupee,
    LogOutIcon,
    Receipt,
    ShoppingCart,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface DayData {
  date: string;
  rooms: number;
  guests: number;
  revenue: number;
  bookings: number;
  checkins: number;
  checkinrevenue: number;
  checkouts: number;
}

interface CalendarResponse {
  year: number;
  month: number;
  days: DayData[];
  summary: {
    totalRooms: number;
    totalGuests: number;
    totalRevenue: number;
    totalCheckins: number;
    totalCheckouts: number;
    avgRooms: number;
    avgRevenue: number;
    totalAdditionalSales: number;
    totalExpenses: number;
  };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarAnalyticsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/calendar?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month]);

  const calendarGrid = useMemo(() => {
    if (!data) return [];

    const firstDay = new Date(year, month - 1, 1);
    const startOffset = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month, 0).getDate();

    const grid: (DayData | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = data.days.find((d) => {
        const parts = d.date.split("-");
        return parseInt(parts[2], 10) === i;
      });
      grid.push(dayData || null);
    }
    return grid;
  }, [data, year, month]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  function goPrevMonth() {
    setCurrentDate(new Date(year, month - 2, 1));
  }

  function goNextMonth() {
    setCurrentDate(new Date(year, month, 1));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function formatCurrency(v: number) {
    return `\u20b9${Math.round(v).toLocaleString("en-IN")}`;
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading calendar...</div>;
  }

  if (!data) {
    return (
      <div className="text-muted-foreground">Failed to load calendar data.</div>
    );
  }

  const maxRooms = Math.max(...data.days.map((d) => d.rooms), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="p-2 -ml-2 rounded-md hover:bg-muted transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Occupancy Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Daily rooms, guests, and revenue breakdown.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevMonth}
            className="p-2 rounded-md border border-border hover:bg-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 rounded-md border border-border font-semibold min-w-[160px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </div>
          <button
            onClick={goNextMonth}
            className="p-2 rounded-md border border-border hover:bg-muted transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard
          icon={<BedDouble className="w-4 h-4 text-teal-400" />}
          label="Avg Rooms/Night"
          value={data.summary.avgRooms.toFixed(1)}
          sub={`Total: ${data.summary.totalRooms}`}
        />
        <SummaryCard
          icon={<Users className="w-4 h-4 text-blue-400" />}
          label="Total Guests"
          value={data.summary.totalGuests.toLocaleString("en-IN")}
          sub="For the month"
        />
        <SummaryCard
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          label="Avg Revenue/Night"
          value={formatCurrency(data.summary.avgRevenue)}
          sub={`Total: ${formatCurrency(data.summary.totalRevenue)}`}
        />
        <SummaryCard
          icon={<DoorOpen className="w-4 h-4 text-amber-400" />}
          label="Check-ins"
          value={String(data.summary.totalCheckins)}
          sub={`Check-outs: ${data.summary.totalCheckouts}`}
        />
        <SummaryCard
          icon={<ShoppingCart className="w-4 h-4 text-violet-400" />}
          label="Additional Sales"
          value={formatCurrency(data.summary.totalAdditionalSales)}
          sub="For the month"
        />
        <SummaryCard
          icon={<Receipt className="w-4 h-4 text-rose-400" />}
          label="Expenses"
          value={formatCurrency(data.summary.totalExpenses)}
          sub="For the month"
        />
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-1 py-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground text-center uppercase tracking-wide"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarGrid.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[70px] sm:min-h-[120px] border-r border-b border-border bg-muted/20 last:border-r-0"
                />
              );
            }

            const dayNum = parseInt(day.date.split("-")[2], 10);
            const isToday = day.date === todayStr;
            const occupancyRatio = day.rooms / maxRooms;
            const occupancyColor =
              day.rooms === 0
                ? "bg-transparent"
                : occupancyRatio > 0.75
                  ? "bg-teal-500/20"
                  : occupancyRatio > 0.4
                    ? "bg-teal-500/10"
                    : "bg-teal-500/5";

            return (
              <div
                key={day.date}
                className={`min-h-[70px] sm:min-h-[120px] border-r border-b border-border p-1 sm:p-2 flex flex-col gap-0.5 sm:gap-1 transition hover:bg-muted/30 ${occupancyColor} ${isToday ? "ring-1 ring-inset ring-teal-500" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-teal-500 text-white" : ""
                    }`}
                  >
                    {dayNum}
                  </span>
                  {day.checkins > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                      +{day.checkins}
                    </span>
                  )}
                </div>

                {day.rooms > 0 && (
                  <div className="mt-auto space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <BedDouble className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                      <span className="font-medium">{day.rooms}</span>
                      <span className="text-muted-foreground text-[9px] sm:text-[10px] hidden sm:inline">
                        {day.rooms === 1 ? "room" : "rooms"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                      <span className="font-medium">{day.guests}</span>
                      <span className="text-muted-foreground text-[9px] sm:text-[10px] hidden sm:inline">
                        {day.guests === 1 ? "guest" : "guests"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <IndianRupee className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                      <span className="font-medium text-emerald-400">
                        {formatCurrency(day.revenue)}
                      </span>
                    </div>
                    {day.checkouts > 0 && (
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                        <LogOutIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{day.checkouts} out</span>
                      </div>
                    )}
                  </div>
                )}

                {day.rooms === 0 && (
                  <div className="mt-auto text-[9px] sm:text-[10px] text-muted-foreground italic hidden sm:block">
                    No bookings
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-teal-500/20 border border-teal-500/30" />
          <span>High (&gt;75%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-teal-500/10 border border-teal-500/20" />
          <span>Med (40-75%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-teal-500/5 border border-teal-500/10" />
          <span>Low (&lt;40%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-teal-500" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] sm:text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
            +N
          </span>
          <span>Check-ins</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3 sm:p-4 space-y-1 sm:space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <div className="text-lg sm:text-xl font-bold">{value}</div>
      <div className="text-[10px] sm:text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
