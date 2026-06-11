"use client";

import { DatePicker } from "@/components/ui/calendar";
import {
    PillSelect,
    PillToggle,
    Select,
    StepCard,
} from "@/components/ui/form-primitives";
import { useHaptic } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import {
    BedDouble,
    CalendarDays,
    Clock,
    FileText,
    Minus,
    Moon,
    Plus,
    Utensils,
} from "lucide-react";

const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner"];
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h24 = i;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const amPm = h24 < 12 ? "AM" : "PM";
  return `${h12}:00 ${amPm}`;
});

interface RoomAllocation {
  id: string;
  roomType: string;
  count: number;
}

const ROOM_TYPES = ["Balcony Room", "Non-Balcony Room"];

interface Props {
  checkInDate: Date | null;
  setCheckInDate: (d: Date | null) => void;
  checkOutDate: Date | null;
  setCheckOutDate: (d: Date | null) => void;
  checkInTime: string;
  setCheckInTime: (v: string) => void;
  checkOutTime: string;
  setCheckOutTime: (v: string) => void;
  roomCount: number;
  roomAllocations: RoomAllocation[];
  setRoomAllocations: (v: RoomAllocation[]) => void;
  isFullProperty: boolean;
  extraMattressCount: number;
  setExtraMattressCount: (v: number) => void;
  mealPlan: string[];
  setMealPlan: (v: string[] | ((prev: string[]) => string[])) => void;
  nightCount: number;
  specialRequests?: string;
  setSpecialRequests?: (v: string) => void;
}

export function StayStep({
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  checkInTime,
  setCheckInTime,
  checkOutTime,
  setCheckOutTime,
  roomCount,
  roomAllocations,
  setRoomAllocations,
  isFullProperty,
  extraMattressCount,
  setExtraMattressCount,
  mealPlan,
  setMealPlan,
  nightCount,
  specialRequests,
  setSpecialRequests,
}: Props) {
  const haptic = useHaptic();

  function toggleMeal(option: string) {
    setMealPlan((prev: string[]) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option],
    );
  }

  const mattressOptions = Array.from(
    { length: roomCount + 1 },
    (_, i) => i,
  ).map((n) => ({
    label: n === 0 ? "None" : `${n}`,
    value: n,
  }));

  const roomSummary = roomAllocations
    .map((r) => `${r.count} ${r.roomType}`)
    .join(", ");

  const allocatedTotal = roomAllocations.reduce((s, a) => s + a.count, 0);

  function getCount(type: string) {
    return roomAllocations.find((a) => a.roomType === type)?.count ?? 0;
  }

  function setCount(type: string, newCount: number) {
    const existing = roomAllocations.find((a) => a.roomType === type);
    const otherTotal = allocatedTotal - (existing?.count ?? 0);
    const maxAllowed = roomCount - otherTotal;
    const clamped = Math.max(0, Math.min(newCount, maxAllowed));

    let next = roomAllocations.map((a) =>
      a.roomType === type ? { ...a, count: clamped } : a,
    );
    if (!existing && clamped > 0) {
      next = [...next, { id: `room-${type}`, roomType: type, count: clamped }];
    }
    setRoomAllocations(next.filter((a) => a.count > 0));
  }

  return (
    <StepCard
      icon={<CalendarDays className="w-5 h-5" />}
      title="Stay Details"
      subtitle="When and what do they need?"
    >
      <div className="space-y-6">
        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Check-in Date *"
            value={checkInDate}
            onChange={(d) => {
              setCheckInDate(d);
              haptic("medium");
              if (checkOutDate && d >= checkOutDate) {
                const next = new Date(d);
                next.setDate(next.getDate() + 1);
                setCheckOutDate(next);
              }
            }}
            rangeStart={checkInDate}
            rangeEnd={checkOutDate}
            minDate={new Date()}
            placeholder="Pick check-in"
          />

          <DatePicker
            label="Check-out Date *"
            value={checkOutDate}
            onChange={(d) => {
              setCheckOutDate(d);
              haptic("medium");
            }}
            rangeStart={checkInDate}
            rangeEnd={checkOutDate}
            minDate={
              checkInDate
                ? new Date(checkInDate.getTime() + 86400000)
                : new Date()
            }
            placeholder="Pick check-out"
          />
        </div>

        {/* Night Count Indicator */}
        <AnimatePresence>
          {nightCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              className="flex items-center gap-2.5 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 w-fit shadow-[0_0_20px_-6px_var(--glow-color)]"
            >
              <Moon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="text-primary font-black">
                  <NumberFlow
                    value={nightCount}
                    transformTiming={{
                      duration: 250,
                      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </span>{" "}
                night{nightCount > 1 ? "s" : ""} stay
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Check-in Time"
            value={checkInTime}
            onChange={setCheckInTime}
            options={TIME_OPTIONS}
            icon={Clock}
          />
          <Select
            label="Check-out Time"
            value={checkOutTime}
            onChange={setCheckOutTime}
            options={TIME_OPTIONS}
            icon={Clock}
          />
        </div>

        {/* Room Type Stepper */}
        <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BedDouble className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                Room Allocation
              </span>
            </div>
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-wider rounded-xl px-3 py-1 border transition-colors duration-200",
                allocatedTotal === roomCount
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-primary bg-primary/10 border border-primary/15",
              )}
            >
              {allocatedTotal} / {roomCount} Allocated
            </span>
          </div>

          <div className="space-y-2.5">
            {ROOM_TYPES.map((type) => {
              const count = getCount(type);
              const isSelected = count > 0;
              const canAdd = allocatedTotal < roomCount;
              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-center justify-between p-3 px-4 rounded-2xl border transition-all duration-300 bg-secondary/30",
                    isSelected
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-border hover:border-border/80 hover:bg-secondary/50",
                  )}
                >
                  <div className="space-y-0.5">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider transition-colors duration-200",
                        isSelected
                          ? "text-primary font-extrabold"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {type}
                    </span>
                    <p className="text-[10px] text-muted-foreground/30 font-medium">
                      {type === "Balcony Room"
                        ? "Premium valley-facing view"
                        : "Cozy wood-paneled interior"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-muted rounded-xl p-1 border border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setCount(type, count - 1);
                        haptic("medium");
                      }}
                      disabled={count === 0 || isFullProperty}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        count > 0 && !isFullProperty
                          ? "bg-card text-foreground hover:bg-muted"
                          : "text-muted-foreground/20 cursor-not-allowed",
                      )}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-7 text-center text-foreground flex items-center justify-center">
                      <NumberFlow value={count} />
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCount(type, count + 1);
                        haptic("medium");
                      }}
                      disabled={!canAdd || isFullProperty}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        canAdd && !isFullProperty
                          ? "bg-card text-foreground hover:bg-muted"
                          : "text-muted-foreground/20 cursor-not-allowed",
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-muted-foreground/50 font-semibold px-1 pt-1 border-t border-border flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            Summary: {roomSummary || "No rooms assigned yet"}
          </div>
        </div>

        {/* Extra Mattresses */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Extra Mattresses
          </label>
          <PillSelect
            options={mattressOptions}
            value={extraMattressCount}
            onChange={setExtraMattressCount}
          />
        </div>

        {/* Special Requests */}
        {setSpecialRequests && (
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 pl-0.5">
              Special Requests (Optional)
            </label>
            <div className="relative flex items-start">
              <FileText className="absolute left-4 top-3.5 w-4.5 h-4.5 text-muted-foreground/45 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="e.g. Early check-in, birthday setup, dietary restrictions..."
                value={specialRequests || ""}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full rounded-2xl border border-border bg-secondary/50 dark:bg-secondary/30 pl-12 pr-4 py-3 text-sm font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/30 focus:outline-none hover:border-border/80 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>
          </div>
        )}

        {/* Meal Plan */}
        <div className="rounded-3xl border border-border bg-card p-5 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black tracking-tight">
              Meal Plan Included
            </h3>
          </div>
          <PillToggle
            options={MEAL_OPTIONS}
            selected={mealPlan}
            onToggle={toggleMeal}
          />
        </div>
      </div>
    </StepCard>
  );
}
