import { cn } from "@product/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  variant?: "default" | "primary" | "accent";
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  variant = "default",
}: StatsCardProps) {
  return (
    /*
      A plain surface, not `glass-card`. The glass treatment (blur + a
      translucent fill) is for something floating over content; these sit flat
      on the page in a row of three, where the blur only softened their edges
      and made three identical tiles look slightly out of focus.
    */
    <div className="rounded-[14px] border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            variant === "default" && "bg-secondary text-muted-foreground",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "accent" && "bg-accent/12 text-[#a85800]"
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </div>
        {change && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              change.type === "increase" ? "text-success" : "text-destructive"
            )}
          >
            {change.type === "increase" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change.value}%
          </div>
        )}
      </div>
      <p className="mb-1 text-[13px] font-medium text-muted-foreground">{label}</p>
      {/* tabular-nums so a column of figures does not jitter as values change */}
      <p className="font-display text-[28px] font-bold tabular-nums leading-none tracking-[-0.02em] text-foreground">
        {value}
      </p>
    </div>
  );
}
