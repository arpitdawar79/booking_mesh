"use client";

import { Meteors } from "@/components/magicui/meteors";
import { Particles } from "@/components/magicui/particles";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { TextReveal } from "@/components/magicui/text-reveal";
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
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (r.ok) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [router]);
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-16 overflow-hidden">
      {/* MagicUI Particle Network */}
      <Particles
        quantity={60}
        staticity={40}
        color="#14b8a6"
        size={1.2}
        className="z-0"
      />

      {/* Meteor shower effect */}
      <Meteors number={12} className="z-0" />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-teal-500/[0.07] blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-violet-500/4 blur-[80px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10 sm:space-y-14">
        {/* Elite Glowing Badge with Sparkles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.1,
          }}
          className="flex justify-center"
        >
          <div className="relative group rounded-full border border-teal-500/30 bg-teal-500/3 px-5 py-2 text-xs sm:text-sm text-teal-400 font-semibold tracking-wider uppercase flex items-center gap-2.5 overflow-hidden shadow-sm shadow-teal-500/5 hover:border-teal-500/50 transition-all duration-500 backdrop-blur-sm">
            <span
              className="absolute inset-0 w-1/3 h-full bg-linear-to-r from-transparent via-teal-500/15 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"
              style={{ animationDuration: "1.5s" }}
            />
            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
            <SparklesText
              text="The Stream by Ekantah"
              sparklesCount={4}
              className="text-xs sm:text-sm"
            />
          </div>
        </motion.div>

        {/* Premium Studio Typography with Text Reveal */}
        <div className="space-y-5">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95] bg-linear-to-b from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
          >
            Digital Ecosystem
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95]"
          >
            <span className="bg-linear-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
              &amp; Booking Control
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="pt-2"
          >
            <TextReveal
              text="A cohesive unified interface for real-time guest operations, WhatsApp dispatch, salary payrolls, and professional SMTP layouts."
              className="text-sm sm:text-lg text-muted-foreground/80 font-medium max-w-md mx-auto leading-relaxed justify-center"
              delay={0.6}
            />
          </motion.div>
        </div>

        {/* Shimmering CTA with enhanced glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="space-y-4 max-w-sm mx-auto"
        >
          <Link
            href="/dashboard"
            className="group relative flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background text-sm sm:text-base font-bold py-3.5 hover:opacity-95 active:scale-[0.97] transition-all duration-200 shadow-2xl shadow-foreground/15 overflow-hidden w-full"
          >
            <div
              className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"
              style={{ animationDuration: "1.8s" }}
            />
            <Shield className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-6 duration-300" />
            <span>Access Administrative Board</span>
          </Link>
          <p className="text-[10px] sm:text-xs text-muted-foreground/70 font-medium flex items-center justify-center gap-2">
            <Mail className="w-3.5 h-3.5 text-teal-500" />
            <span>
              Secure credentials required for dashboard authentication
            </span>
          </p>
        </motion.div>

        {/* Interactive Features Bento-Grid with enhanced glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="border-t border-border/60 pt-10 space-y-6"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]"
          >
            OPERATIONAL CAPABILITIES
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: "Live Booking Control",
                desc: "Check-in states, calendar occupancy ratios, and dynamic balance calculations.",
                icon: <CalendarDays className="w-4 h-4 text-teal-400" />,
                gradient: "from-teal-500/10 via-transparent to-transparent",
                borderHover: "hover:border-teal-500/20",
                iconHover:
                  "group-hover:bg-teal-500/10 group-hover:border-teal-500/20",
                textHover: "group-hover:text-teal-400",
              },
              {
                title: "Automated Dispatch",
                desc: "Send high-fidelity PDFs, custom confirmation templates over WhatsApp and SMTP.",
                icon: <Zap className="w-4 h-4 text-emerald-400" />,
                gradient: "from-emerald-500/10 via-transparent to-transparent",
                borderHover: "hover:border-emerald-500/20",
                iconHover:
                  "group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20",
                textHover: "group-hover:text-emerald-400",
              },
              {
                title: "Unified Financials",
                desc: "Quick log expenses, supplementary property sales, and staff payroll slips.",
                icon: <Receipt className="w-4 h-4 text-violet-400" />,
                gradient: "from-violet-500/10 via-transparent to-transparent",
                borderHover: "hover:border-violet-500/20",
                iconHover:
                  "group-hover:bg-violet-500/10 group-hover:border-violet-500/20",
                textHover: "group-hover:text-violet-400",
              },
            ].map((feat) => (
              <motion.div
                key={feat.title}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`relative text-left rounded-2xl border border-border/60 bg-card/20 backdrop-blur-xl p-5 space-y-3 cursor-default ${feat.borderHover} group overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
                />
                <div
                  className={`absolute top-[-40px] left-1/2 -translate-x-1/2 w-[100px] h-[40px] blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
                />
                <div className="relative z-10">
                  <div
                    className={`p-2 rounded-xl bg-muted/30 border border-border/40 w-fit transition-all duration-300 ${feat.iconHover}`}
                  >
                    {feat.icon}
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <h3
                      className={`text-sm font-bold tracking-tight text-foreground transition-colors duration-300 ${feat.textHover}`}
                    >
                      {feat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground/70 font-medium leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
