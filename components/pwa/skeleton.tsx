"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("bg-muted/60 rounded-lg", className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-5 w-5 rounded-md" />
        <SkeletonPulse className="h-3 w-12 rounded-md" />
      </div>
      <SkeletonPulse className="h-7 w-24 rounded-md" />
      <SkeletonPulse className="h-3 w-16 rounded-md" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-5 w-5 rounded-md" />
        <SkeletonPulse className="h-3 w-20 rounded-md" />
      </div>
      <SkeletonPulse className="h-7 w-16 rounded-md" />
      <SkeletonPulse className="h-3 w-24 rounded-md" />
    </div>
  );
}

export function SkeletonModuleCard() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <SkeletonPulse className="h-4 w-28 rounded-md" />
          <SkeletonPulse className="h-3 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <SkeletonPulse className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonPulse className="h-3.5 w-32 rounded-md" />
        <SkeletonPulse className="h-3 w-20 rounded-md" />
      </div>
      <SkeletonPulse className="h-4 w-16 rounded-md shrink-0" />
    </div>
  );
}

export function SkeletonHorizontalCard() {
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-card/50 p-3 space-y-2">
      <SkeletonPulse className="h-3 w-20 rounded-md" />
      <SkeletonPulse className="h-4 w-28 rounded-md" />
      <SkeletonPulse className="h-3 w-24 rounded-md" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48 rounded-md" />
        <SkeletonPulse className="h-4 w-72 rounded-md" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <SkeletonPulse className="h-4 w-32 rounded-md" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonHorizontalCard key={i} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SkeletonPulse className="h-4 w-20 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonModuleCard key={i} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <SkeletonPulse className="h-4 w-24 rounded-md" />
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-pulse">
      {children || (
        <>
          <SkeletonPulse className="h-8 w-40 rounded-md" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
