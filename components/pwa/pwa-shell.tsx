"use client";

import { useHaptic, useNetworkState } from "@/lib/pwa-hooks";
import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { InstallPrompt } from "./install-prompt";

function PWAStatus() {
  const { serwist } = useSerwist();
  const { online } = useNetworkState();
  const [updateReady, setUpdateReady] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    if (!serwist) return;

    const onWaiting = () => {
      haptic("medium");
      setUpdateReady(true);
    };
    const onControlling = () => window.location.reload();

    serwist.addEventListener("waiting", onWaiting);
    serwist.addEventListener("controlling", onControlling);

    return () => {
      serwist.removeEventListener("waiting", onWaiting);
      serwist.removeEventListener("controlling", onControlling);
    };
  }, [serwist, haptic]);

  if (!online) {
    return (
      <div className="pwa-toast" role="status">
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </div>
    );
  }

  if (updateReady) {
    return (
      <div className="pwa-toast pwa-toast-action" role="status">
        <RefreshCw className="h-4 w-4" />
        <span>Update ready</span>
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            serwist?.messageSkipWaiting();
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return null;
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
    </SerwistProvider>
  );
}
