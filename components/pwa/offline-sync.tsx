"use client";

import { useOfflineQueue } from "@/lib/offline-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpCircle, RefreshCw, Trash2, Wifi } from "lucide-react";
import { useState } from "react";

export function OfflineSyncBadge() {
  const { pendingCount, failedCount, syncing, online, syncNow, clearFailed } =
    useOfflineQueue();
  const [open, setOpen] = useState(false);

  if (pendingCount === 0 && failedCount === 0) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-extrabold text-amber-700 dark:text-amber-400 backdrop-blur-xl shadow-lg"
      >
        {syncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowUpCircle className="h-3.5 w-3.5" />
        )}
        <span>
          {syncing
            ? "Syncing..."
            : `${pendingCount} pending${failedCount > 0 ? ` · ${failedCount} failed` : ""}`}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] right-4 z-50 w-64 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Offline Queue
              </h4>
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <Wifi className="w-3 h-3" />
                {online ? "Online" : "Offline"}
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-muted-foreground font-medium">
              <div className="flex justify-between">
                <span>Pending mutations</span>
                <span className="font-bold text-foreground">{pendingCount}</span>
              </div>
              {failedCount > 0 && (
                <div className="flex justify-between">
                  <span>Failed</span>
                  <span className="font-bold text-rose-500">{failedCount}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  syncNow();
                  setOpen(false);
                }}
                disabled={!online || syncing || pendingCount === 0}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-[10px] font-extrabold text-primary hover:bg-primary/20 disabled:opacity-40 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Now
              </button>
              {failedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearFailed();
                    setOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
