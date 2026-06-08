import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  change,
  suffix,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change: number | null;
  suffix: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-2xl font-bold ${accent || ""}`}>{value}</div>
      {change !== null && (
        <div className="flex items-center gap-1 text-xs">
          {change > 0 ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 font-medium">
                +{change.toFixed(1)}%
              </span>
            </>
          ) : change < 0 ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-medium">
                {change.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">0%</span>
            </>
          )}
          <span className="text-muted-foreground ml-1">{suffix}</span>
        </div>
      )}
      {change === null && (
        <div className="text-xs text-muted-foreground">{suffix}</div>
      )}
    </div>
  );
}
