"use client";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  borderWidth = 1.5,
  colorFrom = "#14b8a6",
  colorTo = "#4ade80",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "[mask-clip:padding-box,border-box] mask-intersect",
        "mask-[linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        className,
      )}
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": 90,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
          animation: `border-beam calc(var(--duration)*1s) calc(var(--delay)) infinite linear`,
          backgroundImage: `conic-gradient(from 0deg at calc(var(--anchor)*1%) calc(var(--anchor)*1%), transparent 0%, var(--color-from) 25%, var(--color-to) 50%, transparent 75%)`,
        } as React.CSSProperties
      }
    />
  );
}
