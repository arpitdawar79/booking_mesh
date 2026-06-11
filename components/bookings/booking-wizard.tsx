"use client";

import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { BorderBeam } from "@/components/magicui/border-beam";
import { TextReveal } from "@/components/magicui/text-reveal";
import { useToast } from "@/components/ui/toast";
import { useHaptic, useTouchFeedback } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  CreditCard,
  Sparkles,
  Users,
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
  { num: 1 as Step, label: "Guest", icon: Users },
  { num: 2 as Step, label: "Stay", icon: CalendarDays },
  { num: 3 as Step, label: "Payment", icon: CreditCard },
  { num: 4 as Step, label: "Review", icon: ClipboardList },
];

export function BookingWizard() {
  const router = useRouter();
  const { success, error } = useToast();
  const haptic = useHaptic();
  const touch = useTouchFeedback();
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

  // Room state (moved from stay for UX priority)
  const [isFullProperty, setIsFullProperty] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
    { id: "1", roomType: "Balcony Room", count: 1 },
  ]);

  // Stay state
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [checkInTime, setCheckInTime] = useState("1:00 PM");
  const [checkOutTime, setCheckOutTime] = useState("10:00 AM");
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

  // Auto-compute adults/children and room allocations when rooms change
  useEffect(() => {
    if (isFullProperty) {
      setRoomCount(5);
      setAdultCount(10);
      setChildCount(0);
      setExtraMattressCount((prev) => Math.min(prev, 5));
      setRoomAllocations([
        { id: "fp-1", roomType: "Balcony Room", count: 3 },
        { id: "fp-2", roomType: "Non-Balcony Room", count: 2 },
      ]);
    } else {
      setAdultCount(roomCount * 2);
      setChildCount(0);
      setExtraMattressCount((prev) => Math.min(prev, roomCount));
      setRoomAllocations([
        { id: "auto-1", roomType: "Balcony Room", count: roomCount },
      ]);
    }
  }, [roomCount, isFullProperty]);

  const canProceed = useCallback(() => {
    if (step === 1) return guestFullName.trim().length > 0;
    if (step === 2)
      return checkInDate !== null && checkOutDate !== null && nightCount > 0;
    if (step === 3) return totalAmount !== "" && Number(totalAmount) >= 0;
    return true;
  }, [step, guestFullName, checkInDate, checkOutDate, nightCount, totalAmount]);

  function nextStep() {
    if (step < 4) {
      haptic("light");
      setDirection(1);
      setStep((s) => (s + 1) as Step);
    }
  }

  function prevStep() {
    if (step > 1) {
      haptic("light");
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
      haptic("success");
      success("Booking created successfully!");
      router.push(`/dashboard/booking/${json.booking.id}`);
    } else {
      haptic("error");
      error(json.error || "Failed to create booking.");
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const progressPct = ((step - 1) / (stepMeta.length - 1)) * 100;

  return (
    <div className="max-w-none sm:max-w-2xl sm:mx-auto relative pb-4 px-2">
      {/* Ambient layered glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-teal-500/3 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-emerald-500/3 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3 sm:mb-5"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-400/80">
            The Stream by Ekantah
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-none mt-2">
          <AnimatedGradientText
            gradientFrom="#14b8a6"
            gradientVia="#4ade80"
            gradientTo="#06b6d4"
            animationDuration={5}
          >
            New Reservation
          </AnimatedGradientText>
        </h1>
        <TextReveal
          text="Configure stay, allocate rooms, record guest credentials in 4 stages."
          className="text-xs text-muted-foreground/55 font-medium mt-1.5 max-w-sm leading-relaxed"
          delay={0.05}
        />
      </motion.div>

      {/* Step Indicator — pill track */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3.5 sm:mb-5 relative"
      >
        {/* Progress track */}
        <div className="absolute top-[22px] left-6 right-6 h-px bg-white/5 z-0" />
        <motion.div
          className="absolute top-[22px] left-6 h-px bg-linear-to-r from-teal-500 to-emerald-400 z-0 origin-left"
          style={{ right: `${100 - progressPct}%` }}
          initial={false}
          animate={{ right: `${100 - progressPct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        />

        <div className="relative flex items-start justify-between">
          {stepMeta.map((s, i) => {
            const isCurrent = s.num === step;
            const isCompleted = s.num < step;
            const Icon = s.icon;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < step) {
                    haptic("light");
                    setDirection(-1);
                    setStep(s.num);
                  }
                }}
                disabled={s.num > step}
                className="flex flex-col items-center gap-2 disabled:pointer-events-none group"
              >
                <div className="relative">
                  {isCurrent && (
                    <motion.div
                      layoutId="stepActiveGlow"
                      className="absolute -inset-2 rounded-full bg-teal-500/15 blur-sm"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 28,
                      }}
                    />
                  )}
                  <div
                    className={cn(
                      "relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border",
                      isCurrent
                        ? "bg-teal-500 border-teal-400/50 text-white shadow-[0_0_24px_-4px_rgba(20,184,166,0.6)]"
                        : isCompleted
                          ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                          : "bg-[#111] border-white/8 text-muted-foreground/30 group-disabled:opacity-40",
                    )}
                  >
                    {isCompleted ? (
                      <motion.span
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                      >
                        <Check className="w-4.5 h-4.5" />
                      </motion.span>
                    ) : (
                      <Icon
                        className={cn(
                          "w-4.5 h-4.5",
                          isCurrent &&
                            "animate-in fade-in zoom-in-50 duration-200",
                        )}
                      />
                    )}
                    {isCurrent && (
                      <BorderBeam
                        size={80}
                        duration={6}
                        colorFrom="#14b8a6"
                        colorTo="#4ade80"
                        borderWidth={1.5}
                      />
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                    isCurrent
                      ? "text-teal-400"
                      : isCompleted
                        ? "text-teal-400/60"
                        : "text-muted-foreground/30",
                  )}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <div className="relative overflow-visible">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(e, info) => {
              const swipeThreshold = 55;
              if (info.offset.x < -swipeThreshold) {
                if (canProceed() && step < 4) {
                  nextStep();
                } else if (!canProceed() && step < 4) {
                  haptic("warning");
                }
              } else if (info.offset.x > swipeThreshold) {
                if (step > 1) {
                  prevStep();
                }
              }
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              mass: 0.75,
            }}
            className="relative cursor-grab active:cursor-grabbing touch-y"
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
                roomCount={roomCount}
                setRoomCount={setRoomCount}
                isFullProperty={isFullProperty}
                setIsFullProperty={setIsFullProperty}
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
                roomAllocations={roomAllocations}
                setRoomAllocations={setRoomAllocations}
                isFullProperty={isFullProperty}
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

      {/* Bottom Floating Navigation Capsule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between gap-2.5 mt-5 px-3 py-2 border border-white/[0.05] sticky bg-background/75 backdrop-blur-3xl rounded-[20px] z-40 shadow-[0_8px_50px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.02)]"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {/* Back button */}
        <motion.button
          type="button"
          onClick={prevStep}
          disabled={step === 1}
          whileTap={{ scale: 0.93 }}
          onTouchStart={touch.onTouchStart}
          onTouchEnd={touch.onTouchEnd}
          onMouseDown={touch.onTouchStart}
          onMouseUp={touch.onTouchEnd}
          className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl border border-white/[0.07] bg-white/3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/6 active:bg-white/8 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline tracking-tight">Back</span>
        </motion.button>

        {/* Center: step dots on mobile / keyboard hint on desktop */}
        <div className="flex-1 flex items-center justify-center">
          <div className="sm:hidden flex items-center gap-1.5">
            {stepMeta.map((s) => (
              <div
                key={s.num}
                className={cn(
                  "rounded-full transition-all duration-300",
                  s.num === step
                    ? "w-5 h-1.5 bg-teal-400"
                    : s.num < step
                      ? "w-1.5 h-1.5 bg-teal-500/50"
                      : "w-1.5 h-1.5 bg-white/10",
                )}
              />
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/35 font-medium">
            <kbd className="px-1.5 py-0.5 rounded-md border border-white/8 bg-white/4 text-[10px] font-bold font-mono">
              {cmdKey}
            </kbd>
            <span className="opacity-60">+</span>
            <kbd className="px-1.5 py-0.5 rounded-md border border-white/8 bg-white/4 text-[10px] font-bold font-mono">
              →
            </kbd>
            <span className="ml-0.5">to advance</span>
          </div>
        </div>

        {/* Next / Submit button */}
        {step < 4 ? (
          <motion.button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            whileTap={canProceed() ? { scale: 0.94 } : undefined}
            onTouchStart={touch.onTouchStart}
            onTouchEnd={touch.onTouchEnd}
            onMouseDown={touch.onTouchStart}
            onMouseUp={touch.onTouchEnd}
            className={cn(
              "relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold tracking-tight overflow-hidden transition-all duration-200 min-h-[40px]",
              canProceed()
                ? "bg-white text-background shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:bg-zinc-100"
                : "bg-white/10 text-white/30 cursor-not-allowed",
            )}
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canProceed()}
            whileTap={!saving && canProceed() ? { scale: 0.94 } : undefined}
            onTouchStart={touch.onTouchStart}
            onTouchEnd={touch.onTouchEnd}
            onMouseDown={touch.onTouchStart}
            onMouseUp={touch.onTouchEnd}
            className="relative flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold overflow-hidden disabled:opacity-30 transition-all duration-200 min-h-[40px] text-white"
            style={{
              background:
                !saving && canProceed()
                  ? "linear-gradient(135deg, #14b8a6, #10b981)"
                  : undefined,
              backgroundColor: saving || !canProceed() ? "#0d4036" : undefined,
              boxShadow:
                !saving && canProceed()
                  ? "0 0 28px -6px rgba(20,184,166,0.55)"
                  : undefined,
            }}
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white"
                />
                <span>Creating…</span>
              </>
            ) : (
              <>
                <span>Create Booking</span>
                <Check className="w-3.5 h-3.5" />
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
