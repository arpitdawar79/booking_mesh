"use client";

import { cn } from "@/lib/utils";
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
        "bg-background/90 backdrop-blur-xl border-t border-border",
        "lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
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
        "flex flex-col items-center justify-center gap-0.5",
        "min-w-14 h-full px-1 rounded-lg",
        "select-none",
        "transition-colors duration-150",
        "active:opacity-70",
        isActive ? "text-teal-400" : "text-muted-foreground",
      )}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="relative flex items-center justify-center w-6 h-6">
        {icon}
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-400" />
        )}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}
