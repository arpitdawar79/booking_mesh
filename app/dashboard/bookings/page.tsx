"use client";

import { NumberTicker } from "@/components/magicui/number-ticker";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    AlertCircle,
    CalendarCheck,
    Copy,
    Eye,
    IndianRupee,
    PlusCircle,
    Search,
    TrendingUp,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  bookingId: string;
  guestFullName: string;
  guestEmail: string | null;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  nightCount: number;
  roomCount: number;
  roomType: string;
  totalAmount: number;
  amountPaidOnline: number;
  balanceAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface Stats {
  counts: {
    total: number;
    confirmed: number;
    cancelled: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    outstanding: number;
  };
  occupancy: {
    totalNights: number;
  };
  upcomingCheckins: Array<{
    id: string;
    bookingId: string;
    guestFullName: string;
    checkInDate: string | Date;
    checkOutDate: string | Date;
    nightCount: number;
    totalAmount: number;
  }>;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "confirmed" | "cancelled" | "archived"
  >("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (filter !== "all") params.set("status", filter);

    fetch(`/api/bookings?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Bookings API error: ${r.status}`);
        return r.json();
      })
      .then((bookingsData) => {
        setBookings(bookingsData.bookings || []);
        setTotal(bookingsData.total || 0);
      })
      .catch((err) => {
        console.error("Failed to load bookings:", err);
      })
      .finally(() => setLoading(false));

    fetch("/api/bookings/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Stats API error: ${r.status}`);
        return r.json();
      })
      .then((statsData) => {
        setStats(statsData);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
      });
  }, [page, pageSize, filter, search]);

  function handleCopy(bookingId: string) {
    setCopiedId(bookingId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading && bookings.length === 0) {
    return <div className="text-muted-foreground">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Stats Cards with NumberTicker */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <StatCard
            icon={<CalendarCheck className="w-5 h-5 text-teal-400" />}
            label="Total Bookings"
            value={<NumberTicker value={stats.counts.total} />}
            sub={`+${stats.counts.thisMonth} this month`}
          />
          <StatCard
            icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
            label="Revenue"
            value={`₹${(stats.revenue.total / 1000).toFixed(1)}k`}
            sub={`₹${stats.revenue.outstanding.toLocaleString("en-IN")} outstanding`}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-400" />}
            label="Confirmed"
            value={<NumberTicker value={stats.counts.confirmed} />}
            sub={`${stats.occupancy.totalNights} nights booked`}
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
            label="Cancelled"
            value={<NumberTicker value={stats.counts.cancelled} />}
            sub="Lost bookings"
          />
        </motion.div>
      )}

      {/* Upcoming Check-ins */}
      {stats && stats.upcomingCheckins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-3 sm:p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/15">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <h2 className="text-sm font-bold">Upcoming Check-ins</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {stats.upcomingCheckins.map((u) => (
              <Link
                key={u.id}
                href={`/dashboard/booking/${u.id}`}
                className="min-w-[180px] snap-start rounded-xl border border-border/50 bg-muted/10 p-3 hover:bg-muted/30 hover:border-teal-500/20 transition-all duration-300"
              >
                <div className="text-[11px] font-medium text-teal-400 mb-1">
                  {formatDate(u.checkInDate)}
                </div>
                <div className="font-semibold text-sm truncate">
                  {u.guestFullName}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-1 font-medium">
                  {u.nightCount} nights · ₹
                  {Number(u.totalAmount).toLocaleString("en-IN")}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bookings Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Bookings
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings..."
              className="pl-8 pr-3 py-2 rounded-xl border border-border/60 bg-muted/10 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/20 w-40 sm:w-56 transition-all"
            />
          </div>
          <div className="flex rounded-xl border border-border/60 overflow-hidden bg-muted/10">
            {(["all", "confirmed", "cancelled", "archived"] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-xs font-semibold capitalize transition-all ${
                    filter === f
                      ? "bg-foreground text-background"
                      : "hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ),
            )}
          </div>
          <Link
            href="/dashboard/new"
            className="rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-lg shadow-foreground/10"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </motion.div>

      {/* Booking List / Table */}
      {bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-8 sm:p-10 text-center"
        >
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-muted-foreground font-medium">
            No bookings match the selected filter.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Mobile: Card List with motion */}
          <div className="lg:hidden space-y-3">
            {bookings.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-3 sm:p-4 space-y-3 hover:border-teal-500/15 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[11px] text-muted-foreground/60">
                      #{b.bookingId}
                    </div>
                    <div className="font-semibold text-sm">
                      {b.guestFullName}
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      {b.guestEmail}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-xs text-muted-foreground/70 font-medium">
                  {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ·{" "}
                  {b.nightCount} nights
                </div>
                <div className="text-xs font-medium">
                  {b.roomCount} × {b.roomType}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-sm font-bold text-emerald-400">
                    ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/booking/${b.id}`}
                      className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleCopy(b.id)}
                      className="p-2 rounded-lg hover:bg-muted/50 transition-colors min-w-[44px]"
                      title="Copy Summary"
                    >
                      {copiedId === b.id ? (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          Copied
                        </span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/60 bg-card/10 backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Guest
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Dates
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Nights
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Rooms
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground/60">
                      {b.bookingId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm">
                        {b.guestFullName}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {b.guestEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground/80 text-xs">
                      {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                    </td>
                    <td className="px-4 py-3 font-medium">{b.nightCount}</td>
                    <td className="px-4 py-3 text-xs">
                      {b.roomCount} × {b.roomType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-emerald-400">
                        ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-muted-foreground/60">
                        Paid: ₹
                        {Number(b.amountPaidOnline).toLocaleString("en-IN")} |{" "}
                        Bal: ₹{Number(b.balanceAmount).toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/booking/${b.id}`}
                          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleCopy(b.id)}
                          className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          title="Copy Summary"
                        >
                          {copiedId === b.id ? (
                            <span className="text-xs text-emerald-400 font-bold">
                              Copied
                            </span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-4 space-y-2 hover:border-teal-500/15 transition-colors">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground/70 font-medium">{sub}</div>
    </div>
  );
}
