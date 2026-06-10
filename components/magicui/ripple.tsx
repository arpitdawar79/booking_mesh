"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

interface RippleProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  duration?: number;
}

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function Ripple({
  children,
  className,
  color = "rgba(20,184,166,0.25)",
  duration = 600,
}: RippleProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  const addRipple = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      const id = counterRef.current++;
      setRipples((prev) => [...prev, { id, x, y, size }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, duration);
    },
    [duration],
  );

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onMouseDown={addRipple}
      onTouchStart={addRipple}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              background: color,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      {children}
    </div>
  );
}
