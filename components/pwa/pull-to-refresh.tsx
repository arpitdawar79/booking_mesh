"use client";

import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 120,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const controls = useAnimation();
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 5;
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!isAtTop()) return;
      startY.current = e.touches[0].clientY;
      pullDistance.current = 0;
      setPulling(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      if (!isAtTop()) {
        setPulling(false);
        controls.set({ y: 0 });
        return;
      }

      const delta = e.touches[0].clientY - startY.current;
      if (delta < 0) {
        // scrolling up — abort pull-to-refresh and let native scroll take over
        setPulling(false);
        controls.set({ y: 0 });
        return;
      }

      e.preventDefault();
      const resistance = 0.4;
      const distance = Math.min(delta * resistance, threshold * 1.5);
      pullDistance.current = distance;
      controls.set({ y: distance });
      setReady(distance >= threshold * 0.8);
    };

    const onTouchEnd = async () => {
      if (!pulling) return;
      setPulling(false);

      if (ready && !refreshing) {
        setRefreshing(true);
        await controls.start({
          y: threshold * 0.6,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        });
        try {
          await onRefresh();
        } finally {
          await controls.start({
            y: 0,
            transition: { type: "spring", stiffness: 400, damping: 30 },
          });
          setRefreshing(false);
          setReady(false);
        }
      } else {
        controls.start({
          y: 0,
          transition: { type: "spring", stiffness: 400, damping: 30 },
        });
        setReady(false);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pulling, ready, refreshing, isAtTop, controls, threshold, onRefresh]);

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-x-0 top-0 z-40 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, y: -40 }}
        animate={controls}
        style={{ height: threshold }}
      >
        <div className="flex flex-col items-center gap-1">
          <motion.div
            animate={{ rotate: refreshing ? 360 : 0, scale: ready ? 1.2 : 1 }}
            transition={
              refreshing
                ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                : { type: "spring" }
            }
          >
            <RefreshCw
              className={`w-6 h-6 ${ready ? "text-teal-400" : "text-muted-foreground"}`}
            />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {refreshing
              ? "Refreshing..."
              : ready
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </motion.div>

      <motion.div ref={contentRef} animate={controls}>
        {children}
      </motion.div>
    </div>
  );
}
