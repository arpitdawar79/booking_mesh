"use client";

import { DatePicker } from "@/components/ui/calendar";
import { Input } from "@/components/ui/form-primitives";
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
    FileText,
    HelpCircle,
    Home,
    Info,
    Link as LinkIcon,
    Loader2,
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
      "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20 hover:bg-rose-200/50 dark:hover:bg-rose-500/20",
  },
  {
    value: "utilities",
    label: "Utilities",
    icon: Wallet,
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 hover:bg-amber-200/50 dark:hover:bg-amber-500/20",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: Home,
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 hover:bg-blue-200/50 dark:hover:bg-blue-500/20",
  },
  {
    value: "salaries",
    label: "Salaries",
    icon: Coins,
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 hover:bg-emerald-200/50 dark:hover:bg-emerald-500/20",
  },
  {
    value: "supplies",
    label: "Supplies",
    icon: ShoppingBag,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20 hover:bg-purple-200/50 dark:hover:bg-purple-500/20",
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: Sparkles,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/20 hover:bg-orange-200/50 dark:hover:bg-orange-500/20",
  },
  {
    value: "transport",
    label: "Transport",
    icon: Activity,
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 hover:bg-indigo-200/50 dark:hover:bg-indigo-500/20",
  },
  {
    value: "misc",
    label: "Miscellaneous",
    icon: HelpCircle,
    color:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-500/10 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-500/20 hover:bg-zinc-200/50 dark:hover:bg-zinc-500/20",
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
  const [specialRequests, setSpecialRequests] = useState("");

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
          specialRequests: specialRequests.trim() || "None shared.",
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
        setSpecialRequests("");
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
          <div className="w-16 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
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
            <div className="grid grid-cols-3 gap-1 bg-muted/85 dark:bg-muted/60 p-1.5 rounded-2xl border border-border relative">
              <button
                onClick={() => {
                  haptic("light");
                  setActiveTab("booking");
                }}
                className={cn(
                  "relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition z-10",
                  activeTab === "booking"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {activeTab === "booking" && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-background rounded-xl shadow-xs border border-border -z-10"
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
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {activeTab === "expense" && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-background rounded-xl shadow-xs border border-border -z-10"
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
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {activeTab === "sale" && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-background rounded-xl shadow-xs border border-border -z-10"
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
                  className="space-y-4"
                >
                  {/* Huge Tactile Amount Input */}
                  <div className="group relative space-y-1.5 bg-card border border-border rounded-2xl p-4 transition-all duration-300 focus-within:border-rose-500/40 focus-within:shadow-[0_0_24px_-6px_rgba(244,63,94,0.25)] focus-within:ring-1 focus-within:ring-rose-500/15">
                    <label className="text-[10px] font-extrabold tracking-wider text-muted-foreground/60 uppercase pl-0.5">
                      Expense Amount
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-3xl font-black text-rose-500 select-none">
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
                        className="w-full bg-transparent pl-16 pr-2 py-0 text-4xl font-black text-foreground focus:outline-none placeholder:text-muted-foreground/15 select-all transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <Input
                    label="What was this for? *"
                    value={expenseData.description}
                    onChange={(v) =>
                      setExpenseData((p) => ({
                        ...p,
                        description: v,
                      }))
                    }
                    placeholder="e.g. Tomato & Onion crates, Caretaker gas cylinder"
                    icon={ShoppingCart}
                  />

                  {/* Visual Category Grid */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground pl-0.5">
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
                              "flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all duration-200 gap-1 cursor-pointer",
                              isSelected
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500 scale-[1.03] shadow-sm font-semibold"
                                : "bg-secondary border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                isSelected
                                  ? "text-rose-600 dark:text-rose-400"
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
                    <label className="text-xs font-bold text-muted-foreground pl-0.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 bg-muted/80 dark:bg-muted/40 p-1 rounded-xl border border-border">
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
                              "py-2 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer",
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
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        haptic("light");
                        setExpenseData((p) => ({
                          ...p,
                          showMore: !p.showMore,
                        }));
                      }}
                      className="text-xs text-rose-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
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
                          className="overflow-hidden space-y-4 pt-1"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DatePicker
                              label="Expense Date"
                              value={
                                expenseData.date
                                  ? new Date(expenseData.date)
                                  : null
                              }
                              onChange={(d) =>
                                setExpenseData((p) => ({
                                  ...p,
                                  date: d ? d.toISOString().split("T")[0] : "",
                                }))
                              }
                            />
                            <Input
                              label="Recorded By"
                              placeholder="Your Name"
                              value={expenseData.recordedBy}
                              onChange={(v) =>
                                setExpenseData((p) => ({
                                  ...p,
                                  recordedBy: v,
                                }))
                              }
                              icon={User}
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <Input
                              label="Receipt URL"
                              placeholder="https://..."
                              value={expenseData.receiptUrl}
                              onChange={(v) =>
                                setExpenseData((p) => ({
                                  ...p,
                                  receiptUrl: v,
                                }))
                              }
                              icon={LinkIcon}
                            />
                            <div className="flex flex-col gap-2 w-full">
                              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 pl-0.5">
                                Notes
                              </label>
                              <div className="relative flex items-start">
                                <FileText className="absolute left-4 top-3.5 w-4.5 h-4.5 text-muted-foreground/45 pointer-events-none" />
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
                                  className="w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-sm font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/30 focus:outline-none hover:border-border/80 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/15"
                                />
                              </div>
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
                      className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[48px]"
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
                  className="space-y-4"
                >
                  {/* Tactile Amount Input */}
                  <div className="group relative space-y-1.5 bg-card border border-border rounded-2xl p-4 transition-all duration-300 focus-within:border-orange-500/40 focus-within:shadow-[0_0_24px_-6px_rgba(249,115,22,0.25)] focus-within:ring-1 focus-within:ring-orange-500/15">
                    <label className="text-[10px] font-extrabold tracking-wider text-muted-foreground/60 uppercase pl-0.5">
                      Sale Amount
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-3xl font-black text-orange-500 select-none">
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
                        className="w-full bg-transparent pl-16 pr-2 py-0 text-4xl font-black text-foreground focus:outline-none placeholder:text-muted-foreground/15 select-all transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Guest Name */}
                  <Input
                    label="Guest Name *"
                    value={saleData.guestName}
                    onChange={(v) =>
                      setSaleData((p) => ({
                        ...p,
                        guestName: v,
                      }))
                    }
                    placeholder="e.g. Arpit Dawar (Room 102)"
                    icon={User}
                  />

                  {/* Segmented Selectors: Sale Type & Guest Type in 2 cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sale Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground pl-0.5">
                        Sale Type
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-muted/85 dark:bg-muted/40 p-1 rounded-xl border border-border">
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
                                "py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 capitalize cursor-pointer",
                                saleData.saleType === t
                                  ? "bg-background text-orange-600 dark:text-orange-400 shadow-sm border border-border"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {t === "restaurant" && (
                                <Utensils className="w-3.5 h-3.5" />
                              )}
                              {t === "activity" && (
                                <Activity className="w-3.5 h-3.5" />
                              )}
                              {t === "stay" && <Home className="w-3.5 h-3.5" />}
                              <span>{t}</span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Guest Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground pl-0.5">
                        Guest Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-muted/85 dark:bg-muted/40 p-1 rounded-xl border border-border">
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
                              "py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              saleData.guestType === g
                                ? "bg-background text-orange-600 dark:text-orange-400 shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {g === "outsider" ? (
                              <Users className="w-3.5 h-3.5" />
                            ) : (
                              <Home className="w-3.5 h-3.5" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground pl-0.5">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-1 bg-muted/85 dark:bg-muted/40 p-1 rounded-xl border border-border">
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
                              "py-2 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer",
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

                    <DatePicker
                      label="Sale Date"
                      value={saleData.date ? new Date(saleData.date) : null}
                      onChange={(d) =>
                        setSaleData((p) => ({
                          ...p,
                          date: d ? d.toISOString().split("T")[0] : "",
                        }))
                      }
                    />
                  </div>

                  {/* Notes */}
                  <Input
                    label="Notes (Optional)"
                    placeholder="Add meal detail or activity name"
                    value={saleData.notes}
                    onChange={(v) =>
                      setSaleData((p) => ({
                        ...p,
                        notes: v,
                      }))
                    }
                    icon={FileText}
                  />

                  {/* Submit button */}
                  <div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/15 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer min-h-[48px]"
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
                  <div className="flex items-center justify-between pb-1 border-b border-border shrink-0">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
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
                                ? "bg-primary border-primary/50 text-primary-foreground shadow-[0_0_16px_-4px_var(--glow-color)]"
                                : isCompleted
                                  ? "bg-primary/15 border-primary/30 text-primary"
                                  : "bg-muted border-border text-muted-foreground/30",
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
                          specialRequests={specialRequests}
                          setSpecialRequests={setSpecialRequests}
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
                          specialRequests={specialRequests}
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
                        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-secondary text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 min-h-[48px]"
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
                            ? "bg-foreground text-background shadow-md hover:bg-foreground/90"
                            : "bg-muted text-muted-foreground/45 cursor-not-allowed",
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
                        className={cn(
                          "relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold overflow-hidden transition-all duration-200 min-h-[48px] text-primary-foreground",
                          !saving && canProceed()
                            ? "bg-primary hover:opacity-95 shadow-lg shadow-primary/15"
                            : "bg-muted text-muted-foreground/30 cursor-not-allowed",
                        )}
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
                              className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
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
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
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
