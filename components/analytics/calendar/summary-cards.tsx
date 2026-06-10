"use client";

import { motion } from "framer-motion";
import {
  BedDouble,
  DollarSign,
  DoorOpen,
  IndianRupee,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

interface MonthSummary {
  totalRooms: number;
  totalGuests: number;
  totalRevenue: number;
  totalCheckins: number;
  totalCheckouts: number;
  avgRooms: number;
  avgRevenue: number;
  totalAdditionalSales: number;
  totalExpenses: number;
}

interface SummaryCardsProps {
  summary: MonthSummary;
  daysInMonth: number;
}

function formatCurrency(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function SummaryCards({ summary, daysInMonth }: SummaryCardsProps) {
  const occupancyPercent = summary.avgRooms > 0 
    ? Math.round((summary.avgRooms / 10) * 100) 
    : 0;
  
  const adr = summary.totalGuests > 0 
    ? summary.totalRevenue / summary.totalGuests 
    : 0;
  
  const revpar = summary.avgRooms > 0 
    ? summary.avgRevenue 
    : 0;
  
  const netRevenue = summary.totalRevenue + summary.totalAdditionalSales - summary.totalExpenses;

  const cards = [
    {
      icon: <BedDouble className="w-4 h-4 text-teal-400" />,
      label: "Avg Occupancy",
      value: `${occupancyPercent}%`,
      sub: `${summary.avgRooms.toFixed(1)} rooms/night`,
      color: "teal",
    },
    {
      icon: <Users className="w-4 h-4 text-blue-400" />,
      label: "Total Guests",
      value: summary.totalGuests.toLocaleString("en-IN"),
      sub: `${summary.totalCheckins} check-ins`,
      color: "blue",
    },
    {
      icon: <IndianRupee className="w-4 h-4 text-emerald-400" />,
      label: "Room Revenue",
      value: formatCurrency(summary.totalRevenue),
      sub: `${formatCurrency(summary.avgRevenue)}/night avg`,
      color: "emerald",
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-violet-400" />,
      label: "ADR",
      value: formatCurrency(adr),
      sub: "Avg daily rate",
      color: "violet",
    },
    {
      icon: <DollarSign className="w-4 h-4 text-amber-400" />,
      label: "RevPAR",
      value: formatCurrency(revpar),
      sub: "Per available room",
      color: "amber",
    },
    {
      icon: <ShoppingCart className="w-4 h-4 text-cyan-400" />,
      label: "Add-on Sales",
      value: formatCurrency(summary.totalAdditionalSales),
      sub: "Food & extras",
      color: "cyan",
    },
    {
      icon: <Receipt className="w-4 h-4 text-rose-400" />,
      label: "Expenses",
      value: formatCurrency(summary.totalExpenses),
      sub: "For the month",
      color: "rose",
    },
    {
      icon: <DoorOpen className="w-4 h-4 text-orange-400" />,
      label: "Movements",
      value: `${summary.totalCheckins}`,
      sub: `${summary.totalCheckouts} check-outs`,
      color: "orange",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3"
    >
      {cards.map((card, idx) => (
        <SummaryCard key={card.label} card={card} index={idx} />
      ))}
    </motion.div>
  );
}

function SummaryCard({ card, index }: { card: any; index: number }) {
  const colorClasses: Record<string, string> = {
    teal: "group-hover:border-teal-500/30 from-teal-500/[0.08]",
    blue: "group-hover:border-blue-500/30 from-blue-500/[0.08]",
    emerald: "group-hover:border-emerald-500/30 from-emerald-500/[0.08]",
    violet: "group-hover:border-violet-500/30 from-violet-500/[0.08]",
    amber: "group-hover:border-amber-500/30 from-amber-500/[0.08]",
    cyan: "group-hover:border-cyan-500/30 from-cyan-500/[0.08]",
    rose: "group-hover:border-rose-500/30 from-rose-500/[0.08]",
    orange: "group-hover:border-orange-500/30 from-orange-500/[0.08]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.03 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative rounded-xl sm:rounded-2xl border border-border/60 bg-card/30 backdrop-blur-xl p-2.5 sm:p-4 space-y-1 overflow-hidden group hover:border-teal-500/20 transition-all cursor-pointer`}
    >
      <div className={`absolute -inset-px bg-linear-to-br ${colorClasses[card.color]} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {card.icon}
          <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider truncate">
            {card.label}
          </span>
        </div>
        <div className="text-base sm:text-xl font-black tracking-tight text-foreground">
          {card.value}
        </div>
        <div className="text-[9px] sm:text-[11px] text-muted-foreground/70 font-medium truncate">
          {card.sub}
        </div>
      </div>
    </motion.div>
  );
}

export { formatCurrency };
