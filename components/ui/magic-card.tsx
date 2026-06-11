"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Backlight } from "@/components/ui/backlight";

export function MagicCard({
  children,
  className,
  glowColor = "var(--glow-color)",
  borderBeam = false,
  backlight = false,
  backlightColorFrom = "from-primary/10",
  backlightColorTo = "to-accent/5",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  borderBeam?: boolean;
  backlight?: boolean;
  backlightColorFrom?: string;
  backlightColorTo?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className={cn(
        "group relative rounded-2xl border border-border/80 dark:border-border/60 bg-card shadow-xs overflow-hidden hover:border-primary/35 transition-colors duration-500",
        className
      )}
    >
      {backlight && (
        <Backlight
          className="-top-10 -left-10 w-32 h-32 opacity-40 group-hover:opacity-75 transition-opacity duration-500"
          colorFrom={backlightColorFrom}
          colorTo={backlightColorTo}
        />
      )}

      {borderBeam && (
        <BorderBeam
          size={160}
          duration={8}
          colorFrom="var(--primary)"
          colorTo="var(--accent)"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      )}

      <motion.div
        className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </motion.div>
  );
}
