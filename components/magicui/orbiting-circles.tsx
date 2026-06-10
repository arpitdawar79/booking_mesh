"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OrbitingCirclesProps {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
}

export function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 0,
  radius = 100,
}: OrbitingCirclesProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        className="absolute"
        style={{ width: radius * 2, height: radius * 2 }}
        animate={{ rotate: reverse ? -360 : 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
