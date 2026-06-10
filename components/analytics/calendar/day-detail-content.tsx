"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  IndianRupee,
  LogOutIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { DayData } from "./day-cell";

function formatCurrency(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

interface DayDetailContentProps {
  day: DayData;
}

const paymentStatusColor: Record<string, string> = {
  paid_in_full: "bg-emerald-500/15 text-emerald-400",
  partially_paid: "bg-amber-500/15 text-amber-400",
  pending: "bg-rose-500/15 text-rose-400",
  refunded: "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  confirmed: "bg-teal-500/15 text-teal-400",
  completed: "bg-blue-500/15 text-blue-400",
  cancelled: "bg-rose-500/15 text-rose-400",
  archived: "bg-muted text-muted-foreground",
};

export function DayDetailContent({ day }: DayDetailContentProps) {
  const occupancyPercent = day.rooms > 0 ? Math.round((day.rooms / 10) * 100) : 0;
  const adr = day.guests > 0 ? day.revenue / day.guests : 0;

  const stats = [
    {
      icon: <BedDouble className="w-4 h-4 text-teal-400" />,
      label: "Occupied Rooms",
      value: day.rooms.toString(),
      sub: `${occupancyPercent}% occupancy`,
    },
    {
      icon: <Users className="w-4 h-4 text-blue-400" />,
      label: "Total Guests",
      value: day.guests.toString(),
      sub: day.bookings === 1 ? "1 booking" : `${day.bookings} bookings`,
    },
    {
      icon: <IndianRupee className="w-4 h-4 text-emerald-400" />,
      label: "Room Revenue",
      value: formatCurrency(day.revenue),
      sub: `₹${Math.round(adr).toLocaleString("en-IN")}/guest ADR`,
    },
    {
      icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />,
      label: "Check-ins",
      value: day.checkins.toString(),
      sub: day.checkinrevenue > 0 ? formatCurrency(day.checkinrevenue) : "No new arrivals",
    },
    {
      icon: <LogOutIcon className="w-4 h-4 text-rose-400" />,
      label: "Check-outs",
      value: day.checkouts.toString(),
      sub: day.checkouts > 0 ? "Departing today" : "No departures",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.04 }}
            className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border/50"
          >
            <div className="flex items-center gap-1.5 mb-1">
              {stat.icon}
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground truncate">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Movements */}
      {(day.checkins > 0 || day.checkouts > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-2"
        >
          {day.checkins > 0 && (
            <div className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-bold">Arrivals</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {day.checkins} {day.checkins === 1 ? "guest" : "guests"} checking in
                {day.checkinrevenue > 0 && ` • ${formatCurrency(day.checkinrevenue)}`}
              </p>
            </div>
          )}
          {day.checkouts > 0 && (
            <div className="flex-1 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <LogOutIcon className="w-4 h-4" />
                <span className="text-sm font-bold">Departures</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {day.checkouts} {day.checkouts === 1 ? "guest" : "guests"} checking out
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Bookings List */}
      <div>
        <h3 className="text-sm font-bold mb-2 sm:mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          Active Bookings ({day.bookingsList.length})
        </h3>

        {day.bookingsList.length === 0 ? (
          <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">No active bookings for this day</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {day.bookingsList.map((booking, idx) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
              >
                <Link
                  href={`/dashboard/booking/${booking.id}`}
                  className="block p-3 sm:p-4 rounded-xl border border-border/60 bg-card/30 hover:bg-card/60 hover:border-teal-500/25 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm sm:text-base font-bold truncate">
                          {booking.guestFullName}
                        </span>
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${statusColor[booking.status] || "bg-muted text-muted-foreground"}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3 h-3" />
                          {booking.roomCount} {booking.roomCount === 1 ? "room" : "rooms"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.guestCount} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateShort(booking.checkInDate)} →{" "}
                          {formatDateShort(booking.checkOutDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-emerald-400">
                        {formatCurrency(booking.totalAmount)}
                      </div>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${paymentStatusColor[booking.paymentStatus] || "bg-muted text-muted-foreground"}`}
                      >
                        {booking.paymentStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View booking details</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
