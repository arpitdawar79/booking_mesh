"use client";

import { NumberTicker } from "@/components/magicui/number-ticker";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { MagicCard } from "@/components/ui/magic-card";
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
    <div className="space-y-4 lg:space-y-5">
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
        <MagicCard className="p-3 sm:p-3.5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-teal-500/10 border border-teal-500/15">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Upcoming Check-ins</h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {stats.upcomingCheckins.map((u) => (
                <Link
                  key={u.id}
                  href={`/dashboard/booking/${u.id}`}
                  className="min-w-[160px] snap-start rounded-xl border border-border/40 bg-zinc-900/30 p-2.5 hover:bg-muted/20 hover:border-teal-500/20 transition-all duration-300"
                >
                  <div className="text-[10px] font-bold text-teal-400 mb-0.5">
                    {formatDate(u.checkInDate)}
                  </div>
                  <div className="font-semibold text-xs truncate">
                    {u.guestFullName}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
                    {u.nightCount} nights · ₹
                    {Number(u.totalAmount).toLocaleString("en-IN")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </MagicCard>
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
          {/* Mobile: Card List with MagicCard */}
          <div className="lg:hidden space-y-2.5">
            {bookings.map((b) => (
              <MagicCard key={b.id}>
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-muted-foreground/50 leading-none mb-1">
                        #{b.bookingId}
                      </div>
                      <div className="font-bold text-sm leading-tight">
                        {b.guestFullName}
                      </div>
                      <div className="text-xs text-muted-foreground/75 mt-0.5 font-medium">
                        {b.guestEmail}
                      </div>
                    </div>
                    <StatusBadge status={b.status} className="!text-[10px] !px-1.5 !py-0.5" />
                  </div>
                  <div className="text-xs text-muted-foreground/85 font-medium">
                    {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ·{" "}
                    {b.nightCount} nights
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground/90">
                    {b.roomCount} × {b.roomType}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/20">
                    <div className="text-sm font-extrabold text-emerald-400">
                      ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/booking/${b.id}`}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                      <button
                        onClick={() => handleCopy(b.id)}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors min-w-[36px] flex items-center justify-center"
                        title="Copy Summary"
                      >
                        {copiedId === b.id ? (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            Copied
                          </span>
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </MagicCard>
            ))}
          </div>

          {/* Desktop: Table with MagicCard wrapper */}
          <div className="hidden lg:block">
            <MagicCard className="overflow-visible">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">ID</th>
                      <th className="text-left">Guest</th>
                      <th className="text-left">Dates</th>
                      <th className="text-left">Nights</th>
                      <th className="text-left">Rooms</th>
                      <th className="text-left">Total</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono text-xs text-muted-foreground/60">{b.bookingId}</td>
                        <td>
                          <div className="font-semibold text-xs">{b.guestFullName}</div>
                          <div className="text-[10px] text-muted-foreground/70">{b.guestEmail}</div>
                        </td>
                        <td className="text-muted-foreground/80 text-xs">
                          {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                        </td>
                        <td className="font-medium">{b.nightCount}</td>
                        <td className="text-xs">{b.roomCount} × {b.roomType}</td>
                        <td>
                          <div className="font-bold text-emerald-400">
                            ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 mt-0.5 leading-none">
                            Paid: ₹{Number(b.amountPaidOnline).toLocaleString("en-IN")} | Bal: ₹{Number(b.balanceAmount).toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={b.status} className="!text-[10px] !px-1.5 !py-0.5" />
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/dashboard/booking/${b.id}`}
                              className="p-1 rounded hover:bg-muted/50 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Link>
                            <button
                              onClick={() => handleCopy(b.id)}
                              className="p-1 rounded hover:bg-muted/50 transition-colors"
                              title="Copy Summary"
                            >
                              {copiedId === b.id ? (
                                <span className="text-[10px] text-emerald-400 font-bold">Copied</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MagicCard>
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
