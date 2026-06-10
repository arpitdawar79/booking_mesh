"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    BedDouble,
    CalendarDays,
    IndianRupee,
    LogOutIcon,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface BookingInfo {
  id: string;
  bookingId: string;
  guestFullName: string;
  roomCount: number;
  guestCount: number;
  totalAmount: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  paymentStatus: string;
}

export interface DayData {
  date: string;
  rooms: number;
  guests: number;
  revenue: number;
  bookings: number;
  checkins: number;
  checkinrevenue: number;
  checkouts: number;
  bookingsList: BookingInfo[];
}

interface DayCellProps {
  day: DayData | null;
  dayNum: number;
  isToday: boolean;
  maxRooms: number;
  onClick?: (day: DayData) => void;
}

export function formatCurrency(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function BookingMiniCard({
  booking,
  index,
}: {
  booking: BookingInfo;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
    >
      <Link
        href={`/dashboard/booking/${booking.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 p-2 rounded-lg bg-card/60 border border-border/50 hover:bg-card/90 hover:border-teal-500/30 transition-all group"
      >
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold truncate">
            {booking.guestFullName}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {booking.roomCount} room{booking.roomCount > 1 ? "s" : ""} •{" "}
            {booking.guestCount} guests
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-emerald-400">
            {formatCurrency(booking.totalAmount)}
          </div>
          <div className="text-[9px] text-muted-foreground">
            {booking.paymentStatus.replace(/_/g, " ")}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function DayCell({
  day,
  dayNum,
  isToday,
  maxRooms,
  onClick,
}: DayCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [popoverPos, setPopoverPos] = useState({
    top: 0,
    left: 0,
    flip: false,
  });

  const occupancyRatio = day ? day.rooms / maxRooms : 0;
  const occupancyColor =
    !day || day.rooms === 0
      ? "bg-muted/10"
      : occupancyRatio > 0.75
        ? "bg-teal-500/25"
        : occupancyRatio > 0.4
          ? "bg-teal-500/15"
          : "bg-teal-500/8";

  const hasActivity =
    day && (day.rooms > 0 || day.checkins > 0 || day.checkouts > 0);

  const handleMouseEnter = () => {
    if (!day || !hasActivity) return;
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popoverWidth = 340;
      const estimatedHeight = 130 + Math.max(day.bookingsList.length, 1) * 55;
      const gap = 8;
      const pad = 12;

      // Horizontal: anchor to cell edge, prefer right side
      let left: number;
      const fitsRight = rect.left + popoverWidth + pad <= vw;
      const fitsLeft = rect.right - popoverWidth - pad >= 0;

      if (fitsRight) {
        // Align popover left edge with cell left edge (flows right)
        left = rect.left;
      } else if (fitsLeft) {
        // Align popover right edge with cell right edge (flows left)
        left = rect.right - popoverWidth;
      } else {
        // Neither fits: clamp to viewport
        left = Math.max(pad, Math.min(rect.left, vw - popoverWidth - pad));
      }

      // Vertical: prefer below, flip to above if needed
      const spaceAbove = rect.top;
      const spaceBelow = vh - rect.bottom;
      const placeBelow =
        spaceBelow >= estimatedHeight + gap || spaceBelow > spaceAbove;
      const top = placeBelow ? rect.bottom + gap : rect.top - gap;

      setPopoverPos({ top, left, flip: placeBelow });
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  if (!day) {
    return (
      <div className="min-h-[52px] sm:min-h-[120px] border-r border-b border-border/40 bg-muted/10" />
    );
  }

  return (
    <div
      ref={cellRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => hasActivity && onClick?.(day)}
        className={`min-h-[52px] sm:min-h-[120px] border-r border-b border-border/40 p-1 sm:p-2 flex flex-col transition-all text-left w-full ${occupancyColor} ${
          isToday
            ? "ring-2 ring-inset ring-teal-500 ring-offset-1 ring-offset-background"
            : ""
        } ${hasActivity ? "hover:bg-muted/40 cursor-pointer" : "hover:bg-muted/20"}`}
      >
        {/* Mobile: minimal — date + tiny dots */}
        <div className="flex sm:hidden flex-col items-center justify-center h-full gap-1 py-1">
          <span
            className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
              isToday ? "bg-teal-500 text-white" : "text-foreground"
            }`}
          >
            {dayNum}
          </span>
          {day.rooms > 0 && (
            <div className="flex items-center gap-1">
              {/* Occupancy dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  occupancyRatio > 0.75
                    ? "bg-teal-400"
                    : occupancyRatio > 0.4
                      ? "bg-teal-400/60"
                      : "bg-teal-400/30"
                }`}
              />
              {/* Check-in dot */}
              {day.checkins > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
              {/* Check-out dot */}
              {day.checkouts > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              )}
            </div>
          )}
        </div>

        {/* Desktop: full rich layout */}
        <div className="hidden sm:flex flex-col gap-1 h-full">
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? "bg-teal-500 text-white" : "text-foreground"
              }`}
            >
              {dayNum}
            </span>
            <div className="flex items-center gap-1">
              {day.checkins > 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                  +{day.checkins}
                </span>
              )}
              {day.checkouts > 0 && (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded-md">
                  {day.checkouts} out
                </span>
              )}
            </div>
          </div>

          {day.rooms > 0 ? (
            <div className="mt-auto space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <BedDouble className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-bold text-foreground">{day.rooms}</span>
                <span className="text-muted-foreground text-[10px]">
                  {day.rooms === 1 ? "room" : "rooms"}
                </span>
                <span className="ml-auto text-[10px] font-bold text-teal-400">
                  {Math.round(occupancyRatio * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-bold text-foreground">{day.guests}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <IndianRupee className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="font-bold text-emerald-400">
                  {formatCurrency(day.revenue)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-auto">
              {day.checkouts > 0 ? (
                <div className="flex items-center gap-1 text-[10px] text-rose-400">
                  <LogOutIcon className="w-3 h-3" />
                  <span className="font-medium">{day.checkouts} checkout</span>
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground/50 italic">
                  No guests
                </div>
              )}
            </div>
          )}
        </div>
      </motion.button>

      {/* Desktop hover popover via portal */}
      <AnimatePresence>
        {hovered && typeof document !== "undefined" && (
          <HoverPopover day={day} position={popoverPos} />
        )}
      </AnimatePresence>
    </div>
  );
}

function HoverPopover({
  day,
  position,
}: {
  day: DayData;
  position: { top: number; left: number; flip: boolean };
}) {
  const occupancyPercent =
    day.rooms > 0 ? Math.round((day.rooms / 10) * 100) : 0;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: position.flip ? -8 : 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position.flip ? -4 : 4, scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed z-100 hidden sm:block"
      style={{
        top: position.top,
        left: position.left,
        transform: position.flip ? "translateY(0px)" : "translateY(-100%)",
      }}
    >
      <div className="w-[340px] rounded-xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">
              {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {day.rooms} rooms • {day.guests} guests
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-emerald-400">
              {formatCurrency(day.revenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {occupancyPercent}% occupancy
            </div>
          </div>
        </div>

        {/* Movements */}
        {(day.checkins > 0 || day.checkouts > 0) && (
          <div className="flex gap-2">
            {day.checkins > 0 && (
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] font-bold text-amber-400">
                  +{day.checkins} Check-in
                </div>
                {day.checkinrevenue > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    {formatCurrency(day.checkinrevenue)}
                  </div>
                )}
              </div>
            )}
            {day.checkouts > 0 && (
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-[10px] font-bold text-rose-400">
                  {day.checkouts} Check-out
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings list */}
        {day.bookingsList.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <CalendarDays className="w-3 h-3" />
              Active Bookings ({day.bookingsList.length})
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
              {day.bookingsList.map((b, i) => (
                <BookingMiniCard key={b.id} booking={b} index={i} />
              ))}
            </div>
          </div>
        )}

        {day.bookingsList.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No active bookings for this day
          </div>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}
