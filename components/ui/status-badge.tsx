"use client";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-900/30 text-green-300",
  cancelled: "bg-red-900/30 text-red-300",
  completed: "bg-blue-900/30 text-blue-300",
  archived: "bg-gray-900/30 text-gray-300",
  pending: "bg-amber-900/30 text-amber-300",
  partially_paid: "bg-amber-900/30 text-amber-300",
  paid_in_full: "bg-green-900/30 text-green-300",
  refunded: "bg-purple-900/30 text-purple-300",
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
