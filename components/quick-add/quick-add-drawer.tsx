"use client";

import { useToast } from "@/components/ui/toast";
import { useHaptic } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  ClipboardList,
  Coins,
  CreditCard,
  HelpCircle,
  Home,
  Info,
  Loader2,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { GuestStep } from "../bookings/steps/guest-step";
import { PaymentStep } from "../bookings/steps/payment-step";
import { ReviewStep } from "../bookings/steps/review-step";
import { StayStep } from "../bookings/steps/stay-step";
import { Dialog } from "../ui/dialog";
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

interface RoomAllocation {
  id: string;
  roomType: string;
  count: number;
}

type BookingStep = 1 | 2 | 3 | 4;

const bookingStepMeta = [
  { num: 1 as BookingStep, label: "Guest", icon: Users },
  { num: 2 as BookingStep, label: "Stay", icon: CalendarDays },
  { num: 3 as BookingStep, label: "Payment", icon: CreditCard },
  { num: 4 as BookingStep, label: "Review", icon: ClipboardList },
];

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

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSuccessState(null);
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Keyboard-aware scroll: manually scroll the overflow container so the
  // focused input is centered in the remaining visible area. scrollIntoView
  // does NOT work inside nested overflow-y-auto containers on iOS Safari.
  useEffect(() => {
    if (!open) return;
    const container = scrollRef.current;
    if (!container) return;

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA" &&
        target.tagName !== "SELECT"
      )
        return;

      // Wait for the virtual keyboard to finish animating in
      setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        // Target position relative to the scroll container
        const targetRelativeTop =
          targetRect.top - containerRect.top + container.scrollTop;

        // Center the input in the container's visible area
        const desiredScrollTop =
          targetRelativeTop -
          container.clientHeight / 2 +
          target.clientHeight / 2;

        container.scrollTo({
          top: Math.max(0, desiredScrollTop),
          behavior: "smooth",
        });
      }, 400);
    };

    container.addEventListener("focusin", onFocusIn);
    return () => container.removeEventListener("focusin", onFocusIn);
  }, [open]);

  // Virtual Keyboard overlay mode: Android Chrome/Edge only
  // Makes the keyboard overlay content instead of shrinking the viewport
  useEffect(() => {
    const vk = navigator.virtualKeyboard;
    if (!vk) return;
    if (open) {
      vk.overlaysContent = true;
    } else {
      vk.overlaysContent = false;
    }
  }, [open]);

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

  // --- BOOKING FORM STATE (Unified 4-Step Wizard) ---
  const [bookingStep, setBookingStep] = useState<BookingStep>(1);
  const [bookingDirection, setBookingDirection] = useState(1);

  // Guest state
  const [guestFullName, setGuestFullName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  // Room state
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
    if (bookingStep === 1) return guestFullName.trim().length > 0;
    if (bookingStep === 2)
      return checkInDate !== null && checkOutDate !== null && nightCount > 0;
    if (bookingStep === 3)
      return totalAmount !== "" && Number(totalAmount) >= 0;
    return true;
  }, [
    bookingStep,
    guestFullName,
    checkInDate,
    checkOutDate,
    nightCount,
    totalAmount,
  ]);

  function nextBookingStep() {
    if (bookingStep < 4) {
      haptic("light");
      setBookingDirection(1);
      setBookingStep((s) => (s + 1) as BookingStep);
    }
  }

  function prevBookingStep() {
    if (bookingStep > 1) {
      haptic("light");
      setBookingDirection(-1);
      setBookingStep((s) => (s - 1) as BookingStep);
    }
  }

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

  const handleBookingSubmit = async () => {
    if (!checkInDate || !checkOutDate) {
      error("Please select check-in and check-out dates.");
      return;
    }

    setSaving(true);
    haptic("medium");

    const roomTypeString = roomAllocations
      .map((r) => `${r.count} ${r.roomType}`)
      .join(", ");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestFullName,
          guestPhone: guestPhone || null,
          guestEmail: guestEmail || null,
          adultCount,
          childCount,
          checkInDate: formatDate(checkInDate),
          checkOutDate: formatDate(checkOutDate),
          checkInTime,
          checkOutTime,
          roomCount,
          roomType: roomTypeString || "Balcony Room",
          extraMattressCount,
          mealPlan:
            mealPlan.length > 0 ? mealPlan.join(", ") : "As per booking",
          currency,
          totalAmount: Number(totalAmount),
          amountPaidOnline: Number(amountPaidOnline || 0),
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
        }),
      });

      const json = await res.json();
      setSaving(false);

      if (json.booking) {
        haptic("success");
        setSuccessState("booking");
        setBookingStep(1);
        setGuestFullName("");
        setGuestEmail("");
        setGuestPhone("");
        setAdultCount(2);
        setChildCount(0);
        setIsFullProperty(false);
        setRoomCount(1);
        setRoomAllocations([{ id: "1", roomType: "Balcony Room", count: 1 }]);
        setCheckInDate(null);
        setCheckOutDate(null);
        setCheckInTime("1:00 PM");
        setCheckOutTime("10:00 AM");
        setExtraMattressCount(0);
        setMealPlan(["Breakfast"]);
        setTotalAmount("");
        setAmountPaidOnline("0");
        setCurrency("INR");
        setTimeout(() => {
          onOpenChange(false);
          router.push(`/dashboard/booking/${json.booking.id}`);
        }, 1200);
      } else {
        haptic("error");
        error(json.error || "Failed to create booking.");
      }
    } catch (err) {
      setSaving(false);
      error("A network error occurred");
    }
  };

  function formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const isMobile = useMediaQuery("(max-width: 767px)", { defaultValue: false });

  const body = (
    <AnimatePresence mode="wait">
      {successState ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3"
        >
          <div className="w-16 h-14 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Check strokeWidth={3} className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">Successfully Logged!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            The {successState} has been recorded. Running auto-calculations and
            refreshing records...
          </p>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden mt-4">
          {/* Visual Premium Tabs */}
          <div className="px-2 sm:px-3 shrink-0">
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
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 scroll-smooth"
            style={{
              paddingBottom: "55vh",
              overscrollBehavior: "contain",
            }}
          >
            <AnimatePresence mode="wait">
              {/* EXPENSE TAB */}
              {activeTab === "expense" && (
                <motion.form
                  key="expense-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleExpenseSubmit}
                  className="space-y-3"
                >
                  {/* Huge Tactile Amount Input */}
                  <div className="space-y-1 bg-muted/30 border border-border/30 rounded-2xl p-3">
                    <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Expense Amount
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-1 text-3xl font-extrabold text-rose-500">
                        ₹
                      </span>
                      <input
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
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
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
                        const isSelected = expenseData.category === c.value;
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
                              "flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all duration-200 gap-1",
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
                      {(["cash", "upi", "card", "bank_transfer"] as const).map(
                        (m) => (
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
                        ),
                      )}
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
                  <div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
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
                  className="space-y-3"
                >
                  {/* Tactile Amount Input */}
                  <div className="space-y-1 bg-muted/30 border border-border/30 rounded-2xl p-3">
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
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>

                  {/* Segmented Selectors: Sale Type & Guest Type in 2 cols */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Sale Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">
                        Sale Type
                      </label>
                      <div className="flex flex-col gap-1.5">
                        {(["restaurant", "activity", "stay"] as const).map(
                          (t) => (
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
                          ),
                        )}
                      </div>
                    </div>

                    {/* Guest Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">
                        Guest Type
                      </label>
                      <div className="flex flex-col gap-1.5">
                        {(["outsider", "hotel_guest"] as const).map((g) => (
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
                              {g === "outsider" ? "Outsider" : "Hotel Guest"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method & Date */}
                  <div className="grid grid-cols-2 gap-3">
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
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>

                  {/* Submit button */}
                  <div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
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

              {/* BOOKING TAB (Unified 4-Step Wizard) */}
              {activeTab === "booking" && (
                <motion.div
                  key="booking-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {/* Compact Step Indicator */}
                  <div className="flex items-center justify-between pb-1 border-b border-border/40 shrink-0">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Step {bookingStep} of 4:{" "}
                      {bookingStepMeta[bookingStep - 1].label}
                    </span>
                    <div className="flex items-center gap-2">
                      {bookingStepMeta.map((s) => {
                        const isCurrent = s.num === bookingStep;
                        const isCompleted = s.num < bookingStep;
                        const Icon = s.icon;
                        return (
                          <div
                            key={s.num}
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300",
                              isCurrent
                                ? "bg-teal-500 border-teal-400/50 text-white shadow-[0_0_16px_-4px_rgba(20,184,166,0.5)]"
                                : isCompleted
                                  ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                                  : "bg-muted border-white/8 text-muted-foreground/30",
                            )}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Icon className="w-3.5 h-3.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step Content */}
                  <AnimatePresence mode="wait" custom={bookingDirection}>
                    <motion.div
                      key={bookingStep}
                      custom={bookingDirection}
                      initial={{
                        x: bookingDirection > 0 ? 40 : -40,
                        opacity: 0,
                      }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{
                        x: bookingDirection > 0 ? -40 : 40,
                        opacity: 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    >
                      {bookingStep === 1 && (
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
                          onEnter={canProceed() ? nextBookingStep : undefined}
                        />
                      )}
                      {bookingStep === 2 && (
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
                      {bookingStep === 3 && (
                        <PaymentStep
                          totalAmount={totalAmount}
                          setTotalAmount={setTotalAmount}
                          amountPaidOnline={amountPaidOnline}
                          setAmountPaidOnline={setAmountPaidOnline}
                          currency={currency}
                          setCurrency={setCurrency}
                          onEnter={canProceed() ? nextBookingStep : undefined}
                        />
                      )}
                      {bookingStep === 4 && (
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

                  {/* Navigation */}
                  <div className="flex items-center gap-3 pt-1">
                    {bookingStep > 1 && (
                      <motion.button
                        type="button"
                        onClick={prevBookingStep}
                        whileTap={{ scale: 0.93 }}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/6 transition-all duration-200 min-h-[48px]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                      </motion.button>
                    )}
                    <div className="flex-1" />
                    {bookingStep < 4 ? (
                      <motion.button
                        type="button"
                        onClick={nextBookingStep}
                        disabled={!canProceed()}
                        whileTap={canProceed() ? { scale: 0.94 } : undefined}
                        className={cn(
                          "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-tight transition-all duration-200 min-h-[48px]",
                          canProceed()
                            ? "bg-white text-background shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:bg-zinc-100"
                            : "bg-white/10 text-white/30 cursor-not-allowed",
                        )}
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={handleBookingSubmit}
                        disabled={saving || !canProceed()}
                        whileTap={
                          !saving && canProceed() ? { scale: 0.94 } : undefined
                        }
                        className="relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold overflow-hidden disabled:opacity-30 transition-all duration-200 min-h-[48px] text-white"
                        style={{
                          background:
                            !saving && canProceed()
                              ? "linear-gradient(135deg, #14b8a6, #10b981)"
                              : undefined,
                          backgroundColor:
                            saving || !canProceed() ? "#0d4036" : undefined,
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
                              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                            />
                            <span>Creating…</span>
                          </>
                        ) : (
                          <>
                            <span>Create Booking</span>
                            <Check className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <Dialog
        open={open}
        onClose={() => onOpenChange(false)}
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
            Quick Add Ledger
          </span>
        }
        description="Log entries immediately. Built mobile-first."
      >
        {body}
      </Dialog>
    );
  }

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
          {body}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
