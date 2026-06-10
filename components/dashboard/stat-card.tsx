"use client";

import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative rounded-2xl border border-border/80 bg-card/40 backdrop-blur-xl p-4 sm:p-5 space-y-3 overflow-hidden shadow-sm group hover:border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/2"
    >
      {/* Premium ambient glow */}
      <div className="absolute -inset-px bg-linear-to-br from-teal-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[120px] h-[40px] bg-teal-500/15 blur-[25px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center gap-2.5 relative z-10">
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 group-hover:scale-110 group-hover:border-teal-500/20 transition-all duration-300">
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </div>
        <div className="text-xs text-muted-foreground/80 font-medium pl-1">
          {sub}
        </div>
      </div>
    </motion.div>
  );
}
