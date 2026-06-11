"use client";

import { Ripple } from "@/components/magicui/ripple";
import { GuestCounter, Input, StepCard } from "@/components/ui/form-primitives";
import { useHaptic } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BedDouble,
  ClipboardCheck,
  Home,
  Mail,
  Minus,
  Phone,
  Plus,
  User,
  Users,
} from "lucide-react";

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
  roomCount: number;
  setRoomCount: (v: number) => void;
  isFullProperty: boolean;
  setIsFullProperty: (v: boolean) => void;
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
  roomCount,
  setRoomCount,
  isFullProperty,
  setIsFullProperty,
  onEnter,
}: Props) {
  const haptic = useHaptic();

  return (
    <StepCard
      icon={<Users className="w-5 h-5" />}
      title="Guest & Rooms"
      subtitle="Who is staying and how many rooms?"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <Input
            label="Full Name *"
            value={guestFullName}
            onChange={setGuestFullName}
            placeholder="e.g. Rahul Sharma"
            onEnter={onEnter}
            icon={User}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone (WhatsApp)"
              value={guestPhone}
              onChange={setGuestPhone}
              placeholder="+91 ..."
              type="tel"
              icon={Phone}
            />
            <Input
              label="Email"
              value={guestEmail}
              onChange={setGuestEmail}
              placeholder="guest@example.com"
              type="email"
              icon={Mail}
            />
          </div>
        </div>

        {/* Room configuration - high-fidelity interactive cards */}
        <div className="rounded-3xl border border-white/5 bg-white/1 p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/15 flex items-center justify-center text-teal-400">
              <BedDouble className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">
                Booking Category
              </h3>
              <p className="text-xs text-muted-foreground/60 font-medium">
                Choose custom rooms or rent the full property
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Custom Rooms Option */}
            <Ripple color="rgba(20,184,166,0.18)" className="rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsFullProperty(false);
                  haptic("medium");
                }}
                className={cn(
                  "relative w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 group cursor-pointer",
                  !isFullProperty
                    ? "border-teal-500/30 bg-teal-500/5 shadow-[0_0_24px_-6px_rgba(20,184,166,0.2)]"
                    : "border-white/6 bg-transparent hover:bg-white/2 hover:border-white/10",
                )}
              >
                {!isFullProperty && (
                  <motion.div
                    layoutId="activeCategoryBorder"
                    className="absolute inset-0 rounded-2xl border border-teal-500/40 pointer-events-none"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0 mt-0.5",
                    !isFullProperty
                      ? "bg-teal-500/15 text-teal-400 shadow-[0_0_14px_-4px_rgba(20,184,166,0.3)]"
                      : "bg-white/4 text-muted-foreground/50 group-hover:text-foreground",
                  )}
                >
                  <BedDouble className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-xs font-extrabold uppercase tracking-wider",
                      !isFullProperty
                        ? "text-teal-400"
                        : "text-muted-foreground/70",
                    )}
                  >
                    Individual Rooms
                  </p>
                  <p className="text-[11px] text-muted-foreground/45 font-medium leading-relaxed">
                    Choose 1–8 rooms, custom allocation
                  </p>
                </div>
              </button>
            </Ripple>

            {/* Full Property Option */}
            <Ripple color="rgba(20,184,166,0.18)" className="rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsFullProperty(true);
                  haptic("medium");
                }}
                className={cn(
                  "relative w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 group cursor-pointer",
                  isFullProperty
                    ? "border-teal-500/30 bg-teal-500/5 shadow-[0_0_24px_-6px_rgba(20,184,166,0.2)]"
                    : "border-white/6 bg-transparent hover:bg-white/2 hover:border-white/10",
                )}
              >
                {isFullProperty && (
                  <motion.div
                    layoutId="activeCategoryBorder"
                    className="absolute inset-0 rounded-2xl border border-teal-500/40 pointer-events-none"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0 mt-0.5",
                    isFullProperty
                      ? "bg-teal-500/15 text-teal-400 shadow-[0_0_14px_-4px_rgba(20,184,166,0.3)]"
                      : "bg-white/4 text-muted-foreground/50 group-hover:text-foreground",
                  )}
                >
                  <Home className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-xs font-extrabold uppercase tracking-wider",
                      isFullProperty
                        ? "text-teal-400"
                        : "text-muted-foreground/70",
                    )}
                  >
                    Full Property
                  </p>
                  <p className="text-[11px] text-muted-foreground/45 font-medium leading-relaxed">
                    All 5 rooms for 10+ guests, exclusive stay
                  </p>
                </div>
              </button>
            </Ripple>
          </div>

          {/* Progressive disclosure for custom room counts */}
          <AnimatePresence initial={false}>
            {!isFullProperty ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="overflow-hidden"
              >
                <div className="pt-3 flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Number of Rooms
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-1.5 rounded-2xl border border-white/[0.07] bg-[#0e0e0e]/90">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (roomCount > 1) {
                            setRoomCount(roomCount - 1);
                            haptic("medium");
                          } else haptic("warning");
                        }}
                        disabled={roomCount <= 1}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                          roomCount <= 1
                            ? "text-muted-foreground/15 cursor-not-allowed"
                            : "bg-white/5 text-foreground hover:bg-white/10",
                        )}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </motion.button>
                      <span className="w-12 text-center text-base font-black tabular-nums text-foreground flex items-center justify-center">
                        <NumberFlow
                          value={roomCount}
                          transformTiming={{
                            duration: 250,
                            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                      </span>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (roomCount < 8) {
                            setRoomCount(roomCount + 1);
                            haptic("medium");
                          }
                        }}
                        disabled={roomCount >= 8}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                          roomCount >= 8
                            ? "text-muted-foreground/15 cursor-not-allowed"
                            : "bg-white/5 text-foreground hover:bg-white/10",
                        )}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                    <span className="text-xs text-muted-foreground/40 font-medium">
                      Room{roomCount > 1 ? "s" : ""} booked
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pt-2.5 flex items-center gap-2 text-xs text-teal-400 font-extrabold bg-teal-500/5 border border-teal-500/10 rounded-2xl px-4 py-3 animate-in fade-in duration-200"
              >
                <ClipboardCheck className="w-4 h-4 shrink-0 animate-pulse" />
                <span>
                  3 Balcony + 2 Non-Balcony rooms automatically selected
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Guests Count Display */}
        <div className="rounded-3xl border border-white/5 bg-white/1 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black tracking-tight">
              Group Details
            </span>
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider bg-white/4 px-2.5 py-0.5 rounded-lg">
              Auto-filled from rooms
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <GuestCounter
              label="Adults"
              value={adultCount}
              onChange={setAdultCount}
              min={1}
            />
            <GuestCounter
              label="Children"
              value={childCount}
              onChange={setChildCount}
              min={0}
            />
          </div>
        </div>
      </div>
    </StepCard>
  );
}
