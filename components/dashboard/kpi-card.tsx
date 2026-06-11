"use client";

import { MagicCard } from "@/components/ui/magic-card";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  change,
  suffix,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  change: number | null;
  suffix: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <MagicCard className="p-3 sm:p-4" borderBeam backlight>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-muted/20 border border-border/40 group-hover:scale-105 group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-all duration-300 shrink-0">
            {icon}
          </div>
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] truncate">
            {label}
          </span>
        </div>

        <div className="space-y-1">
          <div className={accent || "text-foreground"}>{value}</div>

          {change !== null && (
            <div className="flex items-center gap-1 text-[11px] font-semibold">
              {change > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                  <TrendingUp className="w-3 h-3" />+{change.toFixed(1)}%
                </span>
              ) : change < 0 ? (
                <span className="inline-flex items-center gap-0.5 text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                  <TrendingDown className="w-3 h-3" />
                  {change.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-full shrink-0">
                  <Minus className="w-3 h-3" />
                  0%
                </span>
              )}
              <span className="text-muted-foreground/80 font-normal ml-0.5 truncate">
                {suffix}
              </span>
            </div>
          )}
          {change === null && (
            <div className="text-[11px] text-muted-foreground/80 font-medium pl-1 truncate">
              {suffix}
            </div>
          )}
        </div>
      </div>
    </MagicCard>
  );
}
