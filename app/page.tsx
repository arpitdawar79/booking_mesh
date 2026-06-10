"use client";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import { motion } from "framer-motion";
import {
    CalendarDays,
    Mail,
    Receipt,
    Shield,
    Sparkles,
    Zap,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-16 overflow-hidden">
      {/* Absolute Ambient Layer */}
      <AnimatedGrid />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10 sm:space-y-12">
        {/* Elite Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex justify-center"
        >
          <div className="relative group rounded-full border border-teal-500/35 bg-teal-500/5 px-4 py-1.5 text-xs sm:text-sm text-teal-400 font-semibold tracking-wider uppercase flex items-center gap-2 overflow-hidden shadow-sm shadow-teal-500/5 hover:border-teal-500/50 transition">
            <span
              className="absolute inset-0 w-1/3 h-full bg-linear-to-r from-transparent via-teal-500/15 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"
              style={{ animationDuration: "1.5s" }}
            />
            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>The Stream by Ekantah</span>
          </div>
        </motion.div>

        {/* Premium Studio Typography */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none bg-linear-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
          >
            Digital Ecosystem & <br className="hidden sm:inline" />
            <span className="bg-linear-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Booking Control
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-lg text-muted-foreground/90 font-medium max-w-md mx-auto leading-relaxed"
          >
            A cohesive unified interface for real-time guest operations,
            WhatsApp dispatch, salary payrolls, and professional SMTP layouts.
          </motion.p>
        </div>

        {/* Shimmering CTA Layout */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4 max-w-sm mx-auto"
        >
          <Link
            href="/dashboard"
            className="group relative flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-sm sm:text-base font-bold h-13 hover:opacity-95 active:scale-[0.98] transition shadow-2xl shadow-foreground/15 overflow-hidden w-full"
          >
            <div
              className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"
              style={{ animationDuration: "1.8s" }}
            />
            <Shield className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-6" />
            <span>Access Administrative Board</span>
          </Link>
          <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium flex items-center justify-center gap-2">
            <Mail className="w-3.5 h-3.5 text-teal-500" />
            <span>
              Secure credentials required for dashboard authentication
            </span>
          </p>
        </motion.div>

        {/* Interactive Features Bento-Grid Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="border-t border-border/80 pt-10 space-y-6"
        >
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground/80 uppercase tracking-widest">
            OPERATIONAL CAPABILITIES
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: "Live Booking Control",
                desc: "Check-in states, calendar occupancy ratios, and dynamic balance calculations.",
                icon: <CalendarDays className="w-4 h-4 text-teal-400" />,
              },
              {
                title: "Automated Dispatch",
                desc: "Send high-fidelity PDFs, custom confirmation templates over WhatsApp and SMTP.",
                icon: <Zap className="w-4 h-4 text-emerald-400" />,
              },
              {
                title: "Unified Financials",
                desc: "Quick log expenses, supplementary property sales, and staff payroll slips.",
                icon: <Receipt className="w-4 h-4 text-violet-400" />,
              },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative text-left rounded-2xl border border-border/80 bg-card/25 backdrop-blur-md p-5 space-y-3 cursor-default hover:border-teal-500/20 group"
              >
                <div className="p-2 rounded-xl bg-muted/30 border border-border/40 w-fit group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition duration-300">
                  {feat.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-teal-400">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
