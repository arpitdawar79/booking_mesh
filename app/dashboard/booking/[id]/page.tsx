"use client";

import {
  Check,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Printer,
  Send,
  Share2,
  Smartphone,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  bookingId: string;
  guestFirstName: string;
  guestFullName: string;
  guestEmail: string;
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

export default function BookingDetailPage() {
  const params = useParams();
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

  useEffect(() => {
    fetch(`/api/bookings?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const b = data.bookings?.[0] || null;
        setBooking(b);
        if (b) {
          setToEmail(b.guestEmail);
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
      alert("Email sent successfully!");
      window.location.reload();
    } else {
      alert(json.error || "Failed to send email.");
    }
  }

  async function handleSendWhatsApp(sendPdf: boolean) {
    if (!booking) return;
    if (!booking.guestPhone) {
      alert("Guest phone number not available.");
      return;
    }
    if (!waStatus?.isConnected) {
      alert("WhatsApp is not connected. Please scan the QR code first.");
      return;
    }
    setWaSending(true);
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
      alert(`WhatsApp message${sendPdf ? " with PDF" : ""} sent successfully!`);
      window.location.reload();
    } else {
      alert(json.error || "Failed to send WhatsApp message.");
    }
  }

  async function handleCancel() {
    if (!booking) return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking.id, status: "cancelled" }),
    });
    const json = await res.json();
    setCancelling(false);

    if (json.booking) {
      setBooking(json.booking);
      alert("Booking cancelled successfully.");
    } else {
      alert(json.error || "Failed to cancel booking.");
    }
  }

  async function handlePreview() {
    if (!booking) return;
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
      alert("PDF generation failed. Please try again.");
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
  }

  async function handlePrintInvoice() {
    if (!booking) return;
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
    const text = `
*Booking Confirmation – The Stream by Ekantah*

*Guest:* ${booking.guestFullName}
*Booking ID:* #${booking.bookingId}
*Dates:* ${booking.checkInDate} → ${booking.checkOutDate} (${booking.nightCount} nights)
*Rooms:* ${booking.roomCount} × ${booking.roomType}
*Guests:* ${booking.adultCount} adults${booking.childCount ? `, ${booking.childCount} children` : ""}

*Payment:*
• Total: ${booking.currency} ${Number(booking.totalAmount).toLocaleString("en-IN")}
• Paid Online: ${booking.currency} ${Number(booking.amountPaidOnline).toLocaleString("en-IN")}
• Balance: ${booking.currency} ${Number(booking.balanceAmount).toLocaleString("en-IN")}
• Status: ${booking.paymentStatus}

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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  async function handleWhatsAppShare() {
    if (!booking) return;

    // Try native file share first (on mobile this shows WhatsApp as an option)
    const blob = await generatePdfBlob();
    if (blob) {
      const file = new File([blob], `Booking_${booking.bookingId}.pdf`, {
        type: "application/pdf",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Booking ${booking.bookingId}`,
            text: `Booking confirmation for ${booking.guestFullName}`,
            files: [file],
          });
          return;
        } catch {
          // user cancelled or share failed — fall through to text-only
        }
      }
    }

    // Fallback: download PDF + open WhatsApp with text
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Booking_${booking.bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    const text = `Booking confirmation #${booking.bookingId} for ${booking.guestFullName}. Dates: ${booking.checkInDate} to ${booking.checkOutDate} (${booking.nightCount} nights). Total: ${booking.currency} ${Number(booking.totalAmount).toLocaleString("en-IN")}. The Stream by Ekantah.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleWhatsAppToGuest() {
    if (!booking) return;
    const text = `Hi ${booking.guestFirstName}, your booking at The Stream by Ekantah (#${booking.bookingId}) is confirmed. Check-in: ${booking.checkInDate}. We look forward to welcoming you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleNativeShare() {
    if (!booking) return;
    const blob = await generatePdfBlob();
    if (blob) {
      const file = new File([blob], `Booking_${booking.bookingId}.pdf`, {
        type: "application/pdf",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Booking ${booking.bookingId}`,
            text: `Booking confirmation for ${booking.guestFullName}`,
            files: [file],
          });
          return;
        } catch {
          // user cancelled
          return;
        }
      }
    }

    // Fallback to text-only share
    const text = `Booking #${booking.bookingId} – ${booking.guestFullName}. Dates: ${booking.checkInDate} to ${booking.checkOutDate}. Total: ${booking.currency} ${Number(booking.totalAmount).toLocaleString("en-IN")}.`;
    if (navigator.share) {
      navigator
        .share({ title: `Booking ${booking.bookingId}`, text })
        .catch(() => {});
    } else {
      alert("Native sharing not supported on this device.");
    }
  }

  function handlePaymentReminder() {
    if (!booking) return;
    const balance = Number(booking.balanceAmount);
    if (balance <= 0) {
      alert("No outstanding balance.");
      return;
    }
    const subject = `Payment Reminder – Booking #${booking.bookingId}`;
    const body = `Hi ${booking.guestFirstName},%0A%0AThis is a friendly reminder that your booking *#${booking.bookingId}* at *The Stream by Ekantah* has an outstanding balance of *${booking.currency} ${balance.toLocaleString("en-IN")}*.%0A%0ACheck-in: ${booking.checkInDate}%0ACheck-out: ${booking.checkOutDate}%0A%0APlease settle the balance before arrival. Reply for payment details.%0A%0AThank you!`;
    window.location.href = `mailto:${booking.guestEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (!booking)
    return <div className="text-muted-foreground">Booking not found.</div>;

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
      {/* Booking Details */}
      <div className="space-y-5 lg:space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">
            Booking #{booking.bookingId}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {booking.status === "confirmed" && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-lg border border-red-500/50 text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-900/20 disabled:opacity-50 whitespace-nowrap"
              >
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                booking.status === "confirmed"
                  ? "bg-green-900/30 text-green-300"
                  : booking.status === "cancelled"
                    ? "bg-red-900/30 text-red-300"
                    : "bg-blue-900/30 text-blue-300"
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="rounded-xl border border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ActionButton
              icon={<Download className="w-4 h-4" />}
              label={pdfLoading ? "Generating..." : "Download PDF"}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
            />
            <ActionButton
              icon={<Printer className="w-4 h-4" />}
              label="Print Invoice"
              onClick={handlePrintInvoice}
            />
            <ActionButton
              icon={<Smartphone className="w-4 h-4" />}
              label={waSending ? "Sending..." : "WA + PDF"}
              onClick={() => handleSendWhatsApp(true)}
              disabled={waSending || !waStatus?.isConnected}
            />
            <ActionButton
              icon={<MessageCircle className="w-4 h-4" />}
              label={waSending ? "Sending..." : "WA Text"}
              onClick={() => handleSendWhatsApp(false)}
              disabled={waSending || !waStatus?.isConnected}
            />
            <ActionButton
              icon={
                copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
              label={copied ? "Copied!" : "Copy Summary"}
              onClick={handleCopySummary}
            />
            <ActionButton
              icon={<Share2 className="w-4 h-4" />}
              label="Native Share"
              onClick={handleNativeShare}
            />
            <ActionButton
              icon={<Send className="w-4 h-4" />}
              label="Payment Reminder"
              onClick={handlePaymentReminder}
            />
            <ActionButton
              icon={<ExternalLink className="w-4 h-4" />}
              label="Open Map"
              onClick={() => window.open(booking.mapLink, "_blank")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 sm:p-6 space-y-4 text-sm">
          <Section title="Guest">
            <Detail label="Name" value={booking.guestFullName} />
            <Detail label="Email" value={booking.guestEmail} />
            <Detail label="Phone" value={booking.guestPhone || "—"} />
            <Detail
              label="Guests"
              value={`${booking.adultCount} adults, ${booking.childCount} children`}
            />
          </Section>

          <Section title="Stay">
            <Detail
              label="Check-in"
              value={`${booking.checkInDate} after ${booking.checkInTime}`}
            />
            <Detail
              label="Check-out"
              value={`${booking.checkOutDate} by ${booking.checkOutTime}`}
            />
            <Detail label="Nights" value={String(booking.nightCount)} />
            <Detail
              label="Rooms"
              value={`${booking.roomCount} × ${booking.roomType}`}
            />
            <Detail label="Meal Plan" value={booking.mealPlan} />
          </Section>

          <Section title="Payment">
            <Detail
              label="Total"
              value={`${booking.currency} ${Number(booking.totalAmount).toLocaleString("en-IN")}`}
            />
            <Detail
              label="Paid Online"
              value={`${booking.currency} ${Number(booking.amountPaidOnline).toLocaleString("en-IN")}`}
            />
            <Detail
              label="Balance"
              value={`${booking.currency} ${Number(booking.balanceAmount).toLocaleString("en-IN")}`}
            />
            <Detail label="Status" value={booking.paymentStatus} />
          </Section>

          <Section title="Property">
            <Detail label="Address" value={booking.propertyAddress} />
            <Detail label="Phone" value={booking.propertyPhone} />
            <Detail label="Email" value={booking.propertyEmail} />
            <Detail label="Care Taker" value={booking.caretakerNumber} />
            <Detail label="Parking" value={booking.parkingDetails} />
            <Detail
              label="Map"
              value={
                <a
                  href={booking.mapLink}
                  target="_blank"
                  className="underline text-muted-foreground hover:text-foreground"
                >
                  Open Map
                </a>
              }
            />
          </Section>

          <Section title="Policies">
            <Detail label="Cancellation" value={booking.cancellationPolicy} />
            <Detail label="Special Requests" value={booking.specialRequests} />
          </Section>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Email History
          </h2>
          {booking.emailsSent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No emails sent yet.</p>
          ) : (
            <div className="space-y-2">
              {booking.emailsSent.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between text-sm border-b border-border pb-2"
                >
                  <div>
                    <span className="font-medium capitalize">
                      {e.type.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      to {e.toEmail}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${e.status === "sent" ? "text-green-400" : "text-red-400"}`}
                  >
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              WhatsApp History
            </h2>
            {waStatus && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  waStatus.isConnected
                    ? "bg-green-900/30 text-green-300"
                    : "bg-yellow-900/30 text-yellow-300"
                }`}
              >
                {waStatus.isConnected ? "Connected" : "Disconnected"}
              </span>
            )}
          </div>
          {waStatus?.qrCode && !waStatus?.isConnected && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
              <p className="text-xs text-yellow-300 mb-2 font-medium">
                Scan this QR code with WhatsApp to connect
              </p>
              <img
                src={waStatus.qrCode}
                alt="WhatsApp QR Code"
                className="w-48 h-48 rounded-lg"
              />
            </div>
          )}
          {booking.whatsappMessages.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No WhatsApp messages sent yet.
            </p>
          ) : (
            <div className="space-y-2">
              {booking.whatsappMessages.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-sm border-b border-border pb-2"
                >
                  <div>
                    <span className="font-medium capitalize">
                      {m.type.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      to {m.toPhone}
                    </span>
                    {m.hasPdf && (
                      <span className="text-blue-400 ml-1 text-[10px]">
                        +PDF
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs ${m.status === "sent" ? "text-green-400" : "text-red-400"}`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Email */}
      <div>
        <div className="rounded-xl border border-border p-4 sm:p-6 space-y-4 lg:sticky lg:top-8">
          <h2 className="text-base sm:text-lg font-semibold">Send Email</h2>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Email Type
              </label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              >
                <option value="booking_confirmation">
                  Booking Confirmation
                </option>
                <option value="cancellation">Cancellation</option>
                <option value="notification">Notification</option>
                <option value="thank_you">Thank You</option>
                <option value="refund_credited">Refund Credited</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">To</label>
              <input
                type="text"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="guest@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Cc (optional)
              </label>
              <input
                type="text"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="admin@example.com"
              />
            </div>

            {(emailType === "cancellation" ||
              emailType === "notification" ||
              emailType === "refund_credited") && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Custom Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="Enter a custom message..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePreview}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted active:scale-[0.98] transition"
              >
                Preview
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition"
              >
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 rounded-md border border-border p-2.5 text-xs font-medium hover:bg-muted transition disabled:opacity-50"
    >
      {icon}
      <span className="text-[11px]">{label}</span>
    </button>
  );
}
