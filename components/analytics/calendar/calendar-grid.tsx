"use client";

import { motion } from "framer-motion";
import { DayCell, DayData } from "./day-cell";

interface CalendarGridProps {
  calendarGrid: (DayData | null)[];
  todayStr: string;
  maxRooms: number;
  onDayClick: (day: DayData) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  calendarGrid,
  todayStr,
  maxRooms,
  onDayClick,
}: CalendarGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border/60 overflow-hidden bg-card/10 backdrop-blur-xl"
    >
      <div className="grid grid-cols-7 bg-muted/30 border-b border-border/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1 py-2 sm:py-3 text-[10px] sm:text-xs font-bold text-muted-foreground/60 text-center uppercase tracking-widest"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarGrid.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[52px] sm:min-h-[120px] border-r border-b border-border/40 bg-muted/10"
              />
            );
          }

          const dayNum = parseInt(day.date.split("-")[2], 10);
          const isToday = day.date === todayStr;

          return (
            <DayCell
              key={day.date}
              day={day}
              dayNum={dayNum}
              isToday={isToday}
              maxRooms={maxRooms}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-primary/25 border border-primary/40" />
        <span>High (&gt;75%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-primary/15 border border-primary/25" />
        <span>Med (40-75%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-primary/8 border border-primary/15" />
        <span>Low (&lt;40%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-primary" />
        <span>Today</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-accent-foreground bg-accent/40 dark:bg-accent/20 px-1.5 py-0.5 rounded-md">
          +N
        </span>
        <span>Check-in</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold text-destructive bg-destructive/15 px-1.5 py-0.5 rounded-md">
          N out
        </span>
        <span>Check-out</span>
      </div>
    </div>
  );
}
