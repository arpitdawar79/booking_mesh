"use client";

import { useToast } from "@/components/ui/toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuestStep } from "./steps/guest-step";
import { PaymentStep } from "./steps/payment-step";
import { ReviewStep } from "./steps/review-step";
import { StayStep } from "./steps/stay-step";

interface RoomAllocation {
  id: string;
  roomType: string;
  count: number;
}

type Step = 1 | 2 | 3 | 4;

const stepMeta = [
  { num: 1 as Step, label: "Guest", icon: <Users className="w-4 h-4" /> },
  { num: 2 as Step, label: "Stay", icon: <CalendarDays className="w-4 h-4" /> },
  {
    num: 3 as Step,
    label: "Payment",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    num: 4 as Step,
    label: "Review",
    icon: <ClipboardList className="w-4 h-4" />,
  },
];

export function BookingWizard() {
  const router = useRouter();
  const { success, error } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [cmdKey, setCmdKey] = useState("Ctrl");

  useEffect(() => {
    setCmdKey(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }, []);

  // Guest state
  const [guestFullName, setGuestFullName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  // Stay state
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [checkInTime, setCheckInTime] = useState("1:00 PM");
  const [checkOutTime, setCheckOutTime] = useState("10:00 AM");
  const [roomCount, setRoomCount] = useState(1);
  const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
    { id: "1", roomType: "Balcony Room", count: 1 },
  ]);
  const [extraMattressCount, setExtraMattressCount] = useState(0);
  const [mealPlan, setMealPlan] = useState<string[]>(["Breakfast"]);

  // Payment state
  const [totalAmount, setTotalAmount] = useState("");
  const [amountPaidOnline, setAmountPaidOnline] = useState("0");
  const [currency, setCurrency] = useState("INR");

  const nightCount = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const ms = checkOutDate.getTime() - checkInDate.getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [checkInDate, checkOutDate]);

  const allocated = roomAllocations.reduce((s, r) => s + r.count, 0);
  const roomCountError = allocated !== roomCount;

  const canProceed = useCallback(() => {
    if (step === 1) return guestFullName.trim().length > 0;
    if (step === 2)
      return (
        checkInDate !== null &&
        checkOutDate !== null &&
        !roomCountError &&
        nightCount > 0
      );
    if (step === 3) return totalAmount !== "" && Number(totalAmount) >= 0;
    return true;
  }, [
    step,
    guestFullName,
    checkInDate,
    checkOutDate,
    roomCountError,
    nightCount,
    totalAmount,
  ]);

  function nextStep() {
    if (step < 4) {
      setDirection(1);
      setStep((s) => (s + 1) as Step);
    }
  }

  function prevStep() {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => (s - 1) as Step);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (isInput) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (canProceed() && step < 4) nextStep();
        }
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "ArrowRight" &&
        canProceed() &&
        step < 4
      ) {
        e.preventDefault();
        nextStep();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft" && step > 1) {
        e.preventDefault();
        prevStep();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, canProceed]);

  async function handleSubmit() {
    if (roomCountError) {
      error("Room allocation must match total room count");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      error("Please select check-in and check-out dates.");
      return;
    }

    setSaving(true);
    const data: Record<string, unknown> = {
      guestFullName,
      guestEmail: guestEmail || null,
      guestPhone: guestPhone || null,
      adultCount,
      childCount,
      checkInDate: checkInDate ? formatDate(checkInDate) : null,
      checkOutDate: checkOutDate ? formatDate(checkOutDate) : null,
      checkInTime,
      checkOutTime,
      roomCount,
      roomType: roomAllocations
        .map((r) => `${r.count} ${r.roomType}`)
        .join(", "),
      extraMattressCount,
      mealPlan: mealPlan.length > 0 ? mealPlan.join(", ") : "As per booking",
      currency,
      totalAmount: Number(totalAmount),
      amountPaidOnline: Number(amountPaidOnline),
      propertyAddress: "The Stream by Ekantah",
      propertyPhone: "+91 93193 47443, +91 99100 06437",
      propertyEmail: "Digital@ekantah.com",
      caretakerNumber: "+91 94599 89576",
      parkingDetails:
        "Available near the property. Please contact us before arrival for exact guidance.",
      mapLink:
        "https://maps.google.com/?q=The%20Stream%20by%20Ekantah%20Tirthan%20Valley",
      cancellationPolicy:
        "As per the booking terms shared at the time of reservation.",
      specialRequests: "None shared.",
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    setSaving(false);

    if (json.booking) {
      success("Booking created successfully!");
      router.push(`/dashboard/booking/${json.booking.id}`);
    } else {
      error(json.error || "Failed to create booking.");
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Decorative ambient backdrop light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-teal-500/5 blur-[80px] rounded-full pointer-events-none -z-10" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 shadow-sm text-teal-400">
            <Zap className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <span className="bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            New Reservation
          </span>
        </h1>
        <p className="text-sm text-muted-foreground/80 font-medium mt-1 pl-1">
          Configure stay dates, allocate room inventories, and record guest
          credentials in 4 simple stages.
        </p>
      </div>

      {/* Modern Progress Pill Dock */}
      <div className="flex items-center gap-1.5 bg-muted/20 border border-border/40 p-1.5 rounded-2xl">
        {stepMeta.map((s) => {
          const isCurrent = s.num === step;
          const isCompleted = s.num < step;
          return (
            <div key={s.num} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => {
                  if (s.num < step) {
                    setDirection(-1);
                    setStep(s.num);
                  }
                }}
                disabled={s.num > step}
                className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCurrent
                    ? "text-teal-400"
                    : isCompleted
                      ? "text-foreground hover:bg-muted/40"
                      : "text-muted-foreground/50"
                }`}
              >
                {/* Slidable highlight backing */}
                {isCurrent && (
                  <motion.div
                    layoutId="activeWizardStepTab"
                    className="absolute inset-0 rounded-xl bg-teal-500/10 border border-teal-500/15"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    s.icon
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </span>
              </button>
              {s.num < 4 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 hidden sm:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content Wrapper */}
      <div className="relative min-h-[440px] bg-card/10 border border-border/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-x-6 sm:inset-x-8"
          >
            {step === 1 && (
              <GuestStep
                guestFullName={guestFullName}
                setGuestFullName={setGuestFullName}
                guestPhone={guestPhone}
                setGuestPhone={setGuestPhone}
                guestEmail={guestEmail}
                setGuestEmail={setGuestEmail}
                adultCount={adultCount}
                setAdultCount={setAdultCount}
                childCount={childCount}
                setChildCount={setChildCount}
                onEnter={canProceed() ? nextStep : undefined}
              />
            )}
            {step === 2 && (
              <StayStep
                checkInDate={checkInDate}
                setCheckInDate={setCheckInDate}
                checkOutDate={checkOutDate}
                setCheckOutDate={setCheckOutDate}
                checkInTime={checkInTime}
                setCheckInTime={setCheckInTime}
                checkOutTime={checkOutTime}
                setCheckOutTime={setCheckOutTime}
                roomCount={roomCount}
                setRoomCount={setRoomCount}
                roomAllocations={roomAllocations}
                setRoomAllocations={setRoomAllocations}
                extraMattressCount={extraMattressCount}
                setExtraMattressCount={setExtraMattressCount}
                mealPlan={mealPlan}
                setMealPlan={setMealPlan}
                nightCount={nightCount}
              />
            )}
            {step === 3 && (
              <PaymentStep
                totalAmount={totalAmount}
                setTotalAmount={setTotalAmount}
                amountPaidOnline={amountPaidOnline}
                setAmountPaidOnline={setAmountPaidOnline}
                currency={currency}
                setCurrency={setCurrency}
                onEnter={canProceed() ? nextStep : undefined}
              />
            )}
            {step === 4 && (
              <ReviewStep
                guestFullName={guestFullName}
                guestPhone={guestPhone}
                guestEmail={guestEmail}
                adultCount={adultCount}
                childCount={childCount}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                checkInTime={checkInTime}
                checkOutTime={checkOutTime}
                roomCount={roomCount}
                roomAllocations={roomAllocations}
                extraMattressCount={extraMattressCount}
                mealPlan={mealPlan}
                totalAmount={totalAmount}
                amountPaidOnline={amountPaidOnline}
                currency={currency}
                nightCount={nightCount}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation and Shortcuts Bar */}
      <div className="flex items-center justify-between pt-5 border-t border-border/50">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4.5 py-3 rounded-xl border border-border bg-muted/10 text-sm font-semibold hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Back</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/80 font-medium">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/40 text-[10px]">
            {cmdKey}
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/40 text-[10px]">
            →
          </kbd>
          <span className="ml-1">to advance</span>
        </div>

        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-1.5 px-5.5 py-3 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-95 disabled:opacity-40 active:scale-[0.98] transition cursor-pointer"
          >
            <span>Next</span> <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canProceed()}
            className="flex items-center gap-1.5 px-5.5 py-3 rounded-xl bg-teal-500 text-white text-sm font-bold hover:opacity-95 disabled:opacity-40 active:scale-[0.98] transition cursor-pointer"
          >
            <span>{saving ? "Creating..." : "Create Booking"}</span>{" "}
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
