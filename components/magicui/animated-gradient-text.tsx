"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  animationDuration?: number;
}

export function AnimatedGradientText({
  children,
  className,
  gradientFrom = "#14b8a6",
  gradientVia = "#4ade80",
  gradientTo = "#06b6d4",
  animationDuration = 4,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, ${gradientFrom}, ${gradientVia}, ${gradientTo}, ${gradientFrom})`,
        backgroundSize: "300% 100%",
        animation: `gradient-shift ${animationDuration}s linear infinite`,
      }}
    >
      {children}
    </span>
  );
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}) {
  return (
    <span className={cn("relative inline-block overflow-hidden", className)}>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 z-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
        style={{ width: `${shimmerWidth}%` }}
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeInOut",
        }}
      />
    </span>
  );
}
