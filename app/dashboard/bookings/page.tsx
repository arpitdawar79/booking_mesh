"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { MagicCard } from "@/components/ui/magic-card";
import { Pagination } from "@/components/ui/pagination";
import { SmartLink } from "@/components/ui/smart-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { useHaptic, useLongPress } from "@/lib/pwa-hooks";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle,
  Copy,
  Download,
  Eye,
  IndianRupee,
  Loader2,
  MessageCircle,
  Phone,
  PlusCircle,
  Printer,
  Search,
  Share2,
  Smartphone,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  bookingId: string;
  guestFullName: string;
  guestEmail: string | null;
  guestPhone: string | null;
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

function BookingCard({
  b,
  onCopy,
  onMarkPaid,
  copiedId,
  markingPaidId,
  onContextMenu,
}: {
  b: Booking;
  onCopy: (id: string) => void;
  onMarkPaid: (id: string, totalAmount: number) => void;
  copiedId: string | null;
  markingPaidId: string | null;
  onContextMenu: (booking: Booking, clientX?: number, clientY?: number) => void;
}) {
  const haptic = useHaptic();
  const longPress = useLongPress(
    () => {
      haptic("medium");
      onContextMenu(b);
    },
    undefined,
    500,
  );

  return (
    <MagicCard borderBeam backlight className="w-full">
      <div
        className="p-4 space-y-3.5 select-none"
        {...longPress}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(b, e.clientX, e.clientY);
        }}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-muted-foreground/45 bg-muted px-1.5 py-0.5 rounded-sm">
                #{b.bookingId}
              </span>
              {b.status === "confirmed" && (
                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <div className="font-extrabold text-sm tracking-tight text-foreground truncate">
              {b.guestFullName}
            </div>
            <div className="text-[11px] text-muted-foreground/60 truncate font-semibold">
              {b.guestEmail || "No Email"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge
              status={b.status}
              className="!text-[9px] !px-2 !py-0.5 font-bold uppercase tracking-wider"
            />
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                b.paymentStatus === "paid_in_full"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/10"
                  : b.paymentStatus === "partially_paid"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-500/10"
                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-500/10"
              }`}
            >
              {b.paymentStatus.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Stay Visual Line */}
        <div className="rounded-xl border border-border bg-muted/40 p-2.5 flex items-center justify-between text-xs font-semibold gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground/40 uppercase font-black">
              Check-In
            </span>
            <span className="text-foreground">{formatDate(b.checkInDate)}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-2">
            <span className="text-[9px] text-primary/80 font-black">
              {b.nightCount} Night{b.nightCount > 1 ? "s" : ""}
            </span>
            <div className="w-full h-[1px] bg-linear-to-r from-transparent via-primary/35 to-transparent relative my-0.5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/60" />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-muted-foreground/40 uppercase font-black">
              Check-Out
            </span>
            <span className="text-foreground">
              {formatDate(b.checkOutDate)}
            </span>
          </div>
        </div>

        {/* Room Allocation Info */}
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground/80 border-b border-border pb-2">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary/70" />
            <span>
              {b.roomCount} × {b.roomType}
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground/40 font-semibold">
            Created {formatDate(b.createdAt)}
          </span>
        </div>

        {/* Card Footer Actions & Pricing */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground/40 uppercase font-black">
              Total Cost
            </div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              ₹{Number(b.totalAmount).toLocaleString("en-IN")}
            </div>
            {(b.amountPaidOnline > 0 || b.balanceAmount > 0) && (
              <div className="text-[9px] text-muted-foreground/50 font-bold">
                Paid: ₹{Number(b.amountPaidOnline).toLocaleString("en-IN")} |
                Bal: ₹{Number(b.balanceAmount).toLocaleString("en-IN")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <SmartLink
              href={`/dashboard/booking/${b.id}`}
              className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 active:scale-95 transition-all text-muted-foreground hover:text-primary"
              title="View Details"
            >
              <Eye className="w-4.5 h-4.5" />
            </SmartLink>
            <button
              onClick={() => onCopy(b.id)}
              className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 active:scale-95 transition-all text-muted-foreground hover:text-primary cursor-pointer"
              title="Copy Summary"
            >
              {copiedId === b.id ? (
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                  Done
                </span>
              ) : (
                <Copy className="w-4.5 h-4.5" />
              )}
            </button>
            {b.paymentStatus !== "paid_in_full" && (
              <button
                onClick={() => onMarkPaid(b.id, b.totalAmount)}
                disabled={markingPaidId === b.id}
                className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 active:scale-95 transition-all text-emerald-600 dark:text-emerald-400 disabled:opacity-40 cursor-pointer"
                title="Mark Fully Paid"
              >
                {markingPaidId === b.id ? (
                  <span className="text-[9px] font-extrabold">...</span>
                ) : (
                  <CheckCircle className="w-4.5 h-4.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </MagicCard>
  );
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
  const [contextMenuBooking, setContextMenuBooking] = useState<Booking | null>(
    null,
  );
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const haptic = useHaptic();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [waSendingId, setWaSendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<{
    isConnected: boolean;
  } | null>(null);

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  useEffect(() => {
    fetch("/api/whatsapp/status")
      .then(async (r) => {
        if (!r.ok) throw new Error("WA status error");
        return r.json();
      })
      .then((data) => setWaStatus({ isConnected: data.isConnected }))
      .catch(() => setWaStatus(null));
  }, []);

  function openContextMenu(
    booking: Booking,
    clientX?: number,
    clientY?: number,
  ) {
    setContextMenuBooking(booking);
    if (clientX !== undefined && clientY !== undefined) {
      setContextMenuPos({ x: clientX, y: clientY });
    } else {
      setContextMenuPos(null);
    }
  }

  function closeContextMenu() {
    setContextMenuBooking(null);
    setContextMenuPos(null);
  }

  useEffect(() => {
    if (!contextMenuPos) return;
    function onClick() {
      closeContextMenu();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeContextMenu();
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenuPos]);

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
    // Copy sum summary from code if we want but here we just copy the simple ID
    navigator.clipboard.writeText(bookingId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleMarkFullyPaid(id: string, totalAmount: number) {
    if (
      !confirm(
        "Mark this booking as fully paid? Outstanding balance will be cleared.",
      )
    )
      return;
    setMarkingPaidId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, markFullyPaid: true }),
      });
      const json = await res.json();
      if (json.booking) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  paymentStatus: "paid_in_full",
                  amountPaidOnline: totalAmount,
                  balanceAmount: 0,
                }
              : b,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to mark fully paid:", err);
    } finally {
      setMarkingPaidId(null);
    }
  }

  async function getEmailHtml(id: string): Promise<string> {
    const res = await fetch("/api/preview-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, type: "booking_confirmation" }),
    });
    return res.text();
  }

  async function handleDownloadPdf(id: string) {
    setPdfLoadingId(id);
    haptic("medium");
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, type: "booking_confirmation" }),
      });

      if (!res.ok) {
        throw new Error("PDF generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Booking_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccessToast("PDF Invoice downloaded.");
      haptic("success");
    } catch {
      showErrorToast("PDF Invoice generation failed.");
      haptic("error");
    } finally {
      setPdfLoadingId(null);
    }
  }

  async function handlePrintInvoice(id: string) {
    haptic("medium");
    try {
      const html = await getEmailHtml(id);
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(
          `<html><head><title>Booking Invoice</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111;}</style></head><body>${html}</body></html>`,
        );
        w.document.close();
        setTimeout(() => w.print(), 400);
      }
    } catch {
      showErrorToast("Failed to generate print preview.");
    }
  }

  async function handleShare(booking: Booking) {
    haptic("medium");
    const shareData = {
      title: `Booking ${booking.bookingId}`,
      text: `${booking.guestFullName} — ${formatDate(booking.checkInDate)} to ${formatDate(booking.checkOutDate)} (${booking.nightCount} nights)`,
      url:
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard/booking/${booking.id}`
          : "",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`,
        );
        showSuccessToast("Booking summary copied to clipboard!");
      }
    } catch {
      // User cancelled or share failed silently
    }
  }

  async function handleCopySummary(booking: Booking) {
    haptic("medium");
    const text = `
*Booking Confirmation – The Stream by Ekantah*

*Guest:* ${booking.guestFullName}
*Booking ID:* #${booking.bookingId}
*Dates:* ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)} (${booking.nightCount} nights)
*Rooms:* ${booking.roomCount} × ${booking.roomType}

*Payment:*
* Total: ₹${Number(booking.totalAmount).toLocaleString("en-IN")}
* Paid Online: ₹${Number(booking.amountPaidOnline).toLocaleString("en-IN")}
* Balance: ₹${Number(booking.balanceAmount).toLocaleString("en-IN")}
* Status: ${booking.paymentStatus}

We look forward to hosting you!
    `.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(booking.id);
      showSuccessToast("Booking summary copied to clipboard.");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showErrorToast("Could not write to clipboard.");
      haptic("error");
    }
  }

  async function handleSendWhatsApp(id: string, sendPdf: boolean) {
    if (!waStatus?.isConnected) {
      showErrorToast("WhatsApp setup is not connected.");
      haptic("error");
      return;
    }
    setWaSendingId(id);
    haptic("light");
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          type: "booking_confirmation",
          sendPdf,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showSuccessToast(
          sendPdf
            ? "WhatsApp invoice dispatched!"
            : "WhatsApp confirmation dispatched!",
        );
        haptic("success");
      } else {
        showErrorToast(json.error || "Failed to send WhatsApp message.");
        haptic("error");
      }
    } catch {
      showErrorToast("Failed to send WhatsApp message.");
      haptic("error");
    } finally {
      setWaSendingId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(id);
    haptic("medium");
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      const json = await res.json();
      if (json.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
        );
        showSuccessToast("Booking reservation cancelled.");
        haptic("success");
      } else {
        showErrorToast(json.error || "Failed to cancel booking.");
        haptic("error");
      }
    } catch (err) {
      console.error("Failed to cancel:", err);
      showErrorToast("Failed to cancel booking.");
      haptic("error");
    } finally {
      setCancellingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground/60 text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span>Loading bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Stats Cards using global Dashboard StatCard component */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          <StatCard
            icon={<CalendarCheck className="w-4 h-4 text-primary" />}
            label="Total Bookings"
            value={<NumberTicker value={stats.counts.total} />}
            sub={`+${stats.counts.thisMonth} this month`}
          />
          <StatCard
            icon={
              <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            }
            label="Revenue"
            value={`₹${(stats.revenue.total / 1000).toFixed(1)}k`}
            sub={`₹${stats.revenue.outstanding.toLocaleString("en-IN")} outstanding`}
          />
          <StatCard
            icon={
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            }
            label="Confirmed"
            value={<NumberTicker value={stats.counts.confirmed} />}
            sub={`${stats.occupancy.totalNights} nights booked`}
          />
          <StatCard
            icon={
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            }
            label="Cancelled"
            value={<NumberTicker value={stats.counts.cancelled} />}
            sub="Lost bookings"
          />
        </motion.div>
      )}

      {/* Upcoming Check-ins slider */}
      {stats && stats.upcomingCheckins.length > 0 && (
        <MagicCard className="p-4 sm:p-5" backlight borderBeam>
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-primary">
                  Upcoming Check-ins
                </h2>
                <p className="text-[10px] text-muted-foreground/50 font-medium">
                  Reservations arriving soon
                </p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {stats.upcomingCheckins.map((u) => (
                <SmartLink
                  key={u.id}
                  href={`/dashboard/booking/${u.id}`}
                  className="relative group min-w-[170px] snap-start rounded-2xl border border-border bg-muted/30 p-3 hover:bg-muted/60 hover:border-primary/50 transition-all duration-300 overflow-hidden shrink-0"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wider text-primary">
                      {formatDate(u.checkInDate)}
                    </div>
                    <div className="font-extrabold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                      {u.guestFullName}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 font-semibold flex items-center justify-between mt-1">
                      <span>{u.nightCount} nights</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        ₹{Number(u.totalAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </SmartLink>
              ))}
            </div>
          </div>
        </MagicCard>
      )}

      {/* Bookings Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Bookings
          </h1>
          <p className="text-xs text-muted-foreground/60 font-medium mt-0.5">
            Overview and details of all property reservations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box with dynamic teal focus state */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/45 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings..."
              className="pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/15 focus:shadow-[0_0_20px_-5px_var(--glow-color)] w-40 sm:w-56 transition-all duration-300 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Animated sliding navigation filter */}
          <div className="flex rounded-xl border border-border p-1 bg-muted/50">
            {(["all", "confirmed", "cancelled", "archived"] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all select-none z-10 cursor-pointer ${
                    filter === f
                      ? "text-background"
                      : "text-muted-foreground/70 hover:text-foreground"
                  }`}
                >
                  {filter === f && (
                    <motion.span
                      layoutId="activeFilterBg"
                      className="absolute inset-0 bg-foreground rounded-lg z-[-1]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  {f}
                </button>
              ),
            )}
          </div>

          <Link
            href="/dashboard/new"
            className="rounded-xl bg-foreground text-background px-4 py-2 text-xs font-extrabold hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-lg shadow-foreground/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Booking</span>
          </Link>
        </div>
      </motion.div>

      {/* Booking List / Table */}
      {bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/5 bg-white/1 p-10 text-center space-y-2"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg mx-auto">
            🔍
          </div>
          <h3 className="font-bold text-sm text-foreground">
            No bookings found
          </h3>
          <p className="text-xs text-muted-foreground/60 font-medium">
            Try adjusting your search query or status filters.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Mobile: Ticket styled Card List */}
          <div className="lg:hidden space-y-3.5">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                onCopy={handleCopy}
                onMarkPaid={handleMarkFullyPaid}
                copiedId={copiedId}
                markingPaidId={markingPaidId}
                onContextMenu={openContextMenu}
              />
            ))}
          </div>

          {/* Desktop: Elegant details table with glass panel wrapper */}
          <div className="hidden lg:block">
            <MagicCard className="overflow-visible" backlight>
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
                      <tr
                        key={b.id}
                        className="group transition-colors duration-200 cursor-context-menu"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          openContextMenu(b, e.clientX, e.clientY);
                        }}
                      >
                        <td className="font-mono text-xs text-muted-foreground/60">
                          {b.bookingId}
                        </td>
                        <td>
                          <div className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors">
                            {b.guestFullName}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60">
                            {b.guestEmail}
                          </div>
                        </td>
                        <td className="text-muted-foreground/80 text-xs font-semibold">
                          <span className="text-foreground">
                            {formatDate(b.checkInDate)}
                          </span>
                          <span className="text-muted-foreground/45 mx-1.5">
                            →
                          </span>
                          <span className="text-foreground">
                            {formatDate(b.checkOutDate)}
                          </span>
                        </td>
                        <td className="font-bold text-primary">
                          {b.nightCount}
                        </td>
                        <td className="text-xs font-semibold text-muted-foreground/85">
                          {b.roomCount} × {b.roomType}
                        </td>
                        <td>
                          <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                            ₹{Number(b.totalAmount).toLocaleString("en-IN")}
                          </div>
                          <div className="text-[9px] text-muted-foreground/60 mt-0.5 font-semibold leading-none">
                            Paid: ₹
                            {Number(b.amountPaidOnline).toLocaleString("en-IN")}{" "}
                            | Bal: ₹
                            {Number(b.balanceAmount).toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge
                              status={b.status}
                              className="!text-[9px] !px-2 !py-0.5 font-bold uppercase tracking-wider"
                            />
                            <span
                              className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                                b.paymentStatus === "paid_in_full"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : b.paymentStatus === "partially_paid"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                              }`}
                            >
                              {b.paymentStatus.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <SmartLink
                              href={`/dashboard/booking/${b.id}`}
                              className="w-7 h-7 rounded-lg bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </SmartLink>
                            <button
                              onClick={() => handleCopy(b.id)}
                              className="w-7 h-7 rounded-lg bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary cursor-pointer"
                              title="Copy Summary"
                            >
                              {copiedId === b.id ? (
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                                  Copied
                                </span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {b.paymentStatus !== "paid_in_full" && (
                              <button
                                onClick={() =>
                                  handleMarkFullyPaid(b.id, b.totalAmount)
                                }
                                disabled={markingPaidId === b.id}
                                className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 active:scale-95 transition-all text-emerald-600 dark:text-emerald-400 disabled:opacity-40 cursor-pointer"
                                title="Mark Fully Paid"
                              >
                                {markingPaidId === b.id ? (
                                  <span className="text-[8px] font-extrabold">
                                    ...
                                  </span>
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
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

          {/* Mobile Long-Press Context Menu Drawer */}
          <Drawer
            open={!!contextMenuBooking && !contextMenuPos}
            onOpenChange={(open) => {
              if (!open) closeContextMenu();
            }}
          >
            <DrawerContent className="p-4 bg-card border-t border-border">
              <DrawerTitle className="text-sm font-black text-foreground uppercase tracking-wider mb-1">
                Quick Actions
              </DrawerTitle>
              {contextMenuBooking && (
                <div className="space-y-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/dashboard/booking/${contextMenuBooking.id}`,
                      );
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:border-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Eye className="w-4 h-4 text-primary" />
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPdf(contextMenuBooking.id);
                      closeContextMenu();
                    }}
                    disabled={pdfLoadingId === contextMenuBooking.id}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:border-primary/20 active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    {pdfLoadingId === contextMenuBooking.id ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 text-primary" />
                    )}
                    {pdfLoadingId === contextMenuBooking.id
                      ? "Generating PDF..."
                      : "Download PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePrintInvoice(contextMenuBooking.id);
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:border-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Printer className="w-4 h-4 text-primary" />
                    Print Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleShare(contextMenuBooking);
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:border-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Share2 className="w-4 h-4 text-primary" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopySummary(contextMenuBooking);
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:border-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Copy className="w-4 h-4 text-primary" />
                    Copy Summary
                  </button>
                  {contextMenuBooking.guestPhone && (
                    <>
                      <a
                        href={`tel:${contextMenuBooking.guestPhone}`}
                        onClick={() => closeContextMenu()}
                        className="w-full flex items-center gap-3 rounded-xl border border-border bg-primary/10 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/20 active:scale-[0.98] transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        Call Guest
                      </a>
                      <a
                        href={`https://wa.me/${contextMenuBooking.guestPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => closeContextMenu()}
                        className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp Guest
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendWhatsApp(contextMenuBooking.id, true);
                          closeContextMenu();
                        }}
                        disabled={waSendingId === contextMenuBooking.id}
                        className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        <Smartphone className="w-4 h-4" />
                        {waSendingId === contextMenuBooking.id
                          ? "Sending..."
                          : "WhatsApp Invoice"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendWhatsApp(contextMenuBooking.id, false);
                          closeContextMenu();
                        }}
                        disabled={waSendingId === contextMenuBooking.id}
                        className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {waSendingId === contextMenuBooking.id
                          ? "Sending..."
                          : "WhatsApp Text"}
                      </button>
                    </>
                  )}
                  {contextMenuBooking.paymentStatus !== "paid_in_full" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleMarkFullyPaid(
                          contextMenuBooking.id,
                          contextMenuBooking.totalAmount,
                        );
                        closeContextMenu();
                      }}
                      disabled={markingPaidId === contextMenuBooking.id}
                      className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {markingPaidId === contextMenuBooking.id
                        ? "Processing..."
                        : "Mark Fully Paid"}
                    </button>
                  )}
                  {contextMenuBooking.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCancel(contextMenuBooking.id);
                        closeContextMenu();
                      }}
                      disabled={cancellingId === contextMenuBooking.id}
                      className="w-full flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                      <XCircle className="w-4 h-4" />
                      {cancellingId === contextMenuBooking.id
                        ? "Cancelling..."
                        : "Cancel Reservation"}
                    </button>
                  )}
                </div>
              )}
            </DrawerContent>
          </Drawer>

          {/* Desktop Right-Click Context Menu */}
          {contextMenuPos && contextMenuBooking && (
            <div
              className="fixed inset-0 z-50"
              onClick={() => closeContextMenu()}
            >
              <div
                className="absolute z-50 min-w-[200px] rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/10"
                style={{
                  left: Math.min(
                    contextMenuPos.x,
                    typeof window !== "undefined"
                      ? window.innerWidth - 220
                      : contextMenuPos.x,
                  ),
                  top: Math.min(
                    contextMenuPos.y,
                    typeof window !== "undefined"
                      ? window.innerHeight - 300
                      : contextMenuPos.y,
                  ),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 px-2 py-1 mb-1">
                  Quick Actions
                </div>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/dashboard/booking/${contextMenuBooking.id}`,
                      );
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadPdf(contextMenuBooking.id);
                      closeContextMenu();
                    }}
                    disabled={pdfLoadingId === contextMenuBooking.id}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
                  >
                    {pdfLoadingId === contextMenuBooking.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-primary" />
                    )}
                    {pdfLoadingId === contextMenuBooking.id
                      ? "Generating..."
                      : "Download PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePrintInvoice(contextMenuBooking.id);
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary" />
                    Print Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleShare(contextMenuBooking);
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-primary" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopySummary(contextMenuBooking);
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                    Copy Summary
                  </button>
                  {contextMenuBooking.guestPhone && (
                    <>
                      <a
                        href={`tel:${contextMenuBooking.guestPhone}`}
                        onClick={() => closeContextMenu()}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        Call Guest
                      </a>
                      <a
                        href={`https://wa.me/${contextMenuBooking.guestPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => closeContextMenu()}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Guest
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendWhatsApp(contextMenuBooking.id, true);
                          closeContextMenu();
                        }}
                        disabled={waSendingId === contextMenuBooking.id}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        {waSendingId === contextMenuBooking.id
                          ? "Sending..."
                          : "WhatsApp Invoice"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSendWhatsApp(contextMenuBooking.id, false);
                          closeContextMenu();
                        }}
                        disabled={waSendingId === contextMenuBooking.id}
                        className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {waSendingId === contextMenuBooking.id
                          ? "Sending..."
                          : "WhatsApp Text"}
                      </button>
                    </>
                  )}
                  {contextMenuBooking.paymentStatus !== "paid_in_full" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleMarkFullyPaid(
                          contextMenuBooking.id,
                          contextMenuBooking.totalAmount,
                        );
                        closeContextMenu();
                      }}
                      disabled={markingPaidId === contextMenuBooking.id}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {markingPaidId === contextMenuBooking.id
                        ? "Processing..."
                        : "Mark Fully Paid"}
                    </button>
                  )}
                  {contextMenuBooking.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCancel(contextMenuBooking.id);
                        closeContextMenu();
                      }}
                      disabled={cancellingId === contextMenuBooking.id}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {cancellingId === contextMenuBooking.id
                        ? "Cancelling..."
                        : "Cancel Reservation"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
