"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function ModuleCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative rounded-2xl border border-border/80 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm group hover:border-teal-500/25 hover:shadow-lg hover:shadow-teal-500/2"
    >
      <Link href={href} className="block p-5 space-y-3">
        {/* Subtle decorative mesh */}
        <div className="absolute top-[-30px] right-[-30px] w-[100px] h-[100px] bg-teal-500/5 blur-[25px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 group-hover:scale-110 group-hover:border-teal-500/20 transition-all duration-300">
              {icon}
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-teal-400">
              {title}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-muted/20 border border-border/30 opacity-60 group-hover:opacity-100 group-hover:bg-teal-500/10 group-hover:border-teal-500/20 group-hover:translate-x-1 transition-all duration-300">
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-teal-400" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium leading-relaxed">
          {description}
        </p>
      </Link>
    </motion.div>
  );
}
