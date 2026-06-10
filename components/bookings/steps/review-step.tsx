"use client";

import { ReviewSection, ReviewRow, StepCard } from "@/components/ui/form-primitives";
import { Check, Users, CalendarDays, CircleDollarSign, MapPin } from "lucide-react";
import { format } from "date-fns";

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

  return (
    <StepCard icon={<Check className="w-5 h-5" />} title="Review & Create" subtitle="Double-check everything looks right.">
      <div className="space-y-4">
        <ReviewSection title="Guest" icon={<Users className="w-3.5 h-3.5" />}>
          <ReviewRow label="Name" value={guestFullName || "—"} />
          <ReviewRow label="Phone" value={guestPhone || "—"} />
          <ReviewRow label="Email" value={guestEmail || "—"} />
          <ReviewRow label="Guests" value={`${adultCount} adults, ${childCount} children`} />
        </ReviewSection>

        <ReviewSection title="Stay" icon={<CalendarDays className="w-3.5 h-3.5" />}>
          <ReviewRow
            label="Dates"
            value={`${checkInDate ? format(checkInDate, "yyyy-MM-dd") : "—"} → ${checkOutDate ? format(checkOutDate, "yyyy-MM-dd") : "—"} (${nightCount} nights)`}
          />
          <ReviewRow label="Times" value={`${checkInTime} — ${checkOutTime}`} />
          <ReviewRow label="Rooms" value={`${roomCount} × ${roomAllocations.map((r) => `${r.count} ${r.roomType}`).join(", ")}`} />
          {extraMattressCount > 0 && <ReviewRow label="Extra Mattresses" value={String(extraMattressCount)} />}
          <ReviewRow label="Meals" value={mealPlan.join(", ") || "None"} />
        </ReviewSection>

        <ReviewSection title="Payment" icon={<CircleDollarSign className="w-3.5 h-3.5" />}>
          <ReviewRow label="Total" value={`${currency} ${total.toLocaleString("en-IN")}`} />
          <ReviewRow label="Paid Online" value={`${currency} ${paid.toLocaleString("en-IN")}`} />
          <ReviewRow label="Balance" value={`${currency} ${balance.toLocaleString("en-IN")}`} />
        </ReviewSection>

        <ReviewSection title="Property" icon={<MapPin className="w-3.5 h-3.5" />}>
          <ReviewRow label="Address" value="The Stream by Ekantah" />
          <ReviewRow label="Phone" value="+91 93193 47443, +91 99100 06437" />
        </ReviewSection>
      </div>
    </StepCard>
  );
}
