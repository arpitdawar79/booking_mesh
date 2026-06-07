"use client";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import { motion } from "framer-motion";
import { Mail, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 overflow-hidden">
      <AnimatedGrid />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Logo / Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-sm text-teal-400">
            <Sparkles className="w-4 h-4" />
            <span>The Stream by Ekantah</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Email Templates &{" "}
            <span className="text-teal-400">Booking Dashboard</span>
          </h1>
          <p className="text-base text-muted-foreground px-2">
            Manage bookings, send beautiful emails, and track revenue — all in
            one place.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-8 py-3.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition shadow-lg shadow-foreground/10 w-full sm:w-auto"
          >
            <Shield className="w-4 h-4" />
            Open Dashboard
          </Link>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Password-protected. You will be redirected to login if not
            authenticated.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-border pt-6"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Supported Emails
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Booking Confirmation",
              "Cancellation",
              "Notification",
              "Thank You",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-default"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
