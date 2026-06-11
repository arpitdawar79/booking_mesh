"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
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
        "lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Mobile navigation"
    >
      {/* Floating dock-style container */}
      <div className="mx-3 mb-3">
        <div className="flex items-center justify-around h-15 px-2 rounded-3xl bg-background/70 backdrop-blur-3xl border border-border/40 shadow-[0_8px_40px_-4px_rgba(0,0,0,0.5)]">
          {items.map((item) => (
            <NavButton
              key={item.href ?? item.label}
              {...item}
              onClick={() => {
                item.onClick?.();
                onItemClick?.();
              }}
            />
          ))}
        </div>
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
  const isActive =
    !!href && (pathname === href || pathname.startsWith(href + "/"));

  const sharedClassName = cn(
    "relative flex flex-col items-center justify-center gap-1",
    "min-w-14 h-14 px-1 rounded-xl",
    "select-none",
    "transition-colors duration-200",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );

  const sharedStyle = {
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation" as const,
  };

  const inner = (
    <>
      {isActive && (
        <motion.div
          layoutId="activeBottomNavTab"
          className="absolute inset-x-1.5 inset-y-1 rounded-2xl bg-primary/10 border border-primary/15 -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/40 blur-sm rounded-full" />
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
    </>
  );

  if (!href) {
    return (
      <button
        onClick={onClick}
        className={sharedClassName}
        style={sharedStyle}
        type="button"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={sharedClassName}
      style={sharedStyle}
      aria-current={isActive ? "page" : undefined}
    >
      {inner}
    </Link>
  );
}
