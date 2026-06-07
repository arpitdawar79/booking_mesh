"use client";

import { Copy, Eye, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

export interface BookingActionsProps {
  id: string;
  bookingId: string;
  guestFullName: string;
  guestEmail: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  nightCount: number;
  totalAmount: number;
  amountPaidOnline: number;
  balanceAmount: number;
  status: string;
  roomCount: number;
  roomType: string;
  copiedId: string | null;
  onCopy: (id: string) => void;
  onEmail: (id: string, email: string) => void;
  onWhatsApp: (b: BookingActionsProps) => void;
  size?: "sm" | "md";
}

function fmtDate(d: string | Date): string {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  return d.toISOString().split("T")[0];
}

export function BookingActions({
  id,
  bookingId,
  guestFullName,
  guestEmail,
  checkInDate,
  checkOutDate,
  nightCount,
  totalAmount,
  amountPaidOnline,
  balanceAmount,
  status,
  roomCount,
  roomType,
  copiedId,
  onCopy,
  onEmail,
  onWhatsApp,
  size = "md",
}: BookingActionsProps) {
  const handleCopy = () => {
    const text = `
Booking #${bookingId} – ${guestFullName}
Dates: ${fmtDate(checkInDate)} → ${fmtDate(checkOutDate)}
Nights: ${nightCount} | Rooms: ${roomCount} × ${roomType}
Total: ₹${totalAmount} | Paid: ₹${amountPaidOnline} | Balance: ₹${balanceAmount}
Status: ${status}
    `.trim();
    navigator.clipboard.writeText(text).then(() => onCopy(id));
  };

  const handleWhatsApp = () => {
    const text = `Booking confirmation #%23${bookingId} for ${guestFullName}. Dates: ${fmtDate(checkInDate)} to ${fmtDate(checkOutDate)} (${nightCount} nights). Total: ₹${totalAmount}. The Stream by Ekantah.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    onWhatsApp({ id, bookingId, guestFullName, guestEmail, checkInDate, checkOutDate, nightCount, totalAmount, amountPaidOnline, balanceAmount, status, roomCount, roomType, copiedId, onCopy, onEmail, onWhatsApp });
  };

  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnClass = size === "sm" ? "p-1" : "p-1.5";

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/dashboard/booking/${id}`}
        className={`${btnClass} rounded-md hover:bg-muted transition`}
        title="View"
      >
        <Eye className={iconClass} />
      </Link>
      <button
        onClick={() => onEmail(id, guestEmail)}
        className={`${btnClass} rounded-md hover:bg-muted transition`}
        title="Send Confirmation Email"
      >
        <Mail className={iconClass} />
      </button>
      <button
        onClick={handleWhatsApp}
        className={`${btnClass} rounded-md hover:bg-muted transition`}
        title="Share on WhatsApp"
      >
        <MessageCircle className={iconClass} />
      </button>
      <button
        onClick={handleCopy}
        className={`${btnClass} rounded-md hover:bg-muted transition min-w-[40px]`}
        title="Copy Summary"
      >
        {copiedId === id ? (
          <span className="text-[10px] text-green-400 font-medium">Copied</span>
        ) : (
          <Copy className={iconClass} />
        )}
      </button>
    </div>
  );
}
