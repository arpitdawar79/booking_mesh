"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
  shineColor?: string;
}

export function ShineBorder({
  children,
  className = "",
  borderWidth = 1,
  duration = 8,
  shineColor = "#14b8a6",
}: ShineBorderProps) {
  return (
    <motion.div
      className={cn("relative rounded-2xl overflow-hidden", className)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated border container */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          padding: `${borderWidth}px`,
          background: `conic-gradient(from 0deg, transparent 0%, ${shineColor}40 20%, ${shineColor} 40%, transparent 60%, ${shineColor}40 80%, transparent 100%)`,
          backgroundSize: "200% 200%",
          animation: `shine-spin ${duration}s linear infinite`,
        }}
      >
        <div className="w-full h-full rounded-2xl bg-background" />
      </div>
      <div className="relative z-10 m-px rounded-2xl bg-card/80 backdrop-blur-xl">
        {children}
      </div>
    </motion.div>
  );
}
