"use client";

import {
    ReviewRow,
    ReviewSection,
    StepCard,
} from "@/components/ui/form-primitives";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarDays,
    Check,
    CircleDollarSign,
    HeartHandshake,
    MapPin,
    Users,
} from "lucide-react";

interface RoomAllocation {
  id: string;
  roomType: string;
  count: number;
}

interface Props {
  guestFullName: string;
  guestPhone: string;
  guestEmail: string;
  adultCount: number;
  childCount: number;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  checkInTime: string;
  checkOutTime: string;
  roomCount: number;
  roomAllocations: RoomAllocation[];
  extraMattressCount: number;
  mealPlan: string[];
  totalAmount: string;
  amountPaidOnline: string;
  currency: string;
  nightCount: number;
}

export function ReviewStep({
  guestFullName,
  guestPhone,
  guestEmail,
  adultCount,
  childCount,
  checkInDate,
  checkOutDate,
  checkInTime,
  checkOutTime,
  roomCount,
  roomAllocations,
  extraMattressCount,
  mealPlan,
  totalAmount,
  amountPaidOnline,
  currency,
  nightCount,
}: Props) {
  const total = Number(totalAmount || 0);
  const paid = Number(amountPaidOnline || 0);
  const balance = Math.max(0, total - paid);

  const formattedDate = (d: Date | null) => {
    if (!d) return "—";
    try {
      return format(d, "EEE, MMM dd, yyyy");
    } catch {
      return "—";
    }
  };

  return (
    <StepCard
      icon={<Check className="w-5 h-5" />}
      title="Review & Confirm"
      subtitle="Double-check everything before booking registration"
    >
      <div className="space-y-4">
        {/* Guest Credentials Card */}
        <ReviewSection
          title="Primary Guest"
          icon={<Users className="w-4 h-4" />}
        >
          <ReviewRow label="Full Name" value={guestFullName || "—"} />
          <ReviewRow label="Phone Number" value={guestPhone || "—"} />
          <ReviewRow label="Email Address" value={guestEmail || "—"} />
          <ReviewRow
            label="Total Guests"
            value={
              <span className="text-primary font-extrabold">
                {adultCount} Adult{adultCount > 1 ? "s" : ""}, {childCount}{" "}
                Child{childCount !== 1 ? "ren" : ""}
              </span>
            }
          />
        </ReviewSection>

        {/* Accommodation and Stay Card */}
        <ReviewSection
          title="Stay & Rooms"
          icon={<CalendarDays className="w-4 h-4" />}
        >
          <ReviewRow
            label="Timeline"
            value={
              <div className="text-right">
                <span className="block font-black text-foreground">
                  {formattedDate(checkInDate)} &rarr;{" "}
                  {formattedDate(checkOutDate)}
                </span>
                <span className="text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md inline-block mt-1">
                  {nightCount} Night{nightCount > 1 ? "s" : ""} Stay
                </span>
              </div>
            }
          />
          <ReviewRow
            label="Timings"
            value={`In: ${checkInTime} | Out: ${checkOutTime}`}
          />
          <ReviewRow
            label="Room Allocations"
            value={
              <span className="text-foreground font-extrabold">
                {roomCount} Room{roomCount > 1 ? "s" : ""} (
                {roomAllocations.length > 0
                  ? roomAllocations
                      .map((r) => `${r.count} ${r.roomType}`)
                      .join(", ")
                  : "None allocated"}
                )
              </span>
            }
          />
          {extraMattressCount > 0 && (
            <ReviewRow
              label="Extra Mattresses"
              value={`${extraMattressCount} Mattress${extraMattressCount > 1 ? "es" : ""}`}
            />
          )}
          <ReviewRow
            label="Meal Inclusions"
            value={
              mealPlan.length > 0 ? (
                <div className="flex flex-wrap gap-1 justify-end">
                  {mealPlan.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-lg text-foreground font-extrabold uppercase"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                "None included"
              )
            }
          />
        </ReviewSection>

        {/* Ledger and Bills Card */}
        <ReviewSection
          title="Payment Ledger"
          icon={<CircleDollarSign className="w-4 h-4" />}
        >
          <ReviewRow
            label="Invoice Amount"
            value={
              <span className="text-foreground font-black text-base">
                {currency} {total.toLocaleString("en-IN")}
              </span>
            }
          />
          <ReviewRow
            label="Paid Online"
            value={
              <span className="text-primary font-extrabold">
                {currency} {paid.toLocaleString("en-IN")}
              </span>
            }
          />
          <ReviewRow
            label="Remaining Balance"
            value={
              <span
                className={cn(
                  "font-black text-base px-2.5 py-0.5 rounded-xl border",
                  balance > 0
                    ? "text-orange-600 dark:text-orange-400 bg-orange-500/5 border-orange-500/10"
                    : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
                )}
              >
                {currency} {balance.toLocaleString("en-IN")}
              </span>
            }
          />
        </ReviewSection>

        {/* Resort Properties Info Card */}
        <ReviewSection
          title="Property Details"
          icon={<MapPin className="w-4 h-4" />}
        >
          <ReviewRow
            label="Resort Location"
            value="The Stream by Ekantah, Tirthan Valley"
          />
          <ReviewRow label="Concierge Hotline" value="+91 93193 47443" />
        </ReviewSection>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-3.5 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <HeartHandshake className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="space-y-1 relative z-10">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Ekantah Hospitality Guarantee
            </h4>
            <p className="text-[11px] text-muted-foreground/60 font-medium leading-relaxed">
              Once created, a booking confirmation will be generated, sending
              instant digital receipts, map links, check-in instructions, and
              dynamic templates to the guest.
            </p>
          </div>
        </div>
      </div>
    </StepCard>
  );
}
