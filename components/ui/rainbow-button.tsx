"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function RainbowButton({
  children,
  className,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center rounded-xl bg-background px-5 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all duration-300 active:scale-[0.98] overflow-hidden cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Ambient shadow glow */}
      <span className="absolute inset-0 z-0 bg-linear-to-r from-[#14b8a6] via-[#8b5cf6] via-[#f59e0b] to-[#14b8a6] opacity-20 blur-md transition-opacity duration-500 group-hover:opacity-40" />
      
      {/* Cycling Rainbow Border */}
      <span className="absolute -inset-[1px] -z-10 rounded-xl bg-linear-to-r from-[#14b8a6] via-[#8b5cf6] via-[#f59e0b] to-[#14b8a6] bg-[length:200%_100%] animate-rainbow" />
      
      {/* Background Mask */}
      <span className="absolute inset-[1px] -z-10 rounded-[11px] bg-background transition-colors duration-300" />
      
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
