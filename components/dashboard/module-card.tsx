"use client";

import { MagicCard } from "@/components/ui/magic-card";
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
    <MagicCard className="hover:border-primary/30">
      <Link href={href} className="block p-3.5 space-y-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon}
            <span className="text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary duration-300 truncate">
              {title}
            </span>
          </div>
          <div className="p-1 rounded-md bg-secondary border border-border opacity-70 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:translate-x-0.5 transition-all duration-300 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70 font-medium leading-normal line-clamp-2">
          {description}
        </p>
      </Link>
    </MagicCard>
  );
}
