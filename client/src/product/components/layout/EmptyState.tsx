import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@product/lib/utils";

/**
 * What a screen shows before there is anything on it.
 *
 * The version this replaces was a grey icon floating in the middle of an
 * otherwise blank page: no edge, no ground, and the same distance from the
 * header whether the viewport was 700px tall or 1400px. It read as a page that
 * had failed to load rather than one waiting to be used.
 *
 * This gives it a surface to sit on and a bordered frame, so the space has a
 * shape. The icon sits in a tinted tile rather than floating, the heading names
 * what is missing, and the action is the same orange as everywhere else the
 * product asks for a decision.
 *
 * `variant="search"` is the other case — a list that exists but matched
 * nothing. It never offers the create action, because the answer to "no results
 * for xyz" is to change the search, not to make a new thing.
 *
 * `variant="error"` exists because the product had no way to say "we could not
 * load this". Every failed fetch fell through to the empty state, so an API
 * blip told people their campaigns, their ICP and their generated content were
 * all gone — the most alarming possible message, delivered for a transient
 * network error, with a "create your first one" button underneath inviting them
 * to rebuild work that was never lost.
 */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: "empty" | "search" | "error";
}

export function EmptyState({ icon: Icon, title, description, action, variant = "empty" }: EmptyStateProps) {
  const tint =
    variant === "error"
      ? "bg-destructive/10 text-destructive"
      : variant === "search"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center"
      /* A generous but bounded height. Centring inside 100% of a tall viewport
         drops the content below the fold on a laptop; this keeps it in view. */
      style={{ minHeight: 340 }}
    >
      <span className={cn("mb-5 flex h-14 w-14 items-center justify-center rounded-2xl", tint)}>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>

      <h3 className="font-display text-[19px] font-bold tracking-[-0.01em] text-foreground">{title}</h3>
      <p className="mt-2 max-w-[38ch] text-[14.5px] leading-relaxed text-muted-foreground">{description}</p>

      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export default EmptyState;
