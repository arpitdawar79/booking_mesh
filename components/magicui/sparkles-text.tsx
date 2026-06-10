"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SparklesTextProps {
  text: string;
  className?: string;
  sparklesCount?: number;
  colors?: { first: string; second: string };
}

function Sparkle({
  color,
  size,
  delay,
  style,
}: {
  color: string;
  size: number;
  delay: number;
  style: React.CSSProperties;
}) {
  return (
    <motion.svg
      className="absolute"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2 + 1,
        ease: "easeInOut",
      }}
    >
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill={color}
      />
    </motion.svg>
  );
}

export function SparklesText({
  text,
  className = "",
  sparklesCount = 6,
  colors = { first: "#14b8a6", second: "#4ade80" },
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<
    { id: number; x: string; y: string; color: string; size: number; delay: number }[]
  >([]);

  useEffect(() => {
    const s = Array.from({ length: sparklesCount }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      color: i % 2 === 0 ? colors.first : colors.second,
      size: Math.random() * 10 + 8,
      delay: Math.random() * 2,
    }));
    setSparkles(s);
  }, [sparklesCount, colors.first, colors.second]);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((s) => (
        <Sparkle
          key={s.id}
          color={s.color}
          size={s.size}
          delay={s.delay}
          style={{ left: s.x, top: s.y }}
        />
      ))}
      <span className="relative z-10">{text}</span>
    </span>
  );
}
