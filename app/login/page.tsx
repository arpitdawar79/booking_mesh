"use client";

import { FlipText } from "@/components/magicui/flip-text";
import { Particles } from "@/components/magicui/particles";
import { ShineBorder } from "@/components/magicui/shine-border";
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
      {/* MagicUI Particle Field */}
      <Particles
        quantity={50}
        staticity={50}
        color="#14b8a6"
        size={1}
        className="z-0"
      />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-500/6 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-violet-500/4 blur-[90px] rounded-full pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-md space-y-7"
      >
        {/* Typographic Header with FlipText */}
        <div className="text-center space-y-4">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-1 shadow-lg shadow-teal-500/5"
          >
            <Lock className="w-7 h-7 animate-pulse" />
          </motion.div>
          <div className="flex justify-center">
            <FlipText
              text="Dashboard Sign In"
              className="text-3xl sm:text-4xl font-black tracking-tight bg-linear-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
              delay={0.05}
              duration={0.5}
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground/70 font-semibold uppercase tracking-[0.15em] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>The Stream by Ekantah</span>
          </motion.p>
        </div>

        {/* Studio-Grade ShineBorder Form Card */}
        <ShineBorder
          className="w-full"
          borderWidth={1}
          duration={10}
          shineColor="#14b8a6"
        >
          <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.15em] pl-1">
                Email Address
              </label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors duration-300 group-focus-within/input:text-teal-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border/60 bg-muted/15 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 transition-all duration-300 placeholder:text-muted-foreground/40"
                  placeholder="admin@ekantah.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.15em] pl-1">
                Secret Password
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors duration-300 group-focus-within/input:text-teal-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border/60 bg-muted/15 pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 transition-all duration-300 placeholder:text-muted-foreground/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/15 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group/btn relative w-full rounded-xl bg-foreground text-background py-3.5 text-sm font-bold hover:opacity-95 active:scale-[0.97] disabled:opacity-50 transition-all duration-200 shadow-xl overflow-hidden flex items-center justify-center gap-2 cursor-pointer"
            >
              <div
                className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:animate-shimmer pointer-events-none"
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
        </ShineBorder>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground/70 font-medium"
        >
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-teal-400 hover:text-teal-300 font-bold transition-colors"
          >
            Sign up
          </a>
        </motion.p>
      </motion.div>
    </main>
  );
}
