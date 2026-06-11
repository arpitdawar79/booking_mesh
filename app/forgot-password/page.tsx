"use client";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth?action=forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
    } else {
      setError(data.error || "Failed to send reset email");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-16 overflow-hidden">
        <AnimatedGrid />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="relative z-10 w-full max-w-md text-center space-y-6"
        >
          {/* Glass Card for success */}
          <div className="relative rounded-3xl border border-border/80 bg-card/30 backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed mt-2 mb-6">
              If an account exists for{" "}
              <span className="text-teal-400 font-semibold">{email}</span>,
              we&apos;ve dispatched recovery instructions.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login screen</span>
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-16 overflow-hidden">
      {/* Premium Ambient Grid and Blur Aura */}
      <AnimatedGrid />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2 shadow-sm"
          >
            <Mail className="w-6 h-6 animate-pulse" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-b from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Identity Verification</span>
          </p>
        </div>

        {/* Studio-Grade Glassmorphic Form Card */}
        <div className="relative rounded-3xl border border-border/80 bg-card/30 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden group hover:border-teal-500/20 transition-all duration-500">
          <div className="absolute -inset-px bg-linear-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground/90 uppercase tracking-widest pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors group-focus-within:text-teal-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input/60 bg-muted/20 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition"
                  placeholder="admin@ekantah.com"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/15 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full rounded-xl bg-foreground text-background py-3 text-sm font-bold hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition shadow-lg overflow-hidden flex items-center justify-center gap-2 cursor-pointer"
            >
              <div
                className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"
                style={{ animationDuration: "1.5s" }}
              />
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending dispatch link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to sign in</span>
        </Link>
      </motion.div>
    </main>
  );
}
