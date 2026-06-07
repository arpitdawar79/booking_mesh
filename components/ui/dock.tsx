"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const dockVariants = cva(
  "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-3 py-2 shadow-2xl shadow-black/20 lg:hidden"
);

interface DockItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DockProps extends VariantProps<typeof dockVariants> {
  items: DockItem[];
  className?: string;
}

export function Dock({ items, className }: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      className={cn(dockVariants(), className)}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {items.map((item) => (
        <DockIcon
          key={item.href}
          {...item}
          mouseX={mouseX}
        />
      ))}
    </motion.div>
  );
}

function DockIcon({
  href,
  label,
  icon,
  mouseX,
}: DockItem & { mouseX: ReturnType<typeof useMotionValue<number>> }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={href} className="relative group">
      <motion.div
        ref={ref}
        style={{ width }}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-xl transition-colors",
          isActive
            ? "bg-teal-500/10 text-teal-400"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {icon}
        {isActive && (
          <motion.div
            layoutId="dock-active"
            className="absolute inset-0 rounded-xl ring-1 ring-teal-500/50"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </motion.div>
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-lg border border-border pointer-events-none">
        {label}
      </span>
    </Link>
  );
}
