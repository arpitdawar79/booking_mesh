"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Plus, Receipt, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { QuickAddDrawer } from "./quick-add-drawer";

const quickActions = [
  {
    label: "New Booking",
    id: "booking" as const,
    icon: <CalendarPlus className="w-4 h-4" />,
    color: "bg-teal-500",
    shortcut: "b",
  },
  {
    label: "Add Expense",
    id: "expense" as const,
    icon: <Receipt className="w-4 h-4" />,
    color: "bg-rose-500",
    shortcut: "e",
  },
  {
    label: "Add Sale",
    id: "sale" as const,
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "bg-orange-500",
    shortcut: "s",
  },
];

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"booking" | "expense" | "sale">(
    "booking",
  );
  const [cmdKey, setCmdKey] = useState("Ctrl");

  useEffect(() => {
    setCmdKey(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase();
        const action = quickActions.find((a) => a.shortcut === key);
        if (action) {
          e.preventDefault();
          setDrawerTab(action.id);
          setDrawerOpen(true);
          setOpen(false);
        }
      }
      if (e.key === "Escape") {
        setOpen(false);
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleActionClick = (tab: "booking" | "expense" | "sale") => {
    setDrawerTab(tab);
    setDrawerOpen(true);
    setOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <>
              {quickActions.map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-medium bg-background/90 backdrop-blur border border-border rounded-lg px-2.5 py-1 shadow-sm select-none">
                    {action.label}
                    <span className="ml-1.5 text-muted-foreground">
                      {cmdKey}+{action.shortcut.toUpperCase()}
                    </span>
                  </span>
                  <button
                    onClick={() => handleActionClick(action.id)}
                    className={`w-10 h-10 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all`}
                  >
                    {action.icon}
                  </button>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-xl hover:opacity-90 active:scale-95 transition"
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </motion.div>
        </button>
      </div>

      <QuickAddDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialTab={drawerTab}
      />
    </>
  );
}
