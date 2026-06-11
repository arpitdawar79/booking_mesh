"use client";

import { useHaptic, useNetworkState } from "@/lib/pwa-hooks";
import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InstallPrompt } from "./install-prompt";
import { OfflineSyncBadge } from "./offline-sync";
import { PushNotificationPrompt } from "./push-prompt";

function PWAStatus() {
  const { serwist } = useSerwist();
  const { online } = useNetworkState();
  const [updateReady, setUpdateReady] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const haptic = useHaptic();
  const pendingReload = useRef(false);

  useEffect(() => {
    if (!serwist) return;

    const onWaiting = () => {
      haptic("medium");
      setUpdateReady(true);
    };
    const onControlling = () => {
      if (pendingReload.current) {
        window.location.reload();
      }
      pendingReload.current = false;
      setUpdateReady(false);
    };

    serwist.addEventListener("waiting", onWaiting);
    serwist.addEventListener("controlling", onControlling);

    return () => {
      serwist.removeEventListener("waiting", onWaiting);
      serwist.removeEventListener("controlling", onControlling);
    };
  }, [serwist, haptic]);

  useEffect(() => {
    if (online) {
      setShowOnline(true);
      const t = setTimeout(() => setShowOnline(false), 2500);
      return () => clearTimeout(t);
    }
  }, [online]);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="pwa-toast"
          role="status"
        >
          <CloudOff className="h-4 w-4 text-amber-400" />
          <span>You're offline</span>
        </motion.div>
      )}

      {online && showOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="pwa-toast"
          role="status"
        >
          <Wifi className="h-4 w-4 text-emerald-400" />
          <span>Back online</span>
        </motion.div>
      )}

      {updateReady && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="pwa-toast pwa-toast-action"
          role="status"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Update ready</span>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              pendingReload.current = true;
              serwist?.messageSkipWaiting();
            }}
          >
            Refresh
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PWAShell({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== "production"}
      cacheOnNavigation
      reloadOnOnline={false}
      options={{ scope: "/", type: "module" }}
    >
      {children}
      <PWAStatus />
      <InstallPrompt />
      <OfflineSyncBadge />
      <PushNotificationPrompt />
    </SerwistProvider>
  );
}
