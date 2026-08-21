import { Loader2 } from "lucide-react";
import { cn } from "@product/lib/utils";

/**
 * The shared vocabulary for "this is being worked on".
 *
 * Avatar generation and video rendering both run on HeyGen and take minutes.
 * Until now the app expressed that with a static yellow "Processing" badge over
 * a grey person glyph reading "Avatar Preview Unavailable" — three separate
 * signals that all say *nothing is here*, and none that says *something is
 * happening*. Unavailable is what you write when a thing has failed.
 *
 * These three pieces say the opposite: the surface moves, the badge has a
 * spinner in it, and the elapsed time proves the clock is running.
 */

/* ── Shimmer ─────────────────────────────────────────────────────────────── */

/**
 * A sweeping highlight over a placeholder surface.
 *
 * The movement is the entire point. A still grey rectangle is indistinguishable
 * from a broken image, and people wait far longer, far more calmly, when they
 * can see that something is in progress — a static placeholder gets refreshed
 * or abandoned within seconds.
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden bg-secondary", className)}
      style={{
        backgroundImage:
          "linear-gradient(100deg, transparent 20%, hsl(var(--card) / 0.85) 50%, transparent 80%)",
        backgroundSize: "200% 100%",
        backgroundRepeat: "no-repeat",
        // `shimmer` is defined in tailwind.config.ts and sweeps the gradient
        // from -200% to 200%.
        animation: "shimmer 2.2s linear infinite",
      }}
      aria-hidden="true"
    />
  );
}

/* ── Processing surface ──────────────────────────────────────────────────── */

/**
 * What fills a preview area while its media is still being made.
 *
 * `label` names the work ("Generating your presenter"), `hint` sets the
 * expectation ("Usually ready in 2–5 minutes"). The expectation matters more
 * than the animation: without it, two minutes of waiting is indistinguishable
 * from something having silently failed, and the only recourse a person has is
 * to reload and hope.
 */
export function ProcessingSurface({
  label,
  hint,
  className,
}: {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center", className)}>
      <Shimmer className="absolute inset-0" />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm">
          <Loader2 className="h-[18px] w-[18px] animate-spin text-primary" />
        </span>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {hint && <p className="text-[12px] leading-snug text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

/* ── Live badge ──────────────────────────────────────────────────────────── */

/**
 * A status pill that spins while the status is not final.
 *
 * The badge was already there; what it lacked was any indication that the state
 * it showed was still moving. A spinner inside it is the smallest possible
 * change that turns "this says Processing" into "this is processing right now".
 */
export function LiveBadge({
  label,
  className,
  spinning = true,
}: {
  label: string;
  className?: string;
  spinning?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
        className
      )}
      // Announced to screen readers when it changes, so the completion is not
      // purely visual.
      aria-live="polite"
    >
      {spinning && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
    </span>
  );
}

/* ── Elapsed ─────────────────────────────────────────────────────────────── */

/**
 * "Started 4 min ago" — the answer to "is this stuck?".
 *
 * Rendered from a timestamp the record already carries, so it costs nothing and
 * cannot drift. Anything past `staleAfterMinutes` says so plainly instead of
 * counting up forever, because at that point the honest answer is that
 * something has probably gone wrong and the person should be told.
 */
export function ElapsedSince({
  iso,
  staleAfterMinutes = 20,
  className,
}: {
  iso?: string;
  staleAfterMinutes?: number;
  className?: string;
}) {
  if (!iso) return null;

  const started = new Date(iso).getTime();
  if (Number.isNaN(started)) return null;

  const minutes = Math.max(0, Math.round((Date.now() - started) / 60000));
  const stale = minutes >= staleAfterMinutes;

  const text = stale
    ? "Taking longer than usual"
    : minutes < 1
      ? "Started just now"
      : `Started ${minutes} min ago`;

  return (
    <p className={cn("text-[12px]", stale ? "text-[#a85800]" : "text-muted-foreground", className)}>
      {text}
    </p>
  );
}
