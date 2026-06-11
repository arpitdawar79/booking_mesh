"use client";

import { BorderBeam } from "@/components/magicui/border-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { useHaptic } from "@/lib/pwa-hooks";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useState } from "react";

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
  onEnter,
  icon: Icon,
  inputMode,
  autoComplete,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  name?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const haptic = useHaptic();

  return (
    <div className="group relative flex flex-col gap-2">
      <label
        className={cn(
          "text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
          isFocused
            ? "text-primary"
            : "text-muted-foreground/85 dark:text-muted-foreground/60",
        )}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon
            className={cn(
              "absolute left-4 w-4.5 h-4.5 transition-colors duration-300 pointer-events-none z-10",
              isFocused ? "text-primary" : "text-muted-foreground/50",
            )}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
            haptic("light");
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          inputMode={inputMode}
          autoComplete={autoComplete}
          name={name}
          className={cn(
            "w-full rounded-2xl border bg-secondary/50 focus:bg-card dark:bg-secondary/30 py-3 sm:py-3.5 text-sm font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/30 focus:outline-none shadow-xs",
            Icon ? "pl-12 pr-4" : "px-3.5 sm:px-4",
            isFocused
              ? "border-primary/60 shadow-[var(--glow-shadow)] ring-2 ring-primary/20"
              : "border-border hover:border-border/80",
          )}
        />
        {/* Glow border background effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-px z-[-1] rounded-2xl bg-linear-to-r from-primary/10 to-accent/5 blur-md pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const haptic = useHaptic();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        className={cn(
          "text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
          isFocused
            ? "text-primary"
            : "text-muted-foreground/85 dark:text-muted-foreground/70",
        )}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon
            className={cn(
              "absolute left-4 w-4.5 h-4.5 transition-colors duration-300 pointer-events-none z-10",
              isFocused ? "text-primary" : "text-muted-foreground/50",
            )}
          />
        )}
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            haptic("light");
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full rounded-2xl border bg-secondary/50 focus:bg-card dark:bg-secondary/30 py-3 text-sm font-medium text-foreground transition-all duration-300 focus:outline-none appearance-none pr-10 cursor-pointer shadow-xs",
            Icon ? "pl-12" : "px-4",
            isFocused
              ? "border-primary bg-card shadow-[var(--glow-shadow)] ring-2 ring-primary/20"
              : "border-border hover:border-border/80",
          )}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 w-4 h-4 text-muted-foreground/60 pointer-events-none transition-transform duration-300" />
      </div>
    </div>
  );
}

export function GuestCounter({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
}) {
  const haptic = useHaptic();

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
      haptic("medium");
    } else {
      haptic("warning");
    }
  };

  const handleIncrement = () => {
    onChange(value + 1);
    haptic("medium");
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </label>
      <div className="flex items-center justify-between p-1.5 rounded-2xl border border-border bg-secondary/60 dark:bg-secondary/30 shadow-xs">
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border border-border/40 shadow-xs",
            value <= min
              ? "text-muted-foreground/15 cursor-not-allowed bg-transparent border-transparent"
              : "bg-card text-foreground hover:bg-secondary active:bg-accent/50",
          )}
        >
          <Minus className="w-3.5 h-3.5" />
        </motion.button>
        <span className="text-lg font-black tracking-tight text-foreground min-w-10 text-center flex items-center justify-center tabular-nums">
          <NumberFlow
            value={value}
            transformTiming={{
              duration: 300,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </span>
        <motion.button
          type="button"
          onClick={handleIncrement}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl bg-card border border-border/40 text-foreground hover:bg-secondary active:bg-accent/50 flex items-center justify-center transition-all duration-200 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}

export function PillToggle({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  const haptic = useHaptic();

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <motion.button
            key={option}
            type="button"
            onClick={() => {
              onToggle(option);
              haptic("light");
            }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative px-4 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 border select-none",
              isSelected
                ? "bg-primary/15 text-primary border-primary/30 shadow-[var(--glow-shadow)]"
                : "bg-secondary/70 dark:bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {isSelected && (
              <motion.span
                layoutId={`pillToggle-${option}`}
                className="absolute inset-0 rounded-2xl bg-primary/10 border border-primary/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function PillSelect({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: number | string }[];
  value: number | string;
  onChange: (v: number) => void;
}) {
  const haptic = useHaptic();

  return (
    <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-2xl border border-border w-fit">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(Number(opt.value));
              haptic("light");
            }}
            className="relative px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
          >
            {isSelected && (
              <motion.span
                layoutId="pillActiveBg"
                className="absolute inset-0 bg-primary text-primary-foreground rounded-xl"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 30,
                }}
              />
            )}
            <span
              className={cn(
                "relative z-10 transition-colors duration-200",
                isSelected
                  ? "text-primary-foreground font-black"
                  : "text-muted-foreground/70 hover:text-foreground",
              )}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StepCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border p-4 sm:p-5 lg:p-7 space-y-5 sm:space-y-6 bg-card/95 dark:bg-card/50 backdrop-blur-2xl relative overflow-hidden shadow-md">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={0.8}
        color="var(--primary)"
        opacity={0.04}
        className="rounded-3xl"
      />
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none rounded-3xl" />
      <BorderBeam
        size={200}
        duration={14}
        colorFrom="var(--primary)"
        colorTo="var(--accent)"
        borderWidth={0.7}
      />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center text-primary shadow-[var(--glow-shadow)]">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground/55 font-medium leading-relaxed mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ReviewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 dark:bg-card/20 p-4 sm:p-5 space-y-3 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none rounded-2xl" />
      <div className="relative flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider text-primary">
        <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
          {icon}
        </div>
        {title}
      </div>
      <div className="relative divide-y divide-white/5">{children}</div>
    </div>
  );
}

export function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center text-sm py-2 first:pt-0 last:pb-0 sm:py-2.5">
      <span className="text-muted-foreground/70 font-semibold">{label}</span>
      <span className="font-extrabold text-foreground text-right">{value}</span>
    </div>
  );
}
