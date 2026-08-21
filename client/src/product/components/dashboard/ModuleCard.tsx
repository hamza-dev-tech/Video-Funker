import { cn } from "@product/lib/utils";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  status: "active" | "pending" | "inactive";
  stats?: {
    label: string;
    value: string | number;
  };
  delay?: number;
}

export function ModuleCard({
  icon: Icon,
  title,
  description,
  href,
  status,
  stats,
  delay = 0,
}: ModuleCardProps) {
  return (
    <Link
      to={href}
      /*
        `module-card` carried a hover scale of 1.02. On a grid of six, moving the
        pointer across them made the whole grid ripple, and a card that grows
        under the cursor also nudges its neighbours' hit areas. A border and a
        shadow say "interactive" without moving the layout.
      */
      className="group block rounded-[14px] border border-border/70 bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_rgba(12,43,74,.2)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200",
            status === "active" && "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
            status === "pending" && "bg-warning/15 text-[#a85800]",
            status === "inactive" && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
            status === "active" && "bg-success/12 text-success",
            status === "pending" && "bg-warning/15 text-[#a85800]",
            status === "inactive" && "bg-muted text-muted-foreground"
          )}
        >
          {status === "active" ? "Active" : status === "pending" ? "In Progress" : "Not Started"}
        </span>
      </div>

      <h3 className="mb-1.5 font-display text-[16px] font-bold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="mb-4 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">{description}</p>

      {stats && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-[12.5px] text-muted-foreground">{stats.label}</span>
          <span className="text-[14.5px] font-semibold text-foreground">{stats.value}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[14.5px] font-medium">Open Module</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
