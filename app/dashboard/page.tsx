"use client";

import {
    AlertCircle,
    CalendarCheck,
    Copy,
    Eye,
    IndianRupee,
    Mail,
    MessageCircle,
    PlusCircle,
    TrendingUp,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  bookingId: string;
  guestFullName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
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
    checkInDate: string;
    checkOutDate: string;
    nightCount: number;
    totalAmount: number;
  }>;
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">(
    "all",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/bookings/stats").then((r) => r.json()),
    ])
      .then(([bookingsData, statsData]) => {
        setBookings(bookingsData.bookings || []);
        setStats(statsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleQuickEmail(booking: Booking) {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        type: "booking_confirmation",
        to: [booking.guestEmail],
      }),
    });
    const json = await res.json();
    alert(json.success ? "Email sent!" : json.error || "Failed to send.");
  }

  async function handleCopySummary(booking: Booking) {
    const text = `
Booking #${booking.bookingId} – ${booking.guestFullName}
Dates: ${booking.checkInDate} → ${booking.checkOutDate}
Nights: ${booking.nightCount} | Rooms: ${booking.roomCount} × ${booking.roomType}
Total: ₹${booking.totalAmount} | Paid: ₹${booking.amountPaidOnline} | Balance: ₹${booking.balanceAmount}
Status: ${booking.status}
    `.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(booking.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Could not copy.");
    }
  }

  async function handleWhatsApp(booking: Booking) {
    const text = `Booking confirmation #%23${booking.bookingId} for ${booking.guestFullName}. Dates: ${booking.checkInDate} to ${booking.checkOutDate} (${booking.nightCount} nights). Total: ₹${booking.totalAmount}. The Stream by Ekantah.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  function handleDownloadPdf(booking: Booking) {
    const w = window.open(`/dashboard/booking/${booking.id}?pdf=1`, "_blank");
    if (w) {
      setTimeout(() => {
        w.print();
      }, 800);
    }
  }

  const filtered = bookings.filter((b) =>
    filter === "all" ? true : b.status === filter,
  );

  if (loading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<CalendarCheck className="w-5 h-5 text-teal-400" />}
            label="Total Bookings"
            value={stats.counts.total}
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
            value={stats.counts.confirmed}
            sub={`${stats.occupancy.totalNights} nights booked`}
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
            label="Cancelled"
            value={stats.counts.cancelled}
            sub="Lost bookings"
          />
        </div>
      )}

      {/* Upcoming Check-ins */}
      {stats && stats.upcomingCheckins.length > 0 && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold">Upcoming Check-ins</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {stats.upcomingCheckins.map((u) => (
              <Link
                key={u.id}
                href={`/dashboard/booking/${u.id}`}
                className="min-w-[180px] snap-start rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition"
              >
                <div className="text-xs text-muted-foreground">
                  {u.checkInDate}
                </div>
                <div className="font-medium text-sm truncate">
                  {u.guestFullName}
                </div>
                <div className="text-xs mt-1">
                  {u.nightCount} nights · ₹
                  {Number(u.totalAmount).toLocaleString("en-IN")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bookings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Bookings</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["all", "confirmed", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  filter === f
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Link
            href="/dashboard/new"
            className="rounded-lg bg-foreground text-background px-4 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* Booking List / Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          No bookings match the selected filter.
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="lg:hidden space-y-3">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-card/30 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      #{b.bookingId}
                    </div>
                    <div className="font-medium text-sm">{b.guestFullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.guestEmail}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      b.status === "confirmed"
                        ? "bg-green-900/30 text-green-300"
                        : b.status === "cancelled"
                          ? "bg-red-900/30 text-red-300"
                          : "bg-blue-900/30 text-blue-300"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.checkInDate} → {b.checkOutDate} · {b.nightCount} nights
                </div>
                <div className="text-xs">
                  {b.roomCount} × {b.roomType}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/booking/${b.id}`}
                      className="p-1.5 rounded-md hover:bg-muted transition"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleQuickEmail(b)}
                      className="p-1.5 rounded-md hover:bg-muted transition"
                      title="Send Confirmation Email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleWhatsApp(b)}
                      className="p-1.5 rounded-md hover:bg-muted transition"
                      title="Share on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopySummary(b)}
                      className="p-1.5 rounded-md hover:bg-muted transition min-w-[40px]"
                      title="Copy Summary"
                    >
                      {copiedId === b.id ? (
                        <span className="text-[10px] text-green-400 font-medium">
                          Copied
                        </span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Guest</th>
                  <th className="text-left px-4 py-3 font-medium">Dates</th>
                  <th className="text-left px-4 py-3 font-medium">Nights</th>
                  <th className="text-left px-4 py-3 font-medium">Rooms</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      {b.bookingId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.guestFullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.guestEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.checkInDate} → {b.checkOutDate}
                    </td>
                    <td className="px-4 py-3">{b.nightCount}</td>
                    <td className="px-4 py-3">
                      {b.roomCount} × {b.roomType}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Paid: ₹
                        {Number(b.amountPaidOnline).toLocaleString("en-IN")} |{" "}
                        Bal: ₹{Number(b.balanceAmount).toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "confirmed"
                            ? "bg-green-900/30 text-green-300"
                            : b.status === "cancelled"
                              ? "bg-red-900/30 text-red-300"
                              : "bg-blue-900/30 text-blue-300"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/booking/${b.id}`}
                          className="p-1.5 rounded-md hover:bg-muted transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleQuickEmail(b)}
                          className="p-1.5 rounded-md hover:bg-muted transition"
                          title="Send Confirmation Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleWhatsApp(b)}
                          className="p-1.5 rounded-md hover:bg-muted transition"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopySummary(b)}
                          className="p-1.5 rounded-md hover:bg-muted transition"
                          title="Copy Summary"
                        >
                          {copiedId === b.id ? (
                            <span className="text-xs text-green-400 font-medium">
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
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
