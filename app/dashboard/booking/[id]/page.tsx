"use client";

import { DatePicker } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { GuestCounter, Input, Select } from "@/components/ui/form-primitives";
import { useToast } from "@/components/ui/toast";
import { useHaptic } from "@/lib/pwa-hooks";
import { formatDate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BedDouble,
  CalendarCheck,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  History,
  Home,
  Info,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  Settings,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  bookingId: string;
  guestFirstName: string;
  guestFullName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  adultCount: number;
  childCount: number;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  nightCount: number;
  roomCount: number;
  roomType: string;
  extraMattressCount: number;
  mealPlan: string;
  currency: string;
  totalAmount: number;
  amountPaidOnline: number;
  balanceAmount: number;
  paymentStatus: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  caretakerNumber: string;
  parkingDetails: string;
  mapLink: string;
  cancellationPolicy: string;
  specialRequests: string;
  status: string;
  createdAt: string;
  emailsSent: EmailSent[];
  whatsappMessages: WhatsAppMessage[];
}

interface EmailSent {
  id: string;
  type: string;
  toEmail: string;
  subject: string;
  status: string;
  sentAt: string;
}

interface WhatsAppMessage {
  id: string;
  type: string;
  toPhone: string;
  status: string;
  sentAt: string;
  hasPdf: boolean;
}

const toISODateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailType, setEmailType] = useState("booking_confirmation");
  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waStatus, setWaStatus] = useState<{
    isConnected: boolean;
    qrCode: string | null;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Mobile navigation tab state
  const [activeMobileTab, setActiveMobileTab] = useState<
    "details" | "ledger" | "manage"
  >("details");

  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const haptic = useHaptic();

  useEffect(() => {
    fetch(`/api/bookings?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const b = data.bookings?.[0] || null;
        setBooking(b);
        if (b) {
          setToEmail(b.guestEmail || "");
          if (b.status === "cancelled") setEmailType("cancellation");
          else if (b.status === "confirmed")
            setEmailType("booking_confirmation");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/whatsapp/status")
      .then((r) => r.json())
      .then((data) => {
        setWaStatus({
          isConnected: data.isConnected,
          qrCode: data.qrCode || null,
        });
      })
      .catch(() => setWaStatus(null));
  }, []);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setSending(true);
    haptic("light");

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        type: emailType,
        to: toEmail
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cc: ccEmail
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        customMessage: customMessage || undefined,
      }),
    });

    setSending(false);
    const json = await res.json();
    if (json.success) {
      showSuccessToast("Email dispatched successfully!");
      haptic("success");
      // Reload details after delay to display new history log
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showErrorToast(json.error || "Failed to dispatch email.");
      haptic("error");
    }
  }

  async function handleSendWhatsApp(sendPdf: boolean) {
    if (!booking) return;
    if (!booking.guestPhone) {
      showErrorToast("Guest phone number not available.");
      haptic("error");
      return;
    }
    if (!waStatus?.isConnected) {
      showErrorToast("WhatsApp setup is not connected.");
      haptic("error");
      return;
    }
    setWaSending(true);
    haptic("light");
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        type: emailType,
        sendPdf,
        customMessage: customMessage || undefined,
      }),
    });
    setWaSending(false);
    const json = await res.json();
    if (json.success) {
      showSuccessToast(`WhatsApp confirmation message dispatched!`);
      haptic("success");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showErrorToast(json.error || "Failed to send WhatsApp message.");
      haptic("error");
    }
  }

  async function handleCancel() {
    if (!booking) return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    haptic("medium");
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking.id, status: "cancelled" }),
    });
    const json = await res.json();
    setCancelling(false);

    if (json.booking) {
      setBooking(json.booking);
      showSuccessToast("Booking reservation cancelled.");
      haptic("success");
    } else {
      showErrorToast(json.error || "Failed to cancel booking.");
      haptic("error");
    }
  }

  async function handlePreview() {
    if (!booking) return;
    haptic("light");
    const res = await fetch("/api/preview-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        type: emailType,
        customMessage: customMessage || undefined,
      }),
    });
    const html = await res.text();
    const w = window.open("", "_blank", "width=800,height=800");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  async function getEmailHtml(): Promise<string> {
    if (!booking) return "";
    const res = await fetch("/api/preview-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        type: "booking_confirmation",
      }),
    });
    return res.text();
  }

  async function generatePdfBlob(): Promise<Blob | null> {
    if (!booking) return null;
    setPdfLoading(true);
    haptic("medium");
    try {
      const html = await getEmailHtml();
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "800px";
      document.body.appendChild(container);

      const html2pdf = (await import("html2pdf.js")).default;
      const pdfBlob = (await html2pdf()
        .set({
          margin: 0.5,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .outputPdf("blob")) as Blob;

      document.body.removeChild(container);
      return pdfBlob;
    } catch {
      return null;
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleDownloadPdf() {
    const blob = await generatePdfBlob();
    if (!blob) {
      showErrorToast("PDF Invoice generation failed.");
      haptic("error");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Booking_${booking?.bookingId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccessToast("PDF Invoice downloaded.");
    haptic("success");
  }

  async function handlePrintInvoice() {
    if (!booking) return;
    haptic("medium");
    const html = await getEmailHtml();
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`
        <html><head><title>Booking ${booking.bookingId}</title>
        <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111;}</style>
        </head><body>${html}</body></html>
      `);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  }

  async function handleCopySummary() {
    if (!booking) return;
    haptic("medium");
    const text = `
*Booking Confirmation – The Stream by Ekantah*

*Guest:* ${booking.guestFullName}
*Booking ID:* #${booking.bookingId}
*Dates:* ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)} (${booking.nightCount} nights)
*Rooms:* ${booking.roomCount} × ${booking.roomType}
*Guests:* ${booking.adultCount} adults${booking.childCount ? `, ${booking.childCount} children` : ""}

*Payment:*
* Total: ${booking.currency} ${Number(booking.totalAmount).toLocaleString("en-IN")}
* Paid Online: ${booking.currency} ${Number(booking.amountPaidOnline).toLocaleString("en-IN")}
* Balance: ${booking.currency} ${Number(booking.balanceAmount).toLocaleString("en-IN")}
* Status: ${booking.paymentStatus}

*Property:*
${booking.propertyAddress}
Phone: ${booking.propertyPhone}
Caretaker: ${booking.caretakerNumber}

*Map:* ${booking.mapLink}

We look forward to hosting you!
    `.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showSuccessToast("Booking summary copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showErrorToast("Could not write to clipboard.");
      haptic("error");
    }
  }

  function startEdit() {
    if (!booking) return;
    setEditForm({
      guestFullName: booking.guestFullName,
      guestEmail: booking.guestEmail || "",
      guestPhone: booking.guestPhone || "",
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      roomCount: booking.roomCount,
      roomType: booking.roomType,
      totalAmount: booking.totalAmount,
      amountPaidOnline: booking.amountPaidOnline,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests,
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditForm({});
  }

  async function handleEditSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!booking || !editForm) return;
    setSavingEdit(true);
    haptic("light");
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking.id, ...editForm }),
    });
    const json = await res.json();
    setSavingEdit(true);
    if (json.booking) {
      setBooking(json.booking);
      setIsEditing(false);
      setEditForm({});
      setSavingEdit(false);
      showSuccessToast("Booking details updated.");
      haptic("success");
    } else {
      setSavingEdit(false);
      showErrorToast(json.error || "Failed to save details.");
      haptic("error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground/60 text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
          <span>Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/1 p-10 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg mx-auto">
          ⚠️
        </div>
        <h3 className="font-bold text-sm text-foreground">Booking not found</h3>
        <p className="text-xs text-muted-foreground/60 font-medium">
          The booking you are looking for might have been deleted or archived.
        </p>
        <button
          onClick={() => {
            router.push("/dashboard/bookings");
            haptic("light");
          }}
          className="mt-4 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const roomTypeOptions = Array.from(
    new Set(
      ["Balcony Room", "Non-Balcony Room", booking.roomType].filter(Boolean),
    ),
  ) as string[];

  // Direct Communication anchors
  const phoneCallLink = booking.guestPhone ? `tel:${booking.guestPhone}` : "#";
  const whatsappLink = booking.guestPhone
    ? `https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, "")}`
    : "#";

  // Content groups to display contextually
  const DetailsGroup = () => (
    <div className="space-y-5">
      {/* Stay Timeline Representation */}
      <div className="rounded-3xl border border-white/5 bg-[#0c0c0c]/45 p-5 space-y-4 relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/15 flex items-center justify-center text-teal-400">
            <CalendarCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
              Stay Timeline
            </h3>
            <p className="text-[10px] text-muted-foreground/50 font-medium">
              Dates and duration of visit
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 items-center relative gap-3 pt-2">
          <div className="space-y-1">
            <span className="text-[9px] text-muted-foreground/45 font-black uppercase block">
              Check-in
            </span>
            <span className="text-sm font-black text-foreground">
              {formatDate(booking.checkInDate)}
            </span>
            <span className="text-[10px] text-muted-foreground/60 block font-semibold">
              After {booking.checkInTime}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-teal-400 font-black tracking-wider uppercase">
              {booking.nightCount} Night{booking.nightCount > 1 ? "s" : ""}
            </span>
            <div className="w-full h-[1.5px] bg-linear-to-r from-transparent via-teal-500/40 to-transparent relative my-1">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] text-muted-foreground/45 font-black uppercase block">
              Check-out
            </span>
            <span className="text-sm font-black text-foreground">
              {formatDate(booking.checkOutDate)}
            </span>
            <span className="text-[10px] text-muted-foreground/60 block font-semibold">
              By {booking.checkOutTime}
            </span>
          </div>
        </div>
      </div>

      {/* Guest card with quick direct call/whatsapp actions */}
      <DetailCard title="Guest Information" icon={User}>
        <DetailRow label="Primary Guest" value={booking.guestFullName} />
        <DetailRow
          label="Email Address"
          value={booking.guestEmail || "No Email"}
        />
        <DetailRow
          label="WhatsApp Phone"
          value={
            booking.guestPhone ? (
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <a
                  href={phoneCallLink}
                  onClick={() => haptic("light")}
                  className="text-teal-400 hover:text-teal-300 font-extrabold flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
                <span className="text-white/10">|</span>
                <a
                  href={whatsappLink}
                  target="_blank"
                  onClick={() => haptic("light")}
                  className="text-teal-400 hover:text-teal-300 font-extrabold flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <span className="text-white/10">|</span>
                <span className="text-foreground">{booking.guestPhone}</span>
              </div>
            ) : (
              "No Phone"
            )
          }
        />
        <DetailRow
          label="Group Size"
          value={`${booking.adultCount} Adults, ${booking.childCount} Children`}
        />
      </DetailCard>

      <DetailCard title="Stay Details" icon={BedDouble}>
        <DetailRow
          label="Room Allocation"
          value={`${booking.roomCount} × ${booking.roomType}`}
        />
        {booking.extraMattressCount > 0 && (
          <DetailRow
            label="Extra Mattresses"
            value={`${booking.extraMattressCount} Unit${booking.extraMattressCount > 1 ? "s" : ""}`}
          />
        )}
        <DetailRow
          label="Meal Plan"
          value={booking.mealPlan ? booking.mealPlan : "No Meals Included"}
        />
      </DetailCard>
    </div>
  );

  const LedgerGroup = () => (
    <div className="space-y-5">
      {/* Financial Overview Card */}
      <div className="rounded-2xl border border-white/5 bg-[#0d0d0d]/40 p-4 sm:p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/15 flex items-center justify-center text-teal-400">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
              Financial Ledger
            </h3>
          </div>
          <span
            className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${
              booking.paymentStatus === "paid_in_full"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                : booking.paymentStatus === "partially_paid"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
            }`}
          >
            {booking.paymentStatus.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="bg-white/1 border border-white/[0.03] p-3 rounded-xl space-y-0.5">
            <span className="text-[9px] text-muted-foreground/40 uppercase font-black">
              Total Amount
            </span>
            <div className="text-base font-black text-foreground">
              {booking.currency}{" "}
              {Number(booking.totalAmount).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="bg-white/1 border border-white/[0.03] p-3 rounded-xl space-y-0.5">
            <span className="text-[9px] text-muted-foreground/40 uppercase font-black">
              Paid Online
            </span>
            <div className="text-base font-black text-emerald-400">
              {booking.currency}{" "}
              {Number(booking.amountPaidOnline).toLocaleString("en-IN")}
            </div>
          </div>
          <div
            className={`p-3 rounded-xl space-y-0.5 border ${
              booking.balanceAmount > 0
                ? "bg-amber-500/5 border-amber-500/15"
                : "bg-emerald-500/5 border-emerald-500/15"
            }`}
          >
            <span className="text-[9px] text-muted-foreground/40 uppercase font-black">
              Outstanding Balance
            </span>
            <div
              className={`text-base font-black ${booking.balanceAmount > 0 ? "text-amber-400" : "text-emerald-400"}`}
            >
              {booking.currency}{" "}
              {Number(booking.balanceAmount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      <DetailCard title="Property Info & Map" icon={Home}>
        <DetailRow label="Property Name" value="The Stream by Ekantah" />
        <DetailRow label="Property Address" value={booking.propertyAddress} />
        <DetailRow label="Property Hotline" value={booking.propertyPhone} />
        <DetailRow label="Property Email" value={booking.propertyEmail} />
        <DetailRow label="Caretaker Number" value={booking.caretakerNumber} />
        <DetailRow label="Parking Access" value={booking.parkingDetails} />
        <DetailRow
          label="Directions URL"
          value={
            <a
              href={booking.mapLink}
              target="_blank"
              onClick={() => haptic("light")}
              className="inline-flex items-center gap-1 text-teal-400 hover:underline font-extrabold"
            >
              <span>Open Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          }
        />
      </DetailCard>

      <DetailCard title="Policies & Specific Requests" icon={ShieldCheck}>
        <DetailRow
          label="Cancellation Guidelines"
          value={booking.cancellationPolicy}
        />
        <DetailRow
          label="Special Requests / Loss of Pay notes"
          value={booking.specialRequests || "None shared."}
        />
      </DetailCard>
    </div>
  );

  const HistoryGroup = () => (
    <div className="space-y-5">
      {/* Lifecycle Status controls */}
      <div className="rounded-3xl border border-white/5 bg-[#0d0d0d]/45 p-4 sm:p-5 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
            Booking Lifecycle
          </span>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              booking.status === "confirmed"
                ? "bg-green-500/10 text-green-400 border border-green-500/15"
                : booking.status === "cancelled"
                  ? "bg-red-500/10 text-red-400 border border-red-500/15"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/15"
            }`}
          >
            {booking.status}
          </span>
        </div>

        {booking.status === "confirmed" && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                startEdit();
                haptic("light");
              }}
              className="flex-1 py-2 rounded-xl bg-white/4 border border-white/5 text-xs font-bold hover:bg-white/8 hover:border-teal-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-foreground animate-in fade-in duration-200"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Reservation</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="py-2 px-4 rounded-xl bg-rose-500/10 border border-rose-500/15 hover:bg-rose-500/20 active:scale-[0.97] transition-all text-xs font-bold text-rose-400 disabled:opacity-30 cursor-pointer"
            >
              {cancelling ? "Cancelling..." : "Cancel"}
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions Card */}
      <div className="rounded-3xl border border-white/5 bg-[#0d0d0d]/45 p-4 sm:p-5 space-y-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
            Utility Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            icon={<Download className="w-4.5 h-4.5" />}
            label={pdfLoading ? "PDF Generating..." : "Download PDF"}
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          />
          <ActionButton
            icon={<Printer className="w-4.5 h-4.5" />}
            label="Print Invoice"
            onClick={handlePrintInvoice}
          />
          <ActionButton
            icon={<Smartphone className="w-4.5 h-4.5" />}
            label={waSending ? "Sending..." : "WhatsApp Invoice"}
            onClick={() => handleSendWhatsApp(true)}
            disabled={waSending || !waStatus?.isConnected}
          />
          <ActionButton
            icon={<MessageCircle className="w-4.5 h-4.5" />}
            label={waSending ? "Sending..." : "WhatsApp Text"}
            onClick={() => handleSendWhatsApp(false)}
            disabled={waSending || !waStatus?.isConnected}
          />
          <ActionButton
            icon={
              copied ? (
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              ) : (
                <Copy className="w-4.5 h-4.5" />
              )
            }
            label={copied ? "Copied!" : "Copy Summary"}
            onClick={handleCopySummary}
          />
          <ActionButton
            icon={<ExternalLink className="w-4.5 h-4.5" />}
            label="Map Directions"
            onClick={() => window.open(booking.mapLink, "_blank")}
          />
        </div>
      </div>

      {/* Send Manual Communication form */}
      <div className="rounded-3xl border border-white/5 bg-[#0d0d0d]/45 p-4 sm:p-5 space-y-4 backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
            Send Communication
          </h3>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-muted-foreground/60 uppercase tracking-wide mb-1">
              Template Type
            </label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-white/[0.07] bg-[#0c0c0c]/90 px-3 py-2 focus:outline-none focus:border-teal-500/35 transition cursor-pointer"
            >
              <option value="booking_confirmation">Booking Confirmation</option>
              <option value="cancellation">Cancellation Notice</option>
              <option value="notification">General Notification</option>
              <option value="thank_you">Thank You Note</option>
              <option value="refund_credited">Refund Confirmation</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-muted-foreground/60 uppercase tracking-wide mb-1">
              Send To
            </label>
            <input
              type="text"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-white/[0.07] bg-[#0c0c0c]/90 px-3 py-2 focus:outline-none focus:border-teal-500/35 transition"
              placeholder="guest@example.com"
            />
          </div>

          <div>
            <label className="block font-bold text-muted-foreground/60 uppercase tracking-wide mb-1">
              Cc Address
            </label>
            <input
              type="text"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-white/[0.07] bg-[#0c0c0c]/90 px-3 py-2 focus:outline-none focus:border-teal-500/35 transition"
              placeholder="admin@example.com"
            />
          </div>

          {(emailType === "cancellation" ||
            emailType === "notification" ||
            emailType === "refund_credited") && (
            <div>
              <label className="block font-bold text-muted-foreground/60 uppercase tracking-wide mb-1">
                Custom Memo Details
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full text-xs font-medium rounded-xl border border-white/[0.07] bg-[#0c0c0c]/90 px-3 py-2 focus:outline-none focus:border-teal-500/35 transition"
                placeholder="Provide customized memo text here..."
              />
            </div>
          )}

          <div className="flex gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => {
                handlePreview();
                haptic("light");
              }}
              className="flex-1 py-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 active:scale-[0.98] transition-all text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Preview HTML
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-2.5 rounded-xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all text-xs font-bold disabled:opacity-30 cursor-pointer"
            >
              {sending ? "Sending..." : "Dispatch Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Email dispatches */}
      <div className="rounded-3xl border border-white/5 bg-[#0d0d0d]/45 p-4 sm:p-5 space-y-3 backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
            <History className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
            Email Logs
          </h3>
        </div>
        {booking.emailsSent.length === 0 ? (
          <p className="text-muted-foreground/45 text-[11px] font-bold py-1">
            No emails dispatched yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {booking.emailsSent.map((e) => (
              <div
                key={e.id}
                className="text-[11px] font-semibold border-b border-white/[0.03] pb-2 last:border-0 last:pb-0 flex flex-col gap-0.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold capitalize text-foreground">
                    {e.type.replace("_", " ")}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-sm ${
                      e.status === "sent"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
                <div className="text-muted-foreground/50 flex justify-between items-center text-[10px]">
                  <span className="truncate max-w-[120px]">{e.toEmail}</span>
                  <span>{formatDate(e.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp dispatches */}
      <div className="rounded-3xl border border-white/5 bg-[#0d0d0d]/45 p-4 sm:p-5 space-y-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
              WhatsApp Logs
            </h3>
          </div>
          {waStatus && (
            <span
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                waStatus.isConnected
                  ? "bg-green-500/10 text-green-400 border-green-500/15"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/15 animate-pulse"
              }`}
            >
              {waStatus.isConnected ? "Connected" : "Not Linked"}
            </span>
          )}
        </div>

        {waStatus?.qrCode && !waStatus?.isConnected && (
          <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/15 flex flex-col items-center text-center gap-2 relative overflow-hidden">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse absolute top-2.5 right-2.5" />
            <p className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider">
              Scan QR with WA App
            </p>
            <img
              src={waStatus.qrCode}
              alt="WhatsApp QR Code"
              className="w-32 h-32 rounded-xl border border-white/10"
            />
          </div>
        )}

        {booking.whatsappMessages.length === 0 ? (
          <p className="text-muted-foreground/45 text-[11px] font-bold py-1">
            No chats dispatched yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {booking.whatsappMessages.map((m) => (
              <div
                key={m.id}
                className="text-[11px] font-semibold border-b border-white/[0.03] pb-2 last:border-0 last:pb-0 flex flex-col gap-0.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold capitalize text-foreground flex items-center gap-1">
                    <span>{m.type.replace("_", " ")}</span>
                    {m.hasPdf && (
                      <span className="text-[8px] font-black text-teal-400/90 uppercase tracking-widest bg-teal-500/10 px-1 rounded-sm">
                        +pdf
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-sm ${
                      m.status === "sent"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="text-muted-foreground/50 flex justify-between items-center text-[10px]">
                  <span>{m.toPhone}</span>
                  <span>{formatDate(m.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Common Edit Form Inputs
  const FormContent = () => (
    <div className="space-y-6">
      {/* Section 1: Guest Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-1.5">
          <User className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-black uppercase tracking-wider text-teal-400">
            Guest Information
          </span>
        </div>
        <Input
          label="Full Name"
          value={editForm.guestFullName || ""}
          onChange={(v) =>
            setEditForm((prev) => ({ ...prev, guestFullName: v }))
          }
          placeholder="Rahul Sharma"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            value={editForm.guestEmail || ""}
            onChange={(v) =>
              setEditForm((prev) => ({ ...prev, guestEmail: v }))
            }
            placeholder="guest@example.com"
            type="email"
          />
          <Input
            label="WhatsApp Phone"
            value={editForm.guestPhone || ""}
            onChange={(v) =>
              setEditForm((prev) => ({ ...prev, guestPhone: v }))
            }
            placeholder="+91 ..."
            type="tel"
          />
        </div>
      </div>

      {/* Section 2: Stay Dates & Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-1.5">
          <BedDouble className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-black uppercase tracking-wider text-teal-400">
            Stay Configuration
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Check-in Date"
            value={editForm.checkInDate ? new Date(editForm.checkInDate) : null}
            onChange={(d) => {
              const checkInStr = d ? toISODateString(d) : "";
              setEditForm((prev) => {
                const next = { ...prev, checkInDate: checkInStr };
                if (prev.checkOutDate && checkInStr >= prev.checkOutDate) {
                  const nextDay = new Date(d);
                  nextDay.setDate(nextDay.getDate() + 1);
                  next.checkOutDate = toISODateString(nextDay);
                }
                return next;
              });
            }}
            minDate={new Date()}
          />
          <DatePicker
            label="Check-out Date"
            value={
              editForm.checkOutDate ? new Date(editForm.checkOutDate) : null
            }
            onChange={(d) => {
              const checkOutStr = d ? toISODateString(d) : "";
              setEditForm((prev) => ({ ...prev, checkOutDate: checkOutStr }));
            }}
            minDate={
              editForm.checkInDate
                ? new Date(new Date(editForm.checkInDate).getTime() + 86400000)
                : new Date()
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GuestCounter
            label="Room Count"
            value={editForm.roomCount || 1}
            onChange={(v) => setEditForm((prev) => ({ ...prev, roomCount: v }))}
            min={1}
          />
          <Select
            label="Room Type"
            value={editForm.roomType || ""}
            onChange={(v) => setEditForm((prev) => ({ ...prev, roomType: v }))}
            options={roomTypeOptions}
          />
        </div>
      </div>

      {/* Section 3: Financials & Statuses */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-1.5">
          <CreditCard className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-black uppercase tracking-wider text-teal-400">
            Financials & Status
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Total Stay Cost (₹)"
            value={String(editForm.totalAmount || 0)}
            onChange={(v) =>
              setEditForm((prev) => ({ ...prev, totalAmount: Number(v) }))
            }
            type="number"
          />
          <Input
            label="Amount Paid Online (₹)"
            value={String(editForm.amountPaidOnline || 0)}
            onChange={(v) =>
              setEditForm((prev) => ({ ...prev, amountPaidOnline: Number(v) }))
            }
            type="number"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Booking Status"
            value={editForm.status || ""}
            onChange={(v) => setEditForm((prev) => ({ ...prev, status: v }))}
            options={["confirmed", "cancelled", "completed", "archived"]}
          />
          <Select
            label="Payment Status Override"
            value={editForm.paymentStatus || ""}
            onChange={(v) =>
              setEditForm((prev) => ({ ...prev, paymentStatus: v }))
            }
            options={["pending", "partially_paid", "paid_in_full", "refunded"]}
          />
        </div>
      </div>

      {/* Section 4: Special Notes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.03] pb-1.5">
          <Info className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-black uppercase tracking-wider text-teal-400">
            Notes & Requests
          </span>
        </div>
        <TextArea
          label="Special Requests / Loss of Pay Note"
          value={editForm.specialRequests || ""}
          onChange={(v) =>
            setEditForm((prev) => ({ ...prev, specialRequests: v }))
          }
          placeholder="Loss of pay details or customized requests..."
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Back Link */}
      <button
        type="button"
        onClick={() => {
          router.push("/dashboard/bookings");
          haptic("light");
        }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground font-extrabold transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Bookings</span>
      </button>

      {/* Main Grid Layout: Responsive 3 Columns */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Columns (Span 2 on lg) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Desktop Inline Form */}
          {isEditing && (
            <div className="hidden lg:block">
              <form
                onSubmit={handleEditSave}
                className="rounded-3xl border border-white/5 bg-[#0d0d0d]/80 p-5 sm:p-7 space-y-6 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-b from-teal-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <h2 className="text-base font-black tracking-tight text-foreground">
                      Edit Booking Details
                    </h2>
                    <p className="text-[11px] text-muted-foreground/50 font-medium mt-0.5">
                      Modify guest info, stay dates, and payment values.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      cancelEdit();
                      haptic("light");
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <FormContent />
                <div className="pt-4 flex gap-3 border-t border-white/[0.06]">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 rounded-2xl bg-foreground text-background py-3.5 text-sm font-extrabold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {savingEdit ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Desktop Info Views (Hidden when editing on desktop) */}
          {!isEditing && (
            <div className="hidden lg:block space-y-5">
              <DetailsGroup />
              <LedgerGroup />
            </div>
          )}

          {/* Mobile Floating Dock (MagicUI-style) */}
          <div className="lg:hidden sticky top-0 z-40 flex justify-center mb-4 pt-1 px-4">
            <div className="flex items-center gap-1 rounded-2xl border border-white/8 bg-[#0a0a0a]/85 backdrop-blur-2xl p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
              {[
                { key: "details" as const, label: "Details", icon: User },
                { key: "ledger" as const, label: "Ledger", icon: CreditCard },
                { key: "manage" as const, label: "Manage", icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveMobileTab(tab.key);
                    haptic("light");
                  }}
                  className="relative flex flex-col items-center justify-center min-w-[68px] py-2 px-3 rounded-xl select-none"
                >
                  {activeMobileTab === tab.key && (
                    <motion.div
                      layoutId="mobileDockPill"
                      className="absolute inset-0 bg-foreground/10 rounded-xl border border-white/5"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 text-[9px] font-black mb-0.5 transition-colors duration-200 ${
                      activeMobileTab === tab.key
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {tab.label}
                  </span>
                  <motion.div
                    animate={{
                      scale: activeMobileTab === tab.key ? 1.2 : 1,
                      y: activeMobileTab === tab.key ? 2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 18 }}
                    className="relative z-10"
                  >
                    <tab.icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        activeMobileTab === tab.key
                          ? "text-teal-400"
                          : "text-muted-foreground/50"
                      }`}
                    />
                  </motion.div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Tab-Based View (Only visible on screens < lg) */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMobileTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {activeMobileTab === "details" && <DetailsGroup />}
                {activeMobileTab === "ledger" && <LedgerGroup />}
                {activeMobileTab === "manage" && <HistoryGroup />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column (Span 1 on lg) - Actions & History Sidebar (Desktop only) */}
        <div className="hidden lg:block">
          <HistoryGroup />
        </div>
      </div>

      {/* Mobile Vaul Slide-Up Edit Form Drawer (Visible on mobile screens only) */}
      <div className="lg:hidden">
        <Drawer
          open={isEditing}
          onOpenChange={(open) => {
            if (!open) cancelEdit();
          }}
        >
          <DrawerContent className="h-[90dvh] flex flex-col p-4 bg-[#0d0d0d] border-t border-white/5">
            <DrawerTitle className="text-sm font-black text-foreground uppercase tracking-wider mb-1">
              Edit Booking
            </DrawerTitle>
            <DrawerDescription className="text-[10px] text-muted-foreground/50 mb-4">
              Modify reservation information
            </DrawerDescription>
            <div className="flex-1 overflow-y-auto pb-4 pr-1">
              <FormContent />
            </div>
            <div className="pt-3 border-t border-white/[0.06] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  cancelEdit();
                  haptic("light");
                }}
                className="flex-1 py-3 rounded-2xl border border-white/5 bg-white/2 text-xs font-extrabold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleEditSave()}
                disabled={savingEdit}
                className="flex-1 py-3 rounded-2xl bg-foreground text-background text-xs font-extrabold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

// Visual layout card container
function DetailCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0d0d0d]/40 p-4 sm:p-5 space-y-4 relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/15 flex items-center justify-center text-teal-400">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
          {title}
        </h3>
      </div>
      <div className="space-y-1.5 divide-y divide-white/[0.03]">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center text-xs py-2 first:pt-0">
      <span className="text-muted-foreground/60 font-semibold">{label}</span>
      <span className="font-extrabold text-foreground text-right">{value}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/3 p-3 text-center text-xs font-bold hover:bg-teal-500/10 hover:border-teal-500/20 active:scale-95 transition-all text-muted-foreground hover:text-teal-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
    >
      <div className="shrink-0">{icon}</div>
      <span className="text-[9px] uppercase tracking-wider font-extrabold whitespace-nowrap">
        {label}
      </span>
    </motion.button>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
          isFocused ? "text-teal-400" : "text-muted-foreground/60"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={rows}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-[#0c0c0c]/90 px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/30 focus:outline-none ${
            isFocused
              ? "border-teal-500/40 shadow-[0_0_24px_-6px_rgba(20,184,166,0.2)] ring-1 ring-teal-500/15"
              : "border-white/[0.07] hover:border-white/15"
          }`}
        />
      </div>
    </div>
  );
}
