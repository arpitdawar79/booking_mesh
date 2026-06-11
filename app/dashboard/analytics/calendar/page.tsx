"use client";

import {
  CalendarGrid,
  CalendarLegend,
  DayData,
  DayDetailDrawer,
  SummaryCards,
} from "@/components/analytics/calendar";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

export default function CalendarAnalyticsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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
    const startOffset = firstDay.getDay();
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

  function handleDayClick(day: DayData) {
    setSelectedDay(day);
    setIsDrawerOpen(true);
  }

  const maxRooms = Math.max(...(data?.days.map((d) => d.rooms) || [1]), 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl p-4 h-24 animate-pulse"
            />
          ))}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl h-96 animate-pulse" />
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
          Failed to load calendar data.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Occupancy Calendar
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium">
              Daily rooms, guests, and revenue breakdown.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={goPrevMonth}
            className="p-2 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/20 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 sm:px-4 py-2 rounded-xl border border-border bg-card font-bold min-w-[140px] sm:min-w-[160px] text-center text-sm shadow-sm">
            {MONTH_NAMES[month - 1]} {year}
          </div>
          <button
            onClick={goNextMonth}
            className="p-2 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/20 transition-all shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm font-bold hover:bg-secondary hover:border-primary/20 transition-all shadow-sm"
          >
            Today
          </button>
        </div>
      </motion.div>

      {data && (
        <SummaryCards summary={data.summary} daysInMonth={daysInMonth} />
      )}

      <CalendarGrid
        calendarGrid={calendarGrid}
        todayStr={todayStr}
        maxRooms={maxRooms}
        onDayClick={handleDayClick}
      />

      <CalendarLegend />

      <DayDetailDrawer
        day={selectedDay}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
