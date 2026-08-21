import { Shimmer } from "@product/components/ui/processing";
import { cn } from "@product/lib/utils";

/**
 * Placeholders in the shape of the thing that is loading.
 *
 * Every list in the product opened with a centred spinner on an otherwise empty
 * page. Two problems with that: the page has no shape until the data lands, so
 * everything jumps into place at once and the eye has to re-find the content;
 * and a spinner in the middle of nothing is indistinguishable from a page that
 * is broken, because it looks the same at second one as it does at second
 * thirty.
 *
 * Placeholders in roughly the right shape fix both. The layout is already
 * correct when the data arrives, so nothing moves, and the outline tells you
 * what is coming — a grid of cards, a list of rows — before it is there.
 */

export function CardGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
      /* The whole block is one announcement rather than N identical ones. */
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[14px] border border-border/70 bg-card">
          <Shimmer className="h-52 w-full" />
          <div className="space-y-2.5 p-4">
            <Shimmer className="h-4 w-3/4 rounded" />
            <Shimmer className="h-3 w-1/2 rounded" />
            <div className="flex gap-2 pt-2">
              <Shimmer className="h-9 w-9 rounded-lg" />
              <Shimmer className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[14px] border border-border/70 bg-card p-5"
        >
          <Shimmer className="h-10 w-10 flex-none rounded-xl" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-1/3 rounded" />
            <Shimmer className="h-3 w-2/3 rounded" />
          </div>
          <Shimmer className="h-8 w-20 flex-none rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default CardGridSkeleton;
