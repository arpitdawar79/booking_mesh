"use client";

import { useToast } from "@/components/ui/toast";
import { useHaptic } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Calendar,
  CalendarPlus,
  Check,
  ChevronRight,
  Coins,
  HelpCircle,
  Home,
  Info,
  Loader2,
  Minus,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../ui/drawer";

interface QuickAddDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "booking" | "expense" | "sale";
}

const CATEGORIES = [
  {
    value: "food_beverages",
    label: "Food & Bev",
    icon: Utensils,
    color:
      "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
  },
  {
    value: "utilities",
    label: "Utilities",
    icon: Wallet,
    color:
      "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: Home,
    color:
      "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
  },
  {
    value: "salaries",
    label: "Salaries",
    icon: Coins,
    color:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
  },
  {
    value: "supplies",
    label: "Supplies",
    icon: ShoppingBag,
    color:
      "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: Sparkles,
    color:
      "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
  },
  {
    value: "transport",
    label: "Transport",
    icon: Activity,
    color:
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
  },
  {
    value: "misc",
    label: "Miscellaneous",
    icon: HelpCircle,
    color:
      "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
  },
];

const ROOM_TYPES = [
  "Balcony Room",
  "Non-Balcony Room",
  "Deluxe Room",
  "Standard Room",
  "Family Suite",
];
const MEAL_PLANS = [
  { value: "Breakfast", label: "🍳 Breakfast" },
  { value: "Lunch", label: "🍲 Lunch" },
  { value: "Dinner", label: "🍽️ Dinner" },
];

export function QuickAddDrawer({
  open,
  onOpenChange,
  initialTab = "booking",
}: QuickAddDrawerProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const haptic = useHaptic();
  const [activeTab, setActiveTab] = useState<"booking" | "expense" | "sale">(
    initialTab,
  );
  const [saving, setSaving] = useState(false);
  const [successState, setSuccessState] = useState<
    "booking" | "expense" | "sale" | null
  >(null);

  // Auto-focus inputs on tab change
  const expenseAmountRef = useRef<HTMLInputElement>(null);
  const saleGuestRef = useRef<HTMLInputElement>(null);
  const bookingGuestRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSuccessState(null);
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (activeTab === "expense") expenseAmountRef.current?.focus();
      else if (activeTab === "sale") saleGuestRef.current?.focus();
      else if (activeTab === "booking") bookingGuestRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, open]);

  // --- EXPENSE FORM STATE ---
  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "misc",
    description: "",
    amount: "",
    paymentMethod: "cash" as "cash" | "upi" | "card" | "bank_transfer",
    recordedBy: "",
    receiptUrl: "",
    notes: "",
    showMore: false,
  });

  // --- ADDITIONAL SALE FORM STATE ---
  const [saleData, setSaleData] = useState({
    date: new Date().toISOString().split("T")[0],
    guestName: "",
    saleType: "restaurant" as "restaurant" | "activity" | "stay",
    guestType: "outsider" as "outsider" | "hotel_guest",
    amount: "",
    paymentMethod: "cash" as "cash" | "upi",
    notes: "",
  });

  // --- BOOKING FORM STATE (World-class Streamlined 2-Step Form) ---
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [bookingData, setBookingData] = useState({
    guestFullName: "",
    guestPhone: "",
    guestEmail: "",
    adultCount: 2,
    childCount: 0,
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    checkInTime: "1:00 PM",
    checkOutTime: "10:00 AM",
    roomAllocations: {
      "Balcony Room": 1,
      "Non-Balcony Room": 0,
      "Deluxe Room": 0,
      "Standard Room": 0,
      "Family Suite": 0,
    } as Record<string, number>,
    extraMattressCount: 0,
    mealPlan: ["Breakfast"],
    totalAmount: "",
    amountPaidOnline: "",
  });

  // Dynamic values for booking
  const nightCount = (() => {
    const inDate = new Date(bookingData.checkInDate);
    const outDate = new Date(bookingData.checkOutDate);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;
    const diff = outDate.getTime() - inDate.getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  const balanceAmount = (() => {
    const total = Number(bookingData.totalAmount) || 0;
    const paid = Number(bookingData.amountPaidOnline) || 0;
    return Math.max(0, total - paid);
  })();

  const totalRoomCount = Object.values(bookingData.roomAllocations).reduce(
    (sum, count) => sum + count,
    0,
  );

  const roomTypeString = Object.entries(bookingData.roomAllocations)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  // Handlers
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.amount || Number(expenseData.amount) <= 0) {
      error("Please enter a valid amount");
      return;
    }
    if (!expenseData.description.trim()) {
      error("Please enter a description");
      return;
    }

    setSaving(true);
    haptic("medium");

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: expenseData.date,
          category: expenseData.category,
          description: expenseData.description,
          amount: Number(expenseData.amount),
          paymentMethod: expenseData.paymentMethod,
          recordedBy: expenseData.recordedBy || undefined,
          receiptUrl: expenseData.receiptUrl || undefined,
          notes: expenseData.notes || undefined,
        }),
      });

      if (res.ok) {
        setSuccessState("expense");
        haptic("success");
        // Reset state
        setExpenseData({
          date: new Date().toISOString().split("T")[0],
          category: "misc",
          description: "",
          amount: "",
          paymentMethod: "cash",
          recordedBy: "",
          receiptUrl: "",
          notes: "",
          showMore: false,
        });
        setTimeout(() => {
          onOpenChange(false);
          router.refresh();
        }, 1200);
      } else {
        const errJson = await res.json();
        error(errJson.error || "Failed to save expense");
      }
    } catch (err) {
      error("A network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleData.guestName.trim()) {
      error("Please enter guest name");
      return;
    }
    if (!saleData.amount || Number(saleData.amount) <= 0) {
      error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    haptic("medium");

    try {
      const res = await fetch("/api/additional-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: saleData.date,
          guestName: saleData.guestName,
          saleType: saleData.saleType,
          guestType: saleData.guestType,
          amount: Number(saleData.amount),
          paymentMethod: saleData.paymentMethod,
          notes: saleData.notes || undefined,
        }),
      });

      if (res.ok) {
        setSuccessState("sale");
        haptic("success");
        setSaleData({
          date: new Date().toISOString().split("T")[0],
          guestName: "",
          saleType: "restaurant",
          guestType: "outsider",
          amount: "",
          paymentMethod: "cash",
          notes: "",
        });
        setTimeout(() => {
          onOpenChange(false);
          router.refresh();
        }, 1200);
      } else {
        const errJson = await res.json();
        error(errJson.error || "Failed to save sale");
      }
    } catch (err) {
      error("A network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.guestFullName.trim()) {
      error("Guest full name is required");
      return;
    }
    if (nightCount <= 0) {
      error("Check-out date must be after check-in date");
      return;
    }
    if (!bookingData.totalAmount || Number(bookingData.totalAmount) < 0) {
      error("Please enter a valid total amount");
      return;
    }

    setSaving(true);
    haptic("medium");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestFullName: bookingData.guestFullName,
          guestPhone: bookingData.guestPhone || null,
          guestEmail: bookingData.guestEmail || null,
          adultCount: bookingData.adultCount,
          childCount: bookingData.childCount,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          checkInTime: bookingData.checkInTime,
          checkOutTime: bookingData.checkOutTime,
          roomCount: totalRoomCount,
          roomType: roomTypeString || "Balcony Room",
          extraMattressCount: bookingData.extraMattressCount,
          mealPlan:
            bookingData.mealPlan.length > 0
              ? bookingData.mealPlan.join(", ")
              : "As per booking",
          currency: "INR",
          totalAmount: Number(bookingData.totalAmount),
          amountPaidOnline: Number(bookingData.amountPaidOnline || 0),
        }),
      });

      const json = await res.json();
      if (json.booking) {
        setSuccessState("booking");
        haptic("success");
        setBookingStep(1);
        setBookingData({
          guestFullName: "",
          guestPhone: "",
          guestEmail: "",
          adultCount: 2,
          childCount: 0,
          checkInDate: new Date().toISOString().split("T")[0],
          checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          checkInTime: "1:00 PM",
          checkOutTime: "10:00 AM",
          roomAllocations: {
            "Balcony Room": 1,
            "Non-Balcony Room": 0,
            "Deluxe Room": 0,
            "Standard Room": 0,
            "Family Suite": 0,
          } as Record<string, number>,
          extraMattressCount: 0,
          mealPlan: ["Breakfast"],
          totalAmount: "",
          amountPaidOnline: "",
        });
        setTimeout(() => {
          onOpenChange(false);
          router.push(`/dashboard/booking/${json.booking.id}`);
        }, 1200);
      } else {
        error(json.error || "Failed to create booking");
      }
    } catch (err) {
      error("A network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const changeBookingData = (key: string, value: any) => {
    setBookingData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMealPlan = (item: string) => {
    changeBookingData(
      "mealPlan",
      bookingData.mealPlan.includes(item)
        ? bookingData.mealPlan.filter((x) => x !== item)
        : [...bookingData.mealPlan, item],
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[88dvh] sm:h-[85dvh] md:max-w-2xl md:mx-auto rounded-t-3xl border-border bg-background">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Title */}
          <div className="px-6 pt-1 shrink-0 flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                Quick Add Ledger
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                Log entries immediately. Built mobile-first.
              </DrawerDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Delight Screen */}
          <AnimatePresence mode="wait">
            {successState ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4"
              >
                <div className="w-16 h-14 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Check strokeWidth={3} className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">Successfully Logged!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  The {successState} has been recorded. Running
                  auto-calculations and refreshing records...
                </p>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden mt-4">
                {/* Visual Premium Tabs */}
                <div className="px-6 shrink-0">
                  <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1.5 rounded-2xl border border-border/40 relative">
                    <button
                      onClick={() => {
                        haptic("light");
                        setActiveTab("booking");
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition z-10",
                        activeTab === "booking"
                          ? "text-teal-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {activeTab === "booking" && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-background/90 rounded-xl shadow-sm border border-border/50 -z-10"
                        />
                      )}
                      <CalendarPlus className="w-4 h-4" />
                      <span>Booking</span>
                    </button>

                    <button
                      onClick={() => {
                        haptic("light");
                        setActiveTab("expense");
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition z-10",
                        activeTab === "expense"
                          ? "text-rose-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {activeTab === "expense" && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-background/90 rounded-xl shadow-sm border border-border/50 -z-10"
                        />
                      )}
                      <Receipt className="w-4 h-4" />
                      <span>Expense</span>
                    </button>

                    <button
                      onClick={() => {
                        haptic("light");
                        setActiveTab("sale");
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition z-10",
                        activeTab === "sale"
                          ? "text-orange-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {activeTab === "sale" && (
                        <motion.div
                          layoutId="activeTabBg"
                          className="absolute inset-0 bg-background/90 rounded-xl shadow-sm border border-border/50 -z-10"
                        />
                      )}
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add Sale</span>
                    </button>
                  </div>
                </div>

                {/* Form Panels with Smooth Motion */}
                <div className="flex-1 overflow-y-auto px-6 py-4 pb-12">
                  <AnimatePresence mode="wait">
                    {/* EXPENSE TAB */}
                    {activeTab === "expense" && (
                      <motion.form
                        key="expense-panel"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleExpenseSubmit}
                        className="space-y-5"
                      >
                        {/* Huge Tactile Amount Input */}
                        <div className="space-y-1 bg-muted/30 border border-border/30 rounded-2xl p-4">
                          <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Expense Amount
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-1 text-3xl font-extrabold text-rose-500">
                              ₹
                            </span>
                            <input
                              ref={expenseAmountRef}
                              type="number"
                              inputMode="decimal"
                              required
                              placeholder="0"
                              min={0.01}
                              step="any"
                              value={expenseData.amount}
                              onChange={(e) =>
                                setExpenseData((p) => ({
                                  ...p,
                                  amount: e.target.value,
                                }))
                              }
                              className="w-full bg-transparent pl-8 pr-3 py-1 text-4xl font-extrabold text-foreground focus:outline-none focus:ring-0 select-all"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">
                            What was this for?
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tomato & Onion crates, Caretaker gas cylinder"
                            value={expenseData.description}
                            onChange={(e) =>
                              setExpenseData((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                          />
                        </div>

                        {/* Visual Category Grid */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground">
                            Select Category
                          </label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {CATEGORIES.map((c) => {
                              const Icon = c.icon;
                              const isSelected =
                                expenseData.category === c.value;
                              return (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => {
                                    haptic("light");
                                    setExpenseData((p) => ({
                                      ...p,
                                      category: c.value,
                                    }));
                                  }}
                                  className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 gap-1.5",
                                    isSelected
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500 scale-[1.03] shadow-sm font-semibold"
                                      : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "w-5 h-5",
                                      isSelected
                                        ? "text-rose-400"
                                        : "text-muted-foreground",
                                    )}
                                  />
                                  <span className="text-[10px]">{c.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Visual Payment Method Buttons */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">
                            Payment Method
                          </label>
                          <div className="grid grid-cols-4 gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
                            {(
                              ["cash", "upi", "card", "bank_transfer"] as const
                            ).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  haptic("light");
                                  setExpenseData((p) => ({
                                    ...p,
                                    paymentMethod: m,
                                  }));
                                }}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold transition-all capitalize",
                                  expenseData.paymentMethod === m
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {m.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* More Details Toggle */}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              haptic("light");
                              setExpenseData((p) => ({
                                ...p,
                                showMore: !p.showMore,
                              }));
                            }}
                            className="text-xs text-rose-400 font-bold flex items-center gap-1 hover:underline"
                          >
                            <Info className="w-3.5 h-3.5" />
                            {expenseData.showMore
                              ? "Hide Extra Details"
                              : "Show More Details (Receipts, Notes, Date)"}
                          </button>

                          <AnimatePresence>
                            {expenseData.showMore && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4 pt-3"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                                      Expense Date
                                    </label>
                                    <input
                                      type="date"
                                      value={expenseData.date}
                                      onChange={(e) =>
                                        setExpenseData((p) => ({
                                          ...p,
                                          date: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                                      Recorded By
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Your Name"
                                      value={expenseData.recordedBy}
                                      onChange={(e) =>
                                        setExpenseData((p) => ({
                                          ...p,
                                          recordedBy: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                                      Receipt URL
                                    </label>
                                    <input
                                      type="url"
                                      placeholder="https://..."
                                      value={expenseData.receiptUrl}
                                      onChange={(e) =>
                                        setExpenseData((p) => ({
                                          ...p,
                                          receiptUrl: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                                      Notes
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="Any other comments/particulars"
                                      value={expenseData.notes}
                                      onChange={(e) =>
                                        setExpenseData((p) => ({
                                          ...p,
                                          notes: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Submit button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                Recording...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" /> Save Expense Entry
                              </>
                            )}
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* SALE TAB */}
                    {activeTab === "sale" && (
                      <motion.form
                        key="sale-panel"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleSaleSubmit}
                        className="space-y-5"
                      >
                        {/* Tactile Amount Input */}
                        <div className="space-y-1 bg-muted/30 border border-border/30 rounded-2xl p-4">
                          <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Sale Amount
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-1 text-3xl font-extrabold text-orange-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              inputMode="decimal"
                              required
                              placeholder="0"
                              min={0.01}
                              step="any"
                              value={saleData.amount}
                              onChange={(e) =>
                                setSaleData((p) => ({
                                  ...p,
                                  amount: e.target.value,
                                }))
                              }
                              className="w-full bg-transparent pl-8 pr-3 py-1 text-4xl font-extrabold text-foreground focus:outline-none focus:ring-0 select-all"
                            />
                          </div>
                        </div>

                        {/* Guest Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">
                            Guest Name
                          </label>
                          <input
                            ref={saleGuestRef}
                            type="text"
                            required
                            placeholder="e.g. Arpit Dawar (Room 102)"
                            value={saleData.guestName}
                            onChange={(e) =>
                              setSaleData((p) => ({
                                ...p,
                                guestName: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          />
                        </div>

                        {/* Segmented Selectors: Sale Type & Guest Type in 2 cols */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Sale Type */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">
                              Sale Type
                            </label>
                            <div className="flex flex-col gap-1.5">
                              {(
                                ["restaurant", "activity", "stay"] as const
                              ).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    haptic("light");
                                    setSaleData((p) => ({ ...p, saleType: t }));
                                  }}
                                  className={cn(
                                    "px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all",
                                    saleData.saleType === t
                                      ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-sm"
                                      : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50",
                                  )}
                                >
                                  {t === "restaurant" && (
                                    <Utensils className="w-4 h-4" />
                                  )}
                                  {t === "activity" && (
                                    <Activity className="w-4 h-4" />
                                  )}
                                  {t === "stay" && <Home className="w-4 h-4" />}
                                  <span className="capitalize">{t}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Guest Type */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">
                              Guest Type
                            </label>
                            <div className="flex flex-col gap-1.5">
                              {(["outsider", "hotel_guest"] as const).map(
                                (g) => (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => {
                                      haptic("light");
                                      setSaleData((p) => ({
                                        ...p,
                                        guestType: g,
                                      }));
                                    }}
                                    className={cn(
                                      "px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all h-[42px]",
                                      saleData.guestType === g
                                        ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-sm"
                                        : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50",
                                    )}
                                  >
                                    {g === "outsider" ? (
                                      <Users className="w-4 h-4" />
                                    ) : (
                                      <Home className="w-4 h-4" />
                                    )}
                                    <span>
                                      {g === "outsider"
                                        ? "Outsider"
                                        : "Hotel Guest"}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Method & Date */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">
                              Payment
                            </label>
                            <div className="grid grid-cols-2 gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                              {(["cash", "upi"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    haptic("light");
                                    setSaleData((p) => ({
                                      ...p,
                                      paymentMethod: m,
                                    }));
                                  }}
                                  className={cn(
                                    "py-2 rounded-lg text-xs font-bold transition-all uppercase",
                                    saleData.paymentMethod === m
                                      ? "bg-background text-foreground shadow-sm"
                                      : "text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">
                              Date
                            </label>
                            <input
                              type="date"
                              value={saleData.date}
                              onChange={(e) =>
                                setSaleData((p) => ({
                                  ...p,
                                  date: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none h-[42px]"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground">
                            Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Add meal detail or activity name"
                            value={saleData.notes}
                            onChange={(e) =>
                              setSaleData((p) => ({
                                ...p,
                                notes: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          />
                        </div>

                        {/* Submit button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" /> Save Sale Entry
                              </>
                            )}
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {/* BOOKING TAB (Delightful 2-Step Mobile Wizard) */}
                    {activeTab === "booking" && (
                      <motion.div
                        key="booking-panel"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        {/* Step Indicator Pill */}
                        <div className="flex items-center justify-between pb-1 border-b border-border/40 shrink-0">
                          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                            Step {bookingStep} of 2:{" "}
                            {bookingStep === 1
                              ? "Guest & Stay"
                              : "Tariff & Payments"}
                          </span>
                          <div className="flex gap-1.5">
                            <span
                              className={cn(
                                "w-6 h-1.5 rounded-full transition-all",
                                bookingStep >= 1 ? "bg-teal-500" : "bg-muted",
                              )}
                            />
                            <span
                              className={cn(
                                "w-6 h-1.5 rounded-full transition-all",
                                bookingStep === 2 ? "bg-teal-500" : "bg-muted",
                              )}
                            />
                          </div>
                        </div>

                        {bookingStep === 1 ? (
                          /* STEP 1: GUEST & STAY */
                          <div className="space-y-4">
                            {/* Guest Name */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-muted-foreground">
                                Guest Full Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                  ref={bookingGuestRef}
                                  type="text"
                                  placeholder="e.g. Mukesh Ambani"
                                  value={bookingData.guestFullName}
                                  onChange={(e) =>
                                    changeBookingData(
                                      "guestFullName",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                />
                              </div>
                            </div>

                            {/* Guest Phone & Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">
                                  Guest Phone
                                </label>
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  placeholder="10-digit mobile"
                                  value={bookingData.guestPhone}
                                  onChange={(e) =>
                                    changeBookingData(
                                      "guestPhone",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">
                                  Guest Email (Optional)
                                </label>
                                <input
                                  type="email"
                                  placeholder="name@domain.com"
                                  value={bookingData.guestEmail}
                                  onChange={(e) =>
                                    changeBookingData(
                                      "guestEmail",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                />
                              </div>
                            </div>

                            {/* Check-In & Check-Out Date */}
                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-2xl border border-border/40">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-teal-400" />{" "}
                                  Check In
                                </label>
                                <input
                                  type="date"
                                  value={bookingData.checkInDate}
                                  onChange={(e) =>
                                    changeBookingData(
                                      "checkInDate",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-transparent border-0 font-semibold text-sm focus:outline-none p-0 focus:ring-0"
                                />
                              </div>
                              <div className="space-y-1.5 border-l border-border/40 pl-3">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-rose-400" />{" "}
                                  Check Out
                                </label>
                                <input
                                  type="date"
                                  value={bookingData.checkOutDate}
                                  onChange={(e) =>
                                    changeBookingData(
                                      "checkOutDate",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-transparent border-0 font-semibold text-sm focus:outline-none p-0 focus:ring-0"
                                />
                              </div>
                            </div>

                            {/* Room Type Selector with Steppers */}
                            <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/40">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                  Room Allocation
                                </label>
                                <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/25 rounded-full px-2.5 py-0.5">
                                  {totalRoomCount} Room
                                  {totalRoomCount !== 1 ? "s" : ""} Total
                                </span>
                              </div>

                              <div className="space-y-2">
                                {ROOM_TYPES.map((t) => {
                                  const count =
                                    bookingData.roomAllocations[t] || 0;
                                  const isSelected = count > 0;
                                  return (
                                    <div
                                      key={t}
                                      className={cn(
                                        "flex items-center justify-between p-2 rounded-xl border transition-all duration-200",
                                        isSelected
                                          ? "bg-teal-500/5 border-teal-500/50 text-teal-400 font-semibold"
                                          : "bg-background border-border/60 text-muted-foreground",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "text-xs pl-1 transition-colors",
                                          isSelected
                                            ? "text-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {t}
                                      </span>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (count > 0) {
                                              haptic("light");
                                              const newAllocations = {
                                                ...bookingData.roomAllocations,
                                                [t]: count - 1,
                                              };
                                              changeBookingData(
                                                "roomAllocations",
                                                newAllocations,
                                              );
                                            }
                                          }}
                                          className={cn(
                                            "p-1 rounded-lg border transition-all",
                                            count > 0
                                              ? "border-teal-500/30 text-teal-400 hover:bg-teal-500/10 bg-background"
                                              : "border-border text-muted-foreground/30 bg-muted/10 cursor-not-allowed",
                                          )}
                                          disabled={count === 0}
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>

                                        <span className="font-bold text-xs w-4 text-center text-foreground">
                                          {count}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            haptic("light");
                                            const newAllocations = {
                                              ...bookingData.roomAllocations,
                                              [t]: count + 1,
                                            };
                                            changeBookingData(
                                              "roomAllocations",
                                              newAllocations,
                                            );
                                          }}
                                          className="p-1 rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 bg-background"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {totalRoomCount > 0 && (
                                <div className="text-[10px] text-muted-foreground italic text-center mt-1 truncate">
                                  Selected: {roomTypeString}
                                </div>
                              )}
                            </div>

                            {/* Meal Plan Checklist */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-muted-foreground">
                                Meal Plan Includes
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {MEAL_PLANS.map((m) => {
                                  const isChecked =
                                    bookingData.mealPlan.includes(m.value);
                                  return (
                                    <button
                                      key={m.value}
                                      type="button"
                                      onClick={() => {
                                        haptic("light");
                                        toggleMealPlan(m.value);
                                      }}
                                      className={cn(
                                        "py-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                                        isChecked
                                          ? "bg-teal-500/10 border-teal-500 text-teal-400 shadow-sm"
                                          : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50",
                                      )}
                                    >
                                      {m.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Navigation button */}
                            <div className="pt-2">
                              <button
                                type="button"
                                disabled={
                                  !bookingData.guestFullName.trim() ||
                                  nightCount <= 0 ||
                                  totalRoomCount <= 0
                                }
                                onClick={() => {
                                  haptic("medium");
                                  setBookingStep(2);
                                }}
                                className="w-full py-3.5 bg-foreground text-background hover:opacity-90 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
                              >
                                Next: Price & Payments{" "}
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* STEP 2: PRICING & CONFIRM */
                          <div className="space-y-5">
                            {/* Summary Pill Panel */}
                            <div className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10 space-y-1.5">
                              <h4 className="text-xs font-bold text-teal-400">
                                Stay Summary
                              </h4>
                              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-y-1 gap-x-4">
                                <div>
                                  Guest:{" "}
                                  <span className="font-semibold text-foreground">
                                    {bookingData.guestFullName}
                                  </span>
                                </div>
                                <div>
                                  Nights:{" "}
                                  <span className="font-semibold text-foreground">
                                    {nightCount} nights
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  Rooms:{" "}
                                  <span className="font-semibold text-foreground">
                                    {roomTypeString}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  Meals:{" "}
                                  <span className="font-semibold text-foreground">
                                    {bookingData.mealPlan.join(", ") || "None"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Steppers: Room Count & Guest Occupancy counts */}
                            <div className="grid grid-cols-3 gap-2 bg-muted/20 p-3 rounded-2xl border border-border/40">
                              {/* Rooms */}
                              <div className="flex flex-col items-center justify-center space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Rooms
                                </label>
                                <span className="font-extrabold text-sm text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-xl">
                                  {totalRoomCount} Room
                                  {totalRoomCount !== 1 ? "s" : ""}
                                </span>
                              </div>

                              {/* Adults */}
                              <div className="flex flex-col items-center justify-center space-y-1.5 border-l border-border/40">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Adults
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      haptic("light");
                                      changeBookingData(
                                        "adultCount",
                                        Math.max(1, bookingData.adultCount - 1),
                                      );
                                    }}
                                    className="p-1 rounded-lg border border-border hover:bg-muted bg-background"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="font-bold text-sm w-4 text-center">
                                    {bookingData.adultCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      haptic("light");
                                      changeBookingData(
                                        "adultCount",
                                        bookingData.adultCount + 1,
                                      );
                                    }}
                                    className="p-1 rounded-lg border border-border hover:bg-muted bg-background"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Extra Mattress */}
                              <div className="flex flex-col items-center justify-center space-y-1.5 border-l border-border/40">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Mattress
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      haptic("light");
                                      changeBookingData(
                                        "extraMattressCount",
                                        Math.max(
                                          0,
                                          bookingData.extraMattressCount - 1,
                                        ),
                                      );
                                    }}
                                    className="p-1 rounded-lg border border-border hover:bg-muted bg-background"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="font-bold text-sm w-4 text-center">
                                    {bookingData.extraMattressCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      haptic("light");
                                      changeBookingData(
                                        "extraMattressCount",
                                        bookingData.extraMattressCount + 1,
                                      );
                                    }}
                                    className="p-1 rounded-lg border border-border hover:bg-muted bg-background"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Total Tariff and Paid Advance in two fields */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">
                                  Total Amount
                                </label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-sm font-bold text-teal-400">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    required
                                    placeholder="0"
                                    min={0}
                                    value={bookingData.totalAmount}
                                    onChange={(e) =>
                                      changeBookingData(
                                        "totalAmount",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">
                                  Advance Paid
                                </label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-sm font-bold text-emerald-400">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    min={0}
                                    value={bookingData.amountPaidOnline}
                                    onChange={(e) =>
                                      changeBookingData(
                                        "amountPaidOnline",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Dynamically calculated Balance */}
                            <div className="flex items-center justify-between p-3.5 bg-muted/40 border border-border/40 rounded-xl text-sm">
                              <span className="text-muted-foreground font-semibold">
                                Calculated Balance Due:
                              </span>
                              <span className="font-extrabold text-foreground text-base">
                                ₹{balanceAmount.toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Step Navigation Back + Create */}
                            <div className="grid grid-cols-3 gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  haptic("medium");
                                  setBookingStep(1);
                                }}
                                className="py-3.5 border border-border hover:bg-muted text-foreground rounded-2xl font-bold text-xs transition-all active:scale-[0.98]"
                              >
                                Edit Details
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={handleBookingSubmit}
                                className="col-span-2 py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                    Creating...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" /> Create
                                    Reservation
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
