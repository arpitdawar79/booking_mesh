"use client";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/10",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/10",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/10",
  archived: "bg-zinc-100 text-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-500/10",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/10",
  partially_paid: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/10",
  paid_in_full: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/10",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/10",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
