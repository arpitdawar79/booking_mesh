"use client";

import {
    PillSelect,
    PillToggle,
    Select,
    StepCard,
} from "@/components/ui/form-primitives";
import { CalendarDays, Clock } from "lucide-react";
import DatePicker from "react-datepicker";

const ROOM_TYPES = [
  "Balcony Room",
  "Non-Balcony Room",
  "Deluxe Room",
  "Standard Room",
];
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
  setRoomCount: (v: number) => void;
  roomAllocations: RoomAllocation[];
  setRoomAllocations: React.Dispatch<React.SetStateAction<RoomAllocation[]>>;
  extraMattressCount: number;
  setExtraMattressCount: (v: number) => void;
  mealPlan: string[];
  setMealPlan: (v: string[] | ((prev: string[]) => string[])) => void;
  nightCount: number;
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
  setRoomCount,
  roomAllocations,
  setRoomAllocations,
  extraMattressCount,
  setExtraMattressCount,
  mealPlan,
  setMealPlan,
  nightCount,
}: Props) {
  const allocated = roomAllocations.reduce((s, r) => s + r.count, 0);
  const roomCountError = allocated !== roomCount;

  function handleRoomCountChange(val: number) {
    setRoomCount(val);
    setRoomAllocations([{ id: "1", roomType: "Balcony Room", count: val }]);
    if (extraMattressCount > val) setExtraMattressCount(val);
  }

  function addAllocation() {
    const remaining = roomCount - allocated;
    if (remaining <= 0) return;
    const used = new Set(roomAllocations.map((r) => r.roomType));
    const nextType = ROOM_TYPES.find((t) => !used.has(t)) || ROOM_TYPES[0];
    setRoomAllocations((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), roomType: nextType, count: 1 },
    ]);
  }

  function updateAllocation(id: string, updates: Partial<RoomAllocation>) {
    setRoomAllocations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  }

  function removeAllocation(id: string) {
    setRoomAllocations((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleMeal(option: string) {
    setMealPlan((prev: string[]) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option],
    );
  }

  const roomOptions = Array.from({ length: 6 }, (_, i) => i + 1).map((n) => ({
    label: `${n} Room${n > 1 ? "s" : ""}`,
    value: n,
  }));

  const mattressOptions = Array.from(
    { length: roomCount + 1 },
    (_, i) => i,
  ).map((n) => ({
    label: n === 0 ? "None" : `${n}`,
    value: n,
  }));

  return (
    <StepCard
      icon={<CalendarDays className="w-5 h-5" />}
      title="Stay Details"
      subtitle="When and where will they stay?"
    >
      <div className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Check-in Date *
            </label>
            <DatePicker
              selected={checkInDate}
              onChange={(d: Date | null) => {
                setCheckInDate(d);
                if (d && checkOutDate && d >= checkOutDate) {
                  const next = new Date(d);
                  next.setDate(next.getDate() + 1);
                  setCheckOutDate(next);
                }
              }}
              selectsStart
              startDate={checkInDate || undefined}
              endDate={checkOutDate || undefined}
              openToDate={new Date()}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Pick check-in"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              wrapperClassName="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Check-out Date *
            </label>
            <DatePicker
              selected={checkOutDate}
              onChange={setCheckOutDate}
              selectsEnd
              startDate={checkInDate || undefined}
              endDate={checkOutDate || undefined}
              minDate={
                checkInDate
                  ? new Date(checkInDate.getTime() + 86400000)
                  : new Date()
              }
              dateFormat="yyyy-MM-dd"
              placeholderText="Pick check-out"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              wrapperClassName="w-full"
            />
          </div>
        </div>

        {nightCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-teal-500/5 border border-teal-500/10 px-3 py-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">
              {nightCount} night{nightCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Check-in Time"
            value={checkInTime}
            onChange={setCheckInTime}
            options={TIME_OPTIONS}
          />
          <Select
            label="Check-out Time"
            value={checkOutTime}
            onChange={setCheckOutTime}
            options={TIME_OPTIONS}
          />
        </div>

        {/* Rooms */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Rooms</label>
          <PillSelect
            options={roomOptions}
            value={roomCount}
            onChange={handleRoomCountChange}
          />
        </div>

        {/* Extra Mattresses */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Extra Mattresses
          </label>
          <PillSelect
            options={mattressOptions}
            value={extraMattressCount}
            onChange={setExtraMattressCount}
          />
        </div>

        {/* Room Allocation */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Room Allocation</h3>
            <button
              type="button"
              onClick={addAllocation}
              disabled={roomCount - allocated <= 0}
              className="text-xs rounded-lg bg-foreground text-background px-3 py-1.5 hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition"
            >
              + Add Type
            </button>
          </div>
          {roomAllocations.map((alloc) => {
            const remaining = roomCount - allocated + alloc.count;
            return (
              <div
                key={alloc.id}
                className="grid grid-cols-[1fr_auto_auto] gap-3 items-end"
              >
                <Select
                  label="Type"
                  value={alloc.roomType}
                  onChange={(v) => updateAllocation(alloc.id, { roomType: v })}
                  options={ROOM_TYPES}
                />
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Count
                  </label>
                  <select
                    value={alloc.count}
                    onChange={(e) =>
                      updateAllocation(alloc.id, {
                        count: Number(e.target.value),
                      })
                    }
                    className="w-20 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Array.from({ length: remaining }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                {roomAllocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAllocation(alloc.id)}
                    className="text-red-500 text-sm px-2 py-2 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          {roomCountError && (
            <p className="text-xs text-red-400">
              Allocated rooms ({allocated}) must equal total rooms ({roomCount})
            </p>
          )}
        </div>

        {/* Meal Plan */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Meal Plan</h3>
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
