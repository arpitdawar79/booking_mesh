"use client";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [redirect, setRedirect] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirect(params.get("redirect") || "/dashboard");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push(redirect);
    } else {
      setError(data.error || "Login failed");
      setLoading(false);
    }
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
        {/* Typographic Header */}
        <div className="text-center space-y-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2 shadow-sm"
          >
            <Lock className="w-6 h-6 animate-pulse" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Dashboard Sign In
          </h1>
          <p className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>The Stream by Ekantah</span>
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground/90 uppercase tracking-widest pl-1">
                Secret Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input/60 bg-muted/20 pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pl-1">
              <a
                href="/forgot-password"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
              >
                Forgot password?
              </a>
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
                  <span>Verifying secret key...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/80 font-medium">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-teal-400 hover:text-teal-300 font-bold transition-colors"
          >
            Sign up
          </a>
        </p>
      </motion.div>
    </main>
  );
}
