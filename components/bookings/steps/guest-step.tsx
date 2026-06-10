"use client";

import { Input, GuestCounter, StepCard } from "@/components/ui/form-primitives";
import { Users } from "lucide-react";

interface Props {
  guestFullName: string;
  setGuestFullName: (v: string) => void;
  guestPhone: string;
  setGuestPhone: (v: string) => void;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  adultCount: number;
  setAdultCount: (v: number) => void;
  childCount: number;
  setChildCount: (v: number) => void;
  onEnter: (() => void) | undefined;
}

export function GuestStep({
  guestFullName,
  setGuestFullName,
  guestPhone,
  setGuestPhone,
  guestEmail,
  setGuestEmail,
  adultCount,
  setAdultCount,
  childCount,
  setChildCount,
  onEnter,
}: Props) {
  return (
    <StepCard icon={<Users className="w-5 h-5" />} title="Guest Details" subtitle="Who is staying with us?">
      <div className="space-y-4">
        <Input
          label="Full Name *"
          value={guestFullName}
          onChange={setGuestFullName}
          placeholder="e.g. Rahul Sharma"
          autoFocus
          onEnter={onEnter}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone (WhatsApp)" value={guestPhone} onChange={setGuestPhone} placeholder="+91 ..." type="tel" />
          <Input label="Email" value={guestEmail} onChange={setGuestEmail} placeholder="guest@example.com" type="email" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <GuestCounter label="Adults" value={adultCount} onChange={setAdultCount} min={1} />
          <GuestCounter label="Children" value={childCount} onChange={setChildCount} min={0} />
        </div>
      </div>
    </StepCard>
  );
}
