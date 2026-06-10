"use client";

import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface RoomAllocation {
  id: string;
  roomType: string;
  count: number;
}

const ROOM_TYPES = [
  "Balcony Room",
  "Non-Balcony Room",
  "Deluxe Room",
  "Standard Room",
];
const MEAL_OPTIONS = [
  "Breakfast Included",
  "Lunch Included",
  "Dinner Included",
];

export default function NewBookingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [checkInPastWarning, setCheckInPastWarning] = useState(false);
  const [checkOutPastWarning, setCheckOutPastWarning] = useState(false);
  const checkoutRef = useRef<DatePicker>(null);

  const [roomCount, setRoomCount] = useState<number>(1);
  const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
    { id: "1", roomType: "Balcony Room", count: 1 },
  ]);
  const [extraMattressCount, setExtraMattressCount] = useState<number>(0);

  const [mealPlan, setMealPlan] = useState<string[]>([]);

  const [roomCountError, setRoomCountError] = useState("");

  useEffect(() => {
    const total = roomAllocations.reduce((sum, r) => sum + r.count, 0);
    if (total !== roomCount) {
      setRoomCountError(
        `Allocated rooms (${total}) must equal total rooms (${roomCount})`,
      );
    } else {
      setRoomCountError("");
    }
  }, [roomAllocations, roomCount]);

  useEffect(() => {
    if (extraMattressCount > roomCount) {
      setExtraMattressCount(roomCount);
    }
  }, [roomCount]);

  function getRangeDayClass(date: Date) {
    if (!checkInDate || !checkOutDate) return "";
    const t = date.getTime();
    const s = new Date(checkInDate).setHours(0, 0, 0, 0);
    const e = new Date(checkOutDate).setHours(0, 0, 0, 0);
    const d = new Date(date).setHours(0, 0, 0, 0);
    if (d < s || d > e) return "";
    if (d === s) return "range-start";
    if (d === e) return "range-end";
    return "in-range";
  }

  function isPastDate(date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }

  function handleCheckInChange(date: Date | null) {
    setCheckInDate(date);
    setCheckInPastWarning(date ? isPastDate(date) : false);
    if (date) {
      setTimeout(() => {
        checkoutRef.current?.setOpen(true);
      }, 100);
    }
  }

  function handleCheckOutChange(date: Date | null) {
    setCheckOutDate(date);
    setCheckOutPastWarning(date ? isPastDate(date) : false);
  }

  function addRoomAllocation() {
    const remaining = getRemainingRooms();
    const newAllocation: RoomAllocation = {
      id: Math.random().toString(36).slice(2),
      roomType:
        ROOM_TYPES.find(
          (t) => !roomAllocations.some((r) => r.roomType === t),
        ) || ROOM_TYPES[0],
      count: Math.min(1, remaining),
    };
    setRoomAllocations([...roomAllocations, newAllocation]);
  }

  function updateAllocation(id: string, updates: Partial<RoomAllocation>) {
    setRoomAllocations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  }

  function removeAllocation(id: string) {
    setRoomAllocations((prev) => prev.filter((r) => r.id !== id));
  }

  function getRemainingRooms() {
    const allocated = roomAllocations.reduce((sum, r) => sum + r.count, 0);
    return roomCount - allocated;
  }

  function handleRoomCountChange(val: number) {
    setRoomCount(val);
    setRoomAllocations([{ id: "1", roomType: "Balcony Room", count: val }]);
  }

  function toggleMeal(option: string) {
    setMealPlan((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (roomCountError) {
      alert(roomCountError);
      return;
    }
    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates.");
      return;
    }

    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const data: Record<string, any> = Object.fromEntries(fd.entries());

    data.checkInDate = format(checkInDate, "yyyy-MM-dd");
    data.checkOutDate = format(checkOutDate, "yyyy-MM-dd");
    data.roomCount = roomCount;
    data.roomType = roomAllocations
      .map((r) => `${r.count} ${r.roomType}`)
      .join(", ");
    data.extraMattressCount = extraMattressCount;
    data.mealPlan =
      mealPlan.length > 0 ? mealPlan.join(", ") : "As per booking";

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    setSaving(false);

    if (json.booking) {
      router.push(`/dashboard/booking/${json.booking.id}`);
    } else {
      alert("Failed to create booking.");
    }
  }

  const roomCountOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        New Booking
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Guest Details">
          <Field label="Full Name" name="guestFullName" required />
          <Field label="Email (optional)" name="guestEmail" type="email" />
          <Field label="Phone (for WhatsApp)" name="guestPhone" type="tel" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Adults"
              name="adultCount"
              type="number"
              defaultValue="1"
            />
            <Field
              label="Children"
              name="childCount"
              type="number"
              defaultValue="0"
            />
          </div>
        </Section>

        <Section title="Stay Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                Check-in Date <span className="text-red-400">*</span>
                {checkInPastWarning && (
                  <span className="past-date-warning">
                    <AlertTriangle size={14} />
                    <span className="tooltip">
                      Selected date is in the past
                    </span>
                  </span>
                )}
              </label>
              <DatePicker
                selected={checkInDate}
                onChange={handleCheckInChange}
                openToDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={10}
                dayClassName={getRangeDayClass}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select check-in date"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                wrapperClassName="w-full"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                Check-out Date <span className="text-red-400">*</span>
                {checkOutPastWarning && (
                  <span className="past-date-warning">
                    <AlertTriangle size={14} />
                    <span className="tooltip">
                      Selected date is in the past
                    </span>
                  </span>
                )}
              </label>
              <DatePicker
                selected={checkOutDate}
                onChange={handleCheckOutChange}
                openToDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={10}
                dayClassName={getRangeDayClass}
                minDate={
                  checkInDate
                    ? new Date(checkInDate.getTime() + 86400000)
                    : undefined
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="Select check-out date"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                wrapperClassName="w-full"
                ref={checkoutRef}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Check-in Time"
              name="checkInTime"
              defaultValue="1:00 PM"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour24 = i;
                const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
                const amPm = hour24 < 12 ? "AM" : "PM";
                const label = `${hour12}:00 ${amPm}`;
                return (
                  <option key={label} value={label}>
                    {label}
                  </option>
                );
              })}
            </SelectField>
            <SelectField
              label="Check-out Time"
              name="checkOutTime"
              defaultValue="10:00 AM"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour24 = i;
                const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
                const amPm = hour24 < 12 ? "AM" : "PM";
                const label = `${hour12}:00 ${amPm}`;
                return (
                  <option key={label} value={label}>
                    {label}
                  </option>
                );
              })}
            </SelectField>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rooms</label>
            <select
              value={roomCount}
              onChange={(e) => handleRoomCountChange(Number(e.target.value))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {roomCountOptions.map((n) => (
                <option key={n} value={n}>
                  {n} Room{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Extra Mattresses
            </label>
            <select
              value={extraMattressCount}
              onChange={(e) => setExtraMattressCount(Number(e.target.value))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Array.from({ length: roomCount + 1 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n === 0
                    ? "None"
                    : `${n} room${n > 1 ? "s" : ""} with extra mattress`}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Room Allocation</h3>
              <button
                type="button"
                onClick={addRoomAllocation}
                disabled={getRemainingRooms() <= 0}
                className="text-xs rounded-lg bg-foreground text-background px-3 py-1.5 hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition"
              >
                + Add Room Type
              </button>
            </div>
            {roomAllocations.map((alloc) => {
              const remaining = getRemainingRooms() + alloc.count;
              return (
                <div
                  key={alloc.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Room Type
                    </label>
                    <select
                      value={alloc.roomType}
                      onChange={(e) =>
                        updateAllocation(alloc.id, { roomType: e.target.value })
                      }
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ROOM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      className="w-24 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              <p className="text-xs text-red-400">{roomCountError}</p>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Meal Plan</h3>
            <div className="flex flex-wrap gap-4">
              {MEAL_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={mealPlan.includes(option)}
                    onChange={() => toggleMeal(option)}
                    className="rounded border-input w-4 h-4"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Payment">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Total Amount"
              name="totalAmount"
              type="number"
              required
            />
            <Field
              label="Paid Online"
              name="amountPaidOnline"
              type="number"
              defaultValue="0"
            />
          </div>
          <Field label="Currency" name="currency" defaultValue="INR" />
        </Section>

        <Section title="Property Details">
          <Field
            label="Property Address"
            name="propertyAddress"
            defaultValue="The Stream by Ekantah"
          />
          <Field
            label="Property Phone"
            name="propertyPhone"
            defaultValue="+91 93193 47443, +91 99100 06437"
          />
          <Field
            label="Property Email"
            name="propertyEmail"
            defaultValue="Digital@ekantah.com"
          />
          <Field
            label="Care Taker Number"
            name="caretakerNumber"
            defaultValue="+91 94599 89576"
          />
          <Field
            label="Parking Details"
            name="parkingDetails"
            defaultValue="Available near the property. Please contact us before arrival for exact guidance."
          />
          <Field
            label="Map Link"
            name="mapLink"
            defaultValue="https://maps.google.com/?q=The%20Stream%20by%20Ekantah%20Tirthan%20Valley"
          />
          <Field
            label="Cancellation Policy"
            name="cancellationPolicy"
            defaultValue="As per the booking terms shared at the time of reservation."
          />
          <Field
            label="Special Requests"
            name="specialRequests"
            defaultValue="None shared."
          />
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !!roomCountError}
            className="flex-1 sm:flex-none rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition"
          >
            {saving ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
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
    <div className="rounded-xl border border-border p-4 sm:p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
      >
        {children}
      </select>
    </div>
  );
}
