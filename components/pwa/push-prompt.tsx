"use client";

import { usePushNotifications } from "@/lib/push-client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function PushNotificationPrompt() {
  const { supported, subscribed, loading, subscribe, unsubscribe } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Hide if not supported or already subscribed or dismissed
  if (!supported || subscribed || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-50 max-w-[260px] rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl p-3 space-y-2"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-foreground leading-tight">
              Enable push notifications
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Get instant alerts for new bookings and check-ins.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => subscribe()}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-[10px] font-extrabold hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Bell className="w-3 h-3" />
            )}
            Enable
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl bg-muted/50 border border-border px-3 py-2 text-[10px] font-extrabold text-muted-foreground hover:bg-muted active:scale-[0.97] transition-all"
          >
            <BellOff className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
