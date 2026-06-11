"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BacklightProps {
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  blur?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export function Backlight({
  className,
  colorFrom = "from-teal-500/10",
  colorTo = "to-indigo-500/5",
  blur = "3xl",
}: BacklightProps) {
  const blurClasses = {
    sm: "blur-sm",
    md: "blur-md",
    lg: "blur-lg",
    xl: "blur-xl",
    "2xl": "blur-2xl",
    "3xl": "blur-3xl",
  };

  return (
    <div
      className={cn(
        "absolute -z-10 rounded-full bg-linear-to-br opacity-60 pointer-events-none select-none",
        colorFrom,
        colorTo,
        blurClasses[blur],
        className
      )}
    />
  );
}
