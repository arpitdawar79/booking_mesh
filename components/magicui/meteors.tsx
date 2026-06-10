"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const [meteors, setMeteors] = useState<
    { id: number; left: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    const m = Array.from({ length: number }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 2 + 1,
    }));
    setMeteors(m);
  }, [number]);

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
    >
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="absolute top-0 h-0.5 w-0.5 rotate-215 animate-meteor rounded-full bg-teal-400/60 shadow-[0_0_0_1px_#ffffff10]"
          style={{
            left: `${meteor.left}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        >
          <span className="absolute top-1/2 -translate-y-1/2 h-px w-12 bg-linear-to-r from-teal-400/40 to-transparent" />
        </span>
      ))}
    </div>
  );
}
