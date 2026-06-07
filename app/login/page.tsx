"use client";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import { motion } from "framer-motion";
import { Fingerprint, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [redirect, setRedirect] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirect(params.get("redirect") || "/dashboard");
  }, []);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(redirect);
    } else {
      setError("Invalid password.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      <AnimatedGrid />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Login</h1>
          <p className="text-sm text-muted-foreground">The Stream by Ekantah</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-red-400 bg-red-500/5 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
