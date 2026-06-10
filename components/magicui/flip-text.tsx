"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FlipText({
  text,
  className = "",
  delay = 0.1,
  duration = 0.5,
}: FlipTextProps) {
  const letters = text.split("");

  return (
    <motion.span
      className={cn("inline-flex overflow-hidden", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {letters.map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { rotateX: -90, y: "100%", opacity: 0 },
            visible: {
              rotateX: 0,
              y: 0,
              opacity: 1,
            },
          }}
          transition={{
            duration,
            delay: i * delay,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className="inline-block"
          style={{ transformOrigin: "50% 50%" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
