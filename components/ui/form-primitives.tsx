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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const haptic = useHaptic();

  return (
    <div className="group relative flex flex-col gap-2">
      <label
        className={cn(
          "text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
          isFocused ? "text-teal-400" : "text-muted-foreground/60",
        )}
      >
        {label}
      </label>
      <div className="relative">
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
          className={cn(
            "w-full rounded-2xl border bg-[#0c0c0c]/90 px-4 py-3.5 text-sm font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground/30 focus:outline-none",
            isFocused
              ? "border-teal-500/40 shadow-[0_0_24px_-6px_rgba(20,184,166,0.2)] ring-1 ring-teal-500/15"
              : "border-white/[0.07] hover:border-white/15",
          )}
        />
        {/* Glow border background effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-px z-[-1] rounded-2xl bg-linear-to-r from-teal-500/8 to-emerald-500/8 blur-md pointer-events-none"
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [isFocused, setIsFocused] = useState(false);
  const haptic = useHaptic();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        className={cn(
          "text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
          isFocused ? "text-teal-400" : "text-muted-foreground/70",
        )}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            haptic("light");
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full rounded-2xl border bg-[#0e0e0e]/80 px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 focus:outline-none appearance-none pr-10 cursor-pointer",
            isFocused
              ? "border-teal-500/50 bg-[#0e0e0e] shadow-[0_0_20px_-3px_rgba(20,184,166,0.15)] ring-2 ring-teal-500/10"
              : "border-white/6 hover:border-white/12",
          )}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none transition-transform duration-300" />
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
      <div className="flex items-center justify-between p-2 rounded-2xl border border-white/[0.07] bg-[#0e0e0e]/90 shadow-inner">
        <motion.button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
            value <= min
              ? "text-muted-foreground/15 cursor-not-allowed"
              : "bg-white/5 text-foreground hover:bg-white/10 active:bg-white/15",
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
          className="w-10 h-10 rounded-xl bg-white/5 text-foreground hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all duration-200"
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
                ? "bg-teal-500/12 text-teal-300 border-teal-500/30 shadow-[0_0_18px_-5px_rgba(20,184,166,0.25)]"
                : "bg-white/3 border-white/6 text-muted-foreground/55 hover:text-foreground hover:bg-white/6",
            )}
          >
            {isSelected && (
              <motion.span
                layoutId={`pillToggle-${option}`}
                className="absolute inset-0 rounded-2xl bg-teal-500/8 border border-teal-400/20"
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
    <div className="flex flex-wrap gap-2 p-1 bg-[#090909] rounded-2xl border border-white/5 w-fit">
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
                className="absolute inset-0 bg-white text-background rounded-xl"
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
                  ? "text-background font-black"
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
    <div className="rounded-3xl border border-white/[0.07] p-5 sm:p-7 space-y-6 bg-[#0d0d0d]/60 backdrop-blur-2xl relative overflow-hidden shadow-[0_2px_40px_rgba(0,0,0,0.5)]">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={0.8}
        color="#14b8a6"
        opacity={0.04}
        className="rounded-3xl"
      />
      <div className="absolute inset-0 bg-linear-to-b from-teal-500/2.5 via-transparent to-transparent pointer-events-none rounded-3xl" />
      <BorderBeam
        size={200}
        duration={14}
        colorFrom="#14b8a6"
        colorTo="#4ade80"
        borderWidth={0.7}
      />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_16px_-4px_rgba(20,184,166,0.3)]">
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
    <div className="rounded-2xl border border-white/6 bg-white/2 p-5 space-y-3 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-teal-500/3 to-transparent pointer-events-none rounded-2xl" />
      <div className="relative flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider text-teal-400">
        <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
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
    <div className="flex justify-between items-center text-sm py-2.5 first:pt-0 last:pb-0">
      <span className="text-muted-foreground/70 font-semibold">{label}</span>
      <span className="font-extrabold text-foreground text-right">{value}</span>
    </div>
  );
}
