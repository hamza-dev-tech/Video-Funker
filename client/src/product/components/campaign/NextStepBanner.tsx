import { Link } from "react-router-dom";
import { ArrowRight, Target, FileText, Film, BarChart3, Check } from "lucide-react";
import { cn } from "@product/lib/utils";
import { useCampaignProgress } from "@product/hooks/useCampaignProgress";

/**
 * A persistent strip showing where this campaign is and what comes next.
 *
 * Three earlier attempts, and what each got wrong:
 *
 * A large card keyed to the page you were standing on — right the first time
 * through, and wrong forever after, because it told a finished campaign to go
 * and write content it had already written.
 *
 * Ticks in the sidebar — quiet, but inert. They reported state and did nothing
 * with it, in the part of the screen nobody looks at when they are stuck.
 *
 * A bar that dismissed itself once followed — which sounds tidy and means the
 * guidance is gone precisely when someone returns weeks later having forgotten
 * the order entirely.
 *
 * So: always visible, and driven only by what is actually finished. The step it
 * points at changes as the campaign progresses, and the ticks behind it show
 * how far along you are. Nothing is remembered, because there is nothing to
 * remember — the true answer is recomputed every time.
 */

type StepId = "icp" | "content" | "film";

interface Stage {
  id: StepId;
  label: string;
  to: string;
  icon: typeof Target;
  title: string;
  body: string;
  action: string;
}

const STAGES: Stage[] = [
  {
    id: "icp",
    label: "ICP",
    to: "/icp",
    icon: Target,
    title: "Define who you're selling to",
    body: "Everything after this is written for that person.",
    action: "Build the ICP",
  },
  {
    id: "content",
    label: "Content",
    to: "/content",
    icon: FileText,
    title: "Write the campaign",
    body: "Turns your ICP into research, an article, a video script and outreach.",
    action: "Write it",
  },
  {
    id: "film",
    label: "Video",
    to: "/film",
    icon: Film,
    title: "Film the video",
    body: "Pick a presenter and a voice, and they deliver your script to camera.",
    action: "Film it",
  },
];

/** Where a finished campaign points. Still an action, not a trophy. */
const FINISHED = {
  to: "/reports",
  icon: BarChart3,
  title: "This campaign is complete",
  body: "Every asset, its length, and the argument behind it.",
  action: "Open the report",
};

interface NextStepBannerProps {
  campaignId?: string;
  className?: string;
}

export function NextStepBanner({ campaignId, className }: NextStepBannerProps) {
  const progress = useCampaignProgress(campaignId);

  // Nothing on a guess. Rendering before the state arrives is what produced a
  // prompt to write content on a campaign that already had a video.
  if (!campaignId || progress.loading) return null;

  const done: Record<StepId, boolean> = {
    icp: progress.hasIcp,
    content: progress.hasContent,
    film: progress.hasVideo,
  };

  const pending = STAGES.find((s) => !done[s.id]);
  const stage = pending ?? FINISHED;
  const Icon = stage.icon;

  return (
    <div
      className={cn(
        /*
          A rule and a wash rather than a filled card. This sits above content
          someone came to read; it should read as a note attached to the page,
          not as a second subject competing with it.
        */
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border/70 border-l-[3px] border-l-primary bg-primary/[0.035] py-3 pl-4 pr-3",
        className
      )}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold leading-snug text-foreground">
          {stage.title}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{stage.body}</p>
      </div>

      {/*
        The three stages, inline. Answers "how far am I" in the same glance as
        "what next", without a second component or a trip to another screen.
      */}
      <ol className="flex flex-none items-center gap-1.5" aria-label="Campaign progress">
        {STAGES.map((s) => {
          const isDone = done[s.id];
          const isNext = pending?.id === s.id;
          return (
            <li
              key={s.id}
              title={isDone ? `${s.label} — done` : isNext ? `${s.label} — next` : s.label}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium",
                isDone && "text-emerald-700 dark:text-emerald-400",
                isNext && "bg-primary text-primary-foreground",
                !isDone && !isNext && "text-muted-foreground/70"
              )}
            >
              {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
              {s.label}
            </li>
          );
        })}
      </ol>

      <Link
        to={stage.to}
        className="flex flex-none items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {stage.action}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default NextStepBanner;
