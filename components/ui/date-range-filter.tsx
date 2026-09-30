"use client";

import {
    DATE_RANGE_PRESETS,
    DateRangePreset,
    DateRangeSelection,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

interface DateRangeFilterProps {
  value: DateRangeSelection;
  onChange: (value: DateRangeSelection) => void;
  className?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  function handlePreset(e: React.ChangeEvent<HTMLSelectElement>) {
    const preset = e.target.value as DateRangePreset;
    if (preset === "custom") {
      onChange({
        preset,
        from: value.from || "",
        to: value.to || "",
      });
    } else {
      onChange({ preset });
    }
  }

  function handleBound(key: "from" | "to", v: string) {
    const next = { ...value, preset: "custom" as const, [key]: v };
    // Keep the range ordered when both bounds are set
    if (next.from && next.to && next.from > next.to) {
      if (key === "from") next.to = next.from;
      else next.from = next.to;
    }
    onChange(next);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative">
        <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={value.preset}
          onChange={handlePreset}
          aria-label="Date range"
          className={cn(inputClass, "pl-8 pr-2 appearance-none cursor-pointer")}
        >
          {DATE_RANGE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {value.preset === "custom" && (
        <>
          <input
            type="date"
            value={value.from || ""}
            onChange={(e) => handleBound("from", e.target.value)}
            aria-label="From date"
            className={inputClass}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={value.to || ""}
            onChange={(e) => handleBound("to", e.target.value)}
            aria-label="To date"
            className={inputClass}
          />
        </>
      )}
    </div>
  );
}
