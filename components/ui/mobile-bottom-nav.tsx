"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileBottomNavProps {
  items: NavItem[];
  onItemClick?: () => void;
  className?: string;
}

export function MobileBottomNav({
  items,
  onItemClick,
  className,
}: MobileBottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-2xl border-t border-border/50",
        "lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        "shadow-2xl shadow-black/40",
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-4">
        {items.map((item) => (
          <NavButton key={item.href} {...item} onClick={onItemClick} />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  href,
  label,
  icon,
  onClick,
}: NavItem & { onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "min-w-14 h-14 px-1 rounded-xl",
        "select-none",
        "transition-colors duration-200",
        isActive
          ? "text-teal-400"
          : "text-muted-foreground hover:text-foreground",
      )}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Morphed Background Active Pill */}
      {isActive && (
        <motion.div
          layoutId="activeBottomNavTab"
          className="absolute inset-x-1.5 inset-y-1 rounded-2xl bg-teal-500/10 border border-teal-500/15 -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Active Tab Glow Dome */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-teal-400 blur-sm rounded-full" />
      )}

      <motion.span
        animate={isActive ? { scale: 1.15 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative flex items-center justify-center w-6 h-6"
      >
        {icon}
      </motion.span>

      <span className="text-[9px] font-bold tracking-tight uppercase leading-none">
        {label}
      </span>
    </Link>
  );
}
