"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MagicCard({
  children,
  className,
  glowColor = "rgba(20,184,166,0.15)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      <div
        className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
