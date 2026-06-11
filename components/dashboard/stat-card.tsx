"use client";

import { MagicCard } from "@/components/ui/magic-card";

export function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <MagicCard className="p-3 sm:p-4" borderBeam backlight>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-[10px] font-extrabold text-foreground/75 dark:text-foreground/60 uppercase tracking-widest truncate">
            {label}
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {value}
          </div>
          <div className="text-[11px] text-muted-foreground/80 font-medium pl-1 truncate">
            {sub}
          </div>
        </div>
      </div>
    </MagicCard>
  );
}
