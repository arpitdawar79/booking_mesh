"use client";

import { useHaptic } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    isAfter,
    isBefore,
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface CalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  placeholder?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function getCalendarDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

function CalendarPopover({
  value,
  onChange,
  minDate,
  maxDate,
  rangeStart,
  rangeEnd,
  onClose,
  anchorRef,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [viewMonth, setViewMonth] = useState(value || new Date());
  const [direction, setDirection] = useState(0);
  const haptic = useHaptic();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && isSameMonth(value, viewMonth)) return;
    if (value) setViewMonth(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, anchorRef]);

  const days = getCalendarDays(viewMonth);
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function goPrev() {
    setDirection(-1);
    setViewMonth((m) => subMonths(m, 1));
    haptic("light");
  }

  function goNext() {
    setDirection(1);
    setViewMonth((m) => addMonths(m, 1));
    haptic("light");
  }

  function isDisabled(day: Date) {
    if (minDate && isBefore(day, minDate) && !isSameDay(day, minDate))
      return true;
    if (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate))
      return true;
    return false;
  }

  function isInRange(day: Date) {
    if (!rangeStart || !rangeEnd) return false;
    return (
      (isAfter(day, rangeStart) || isSameDay(day, rangeStart)) &&
      (isBefore(day, rangeEnd) || isSameDay(day, rangeEnd))
    );
  }

  function isRangeStart(day: Date) {
    return rangeStart && isSameDay(day, rangeStart);
  }

  function isRangeEnd(day: Date) {
    return rangeEnd && isSameDay(day, rangeEnd);
  }

  const monthVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#171717] shadow-[0_32px_80px_rgba(0,0,0,0.55)] overflow-hidden"
      style={{ minWidth: 280 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={goPrev}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.span
            key={format(viewMonth, "MMMM yyyy")}
            custom={direction}
            variants={monthVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="text-sm font-bold text-foreground tabular-nums"
          >
            {format(viewMonth, "MMMM yyyy")}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={goNext}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 pb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 py-1.5"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="px-3 pb-3">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={format(viewMonth, "yyyy-MM")}
            custom={direction}
            variants={monthVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="grid grid-cols-7 gap-y-0.5"
          >
            {days.map((day) => {
              const disabled = isDisabled(day);
              const selected = value && isSameDay(day, value);
              const inRange = isInRange(day);
              const rangeStartDay = isRangeStart(day);
              const rangeEndDay = isRangeEnd(day);
              const today = isToday(day);
              const outsideMonth = !isSameMonth(day, viewMonth);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(day);
                    haptic("medium");
                    onClose();
                  }}
                  className={cn(
                    "relative h-9 w-full flex items-center justify-center text-[13px] font-medium rounded-full transition-all duration-200",
                    disabled &&
                      "text-muted-foreground/20 cursor-not-allowed line-through",
                    outsideMonth && !disabled && "text-muted-foreground/30",
                    !disabled &&
                      !outsideMonth &&
                      !selected &&
                      !rangeStartDay &&
                      !rangeEndDay &&
                      !inRange &&
                      "text-foreground hover:bg-white/8",
                    today &&
                      !selected &&
                      !rangeStartDay &&
                      !rangeEndDay &&
                      "text-sky-400 font-bold",
                    inRange &&
                      !rangeStartDay &&
                      !rangeEndDay &&
                      "bg-white/5 text-foreground rounded-none",
                    (rangeStartDay || rangeEndDay) &&
                      "bg-teal-500 text-background font-bold shadow-[0_0_16px_-4px_rgba(20,184,166,0.5)]",
                    selected &&
                      !rangeStartDay &&
                      !rangeEndDay &&
                      "bg-white text-background font-bold shadow-[0_0_16px_-4px_rgba(255,255,255,0.2)]",
                  )}
                  style={{
                    borderRadius:
                      rangeStartDay &&
                      rangeEndDay &&
                      !isSameDay(day, rangeStart as Date)
                        ? undefined
                        : rangeStartDay
                          ? "9999px 0 0 9999px"
                          : rangeEndDay
                            ? "0 9999px 9999px 0"
                            : inRange
                              ? 0
                              : undefined,
                  }}
                >
                  {format(day, "d")}
                  {today && !selected && !rangeStartDay && !rangeEndDay && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  rangeStart,
  rangeEnd,
  placeholder = "Pick a date",
  label,
  icon: Icon,
}: CalendarProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const haptic = useHaptic();

  const displayValue = value ? format(value, "yyyy-MM-dd") : "";
  const EffectiveIcon = Icon || CalendarDays;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </label>
      )}
      <div ref={anchorRef} className="relative flex items-center">
        <EffectiveIcon
          className={cn(
            "absolute left-4 w-4.5 h-4.5 transition-colors duration-300 pointer-events-none z-10",
            open ? "text-teal-400" : "text-muted-foreground/35",
          )}
        />
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            haptic("light");
          }}
          className={cn(
            "w-full rounded-2xl border bg-[#0c0c0c]/90 pl-12 pr-4 py-3.5 text-sm font-medium text-left transition-all duration-300 focus:outline-none",
            open
              ? "border-teal-500/40 shadow-[0_0_24px_-6px_rgba(20,184,166,0.2)] ring-1 ring-teal-500/15"
              : "border-white/[0.07] hover:border-white/15",
            !value && "text-muted-foreground/45",
            value && "text-foreground",
          )}
        >
          {displayValue || placeholder}
        </button>

        <AnimatePresence>
          {open && (
            <CalendarPopover
              value={value}
              onChange={(d) => {
                onChange(d);
                setOpen(false);
              }}
              minDate={minDate}
              maxDate={maxDate}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onClose={() => setOpen(false)}
              anchorRef={anchorRef}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
