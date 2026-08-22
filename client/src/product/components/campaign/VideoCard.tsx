import { Badge } from "@product/components/ui/badge";
import { Button } from "@product/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@product/components/ui/tooltip";
import {
  Loader2,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Video,
  Clock,
} from "lucide-react";
import type { VideoItem, VideoStatus } from "@product/lib/video-api";
import { cn } from "@product/lib/utils";
import { LiveBadge, ElapsedSince, ProcessingSurface } from "@product/components/ui/processing";

interface VideoCardProps {
  video: VideoItem;
  campaignName?: string | null;
  syncing?: boolean;
  downloading?: boolean;
  deleting?: boolean;
  onView: (video: VideoItem) => void;
  onDownload: (video: VideoItem) => void;
  onSync: (video: VideoItem) => void;
  onDelete: (video: VideoItem) => void;
}

/*
  These badges sit ON TOP of the thumbnail, not on the card surface.

  They were using the tint scale — `bg-success/12 text-success` — which is
  designed for a light card ground. Over a photograph that is twelve percent
  green behind green text, so "Ready" was effectively invisible against a dark
  image. Anything overlaying media needs an opaque ground of its own.
*/
const statusConfig: Record<VideoStatus, { label: string; className: string }> =
  {
    thinking: {
      label: "Queued",
      className: "border-transparent bg-foreground/80 text-background backdrop-blur-sm",
    },
    generating: {
      label: "Rendering",
      className: "border-transparent bg-primary text-primary-foreground",
    },
    completed: {
      label: "Ready",
      className: "border-transparent bg-emerald-600 text-white",
    },
    failed: {
      label: "Failed",
      className: "border-transparent bg-destructive text-destructive-foreground",
    },
  };

/**
 * What to say while a render is running.
 *
 * The previous copy escalated to "HeyGen is busy", which is an excuse rather
 * than information: it names a supplier the customer has no relationship with,
 * and it says nothing about when the video will arrive. Someone three minutes
 * into a normal render was being told their vendor had a problem.
 *
 * A render takes roughly 2.3 seconds per second of finished video — measured
 * across real renders in this account, where a 126-second video took 4.4
 * minutes and a 106-second one took 4.8. The script is on the record, so the
 * length can be estimated from it and the wait given a number instead of an
 * apology.
 *
 * Speaking pace is taken as 150 words per minute, which is the standard for a
 * measured piece to camera rather than conversation.
 */
const WORDS_PER_MINUTE = 150;
const RENDER_SECONDS_PER_VIDEO_SECOND = 2.3;

function estimateMinutes(script?: string): number | null {
  const words = script ? script.trim().split(/\s+/).filter(Boolean).length : 0;
  if (!words) return null;
  const spokenSeconds = (words / WORDS_PER_MINUTE) * 60;
  return Math.max(1, Math.round((spokenSeconds * RENDER_SECONDS_PER_VIDEO_SECOND) / 60));
}

function waitCopy(
  createdAt: string,
  _upstream?: string | null,
  script?: string
): { label: string; hint: string } {
  const elapsed = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 60000);
  const expected = estimateMinutes(script);

  // Past what we predicted. Say so plainly and say what to do — which is
  // nothing, because it finishes whether or not anyone is watching.
  if (expected && elapsed > expected + 3) {
    return {
      label: "Taking longer than expected",
      hint: "It will appear here the moment it is ready. Nothing is lost if you close this.",
    };
  }

  if (expected) {
    const left = Math.max(1, Math.ceil(expected - elapsed));
    return {
      label: "Rendering your video",
      hint: `About ${left} minute${left === 1 ? "" : "s"} to go. You can close this page.`,
    };
  }

  // No script on the record, so no estimate to give. Say the usual range
  // rather than inventing a number.
  return {
    label: "Rendering your video",
    hint:
      elapsed > 8
        ? "It will appear here the moment it is ready. Nothing is lost if you close this."
        : "Usually three to five minutes. You can close this page.",
  };
}

function relativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
  destructive,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9",
            destructive &&
              "text-destructive hover:text-destructive hover:border-destructive/40",
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function VideoCard({
  video,
  campaignName,
  syncing,
  downloading,
  deleting,
  onView,
  onDownload,
  onSync,
  onDelete,
}: VideoCardProps) {
  const status = statusConfig[video.status] || statusConfig.thinking;
  const inFlight = video.status === "thinking" || video.status === "generating";
  /*
    Sync stays available on a completed video that has no link.

    Hiding it there produced a dead card: a green Ready badge, no View, no
    Download, and no way to recover a render the customer had already paid for
    — the only remaining action was Delete.
  */
  const showSync = video.status !== "completed" || !video.videoUrl;
  const hasUrl = !!video.videoUrl;
  const busy = syncing || deleting;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200 hover:border-border hover:shadow-[0_10px_28px_-18px_rgba(12,43,74,.45)]">
      {/*
        A fixed 16:10 frame, and the thumbnail is contained rather than cropped.

        `object-cover` in a landscape box was fine while every render was 16:9.
        Now that a video follows its presenter's shape, a portrait render was
        being centre-cropped to a letterbox — cutting the top of the head off
        the very frame meant to represent it. Contain on a dark ground shows the
        whole frame and makes the shape itself legible at a glance, which is
        useful information when a library holds both.
      */}
      <div className="relative aspect-[16/10] bg-[#0d1b2a]">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title || video.fileName || "Video thumbnail"}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : inFlight ? (
          /*
            A render in progress is not a missing preview.

            The largest element on the card used to read "Preview unavailable"
            while the badge in the corner said the video was still generating —
            the biggest thing on screen contradicting the small one, and saying
            the more alarming of the two.
          */
          <ProcessingSurface {...waitCopy(video.createdAt, video.upstreamStatus, video.script)} />
        ) : video.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-white/70">
            <Video className="h-8 w-8" strokeWidth={1.6} />
            <span className="text-[12.5px] leading-relaxed">
              {video.failureReason || "This render failed."}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/55">
            <Video className="h-8 w-8" strokeWidth={1.6} />
            <span className="text-[12.5px]">Preview unavailable</span>
          </div>
        )}
        {/* Spins while the render is live, so the badge shows a state that is
            still moving rather than a label that might be minutes stale. */}
        <LiveBadge
          label={status.label}
          spinning={inFlight}
          className={cn("absolute right-2.5 top-2.5 shadow-sm backdrop-blur", status.className)}
        />
        {hasUrl && (
          <button
            type="button"
            onClick={() => onView(video)}
            className="absolute inset-0 flex items-center justify-center bg-foreground/0 hover:bg-foreground/20 transition-colors"
          >
            <span className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-5 h-5 text-foreground" />
            </span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p
          className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-foreground"
          title={video.title || campaignName || "Video"}
        >
          {video.title || campaignName || "Video"}
        </p>

        <div className="flex items-center gap-4 text-[12.5px] text-muted-foreground">
          {video.duration ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.duration.toFixed(0)} sec
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            {inFlight ? (
              <ElapsedSince iso={video.createdAt} className="text-[12px]" />
            ) : (
              <>Created {relativeTime(video.createdAt)}</>
            )}
          </span>
        </div>

        {/*
          Watching is the point of this card, so it gets a labelled button.

          Every action was an unlabelled icon square with a tooltip — four
          identical grey tiles in a row, and the one you almost always want
          indistinguishable from Delete except by shape. The rest stay as icons
          because they are occasional; the primary one earns its words.
        */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          {hasUrl && (
            <Button
              size="sm"
              onClick={() => onView(video)}
              disabled={busy}
              className="h-9 gap-1.5 px-3 text-[13px]"
            >
              <Eye className="h-4 w-4" /> Watch
            </Button>
          )}
          {hasUrl && (
            <IconAction
              label={downloading ? "Preparing the file" : "Download"}
              onClick={() => onDownload(video)}
              /* Disabled while it runs: the whole file is pulled into memory
                 before the save dialog appears, and a second click started a
                 second download of the same video. */
              disabled={busy || downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </IconAction>
          )}
          {showSync && (
            <IconAction label="Sync" onClick={() => onSync(video)} disabled={busy}>
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </IconAction>
          )}
          <div className="ml-auto">
            <IconAction
              label="Delete"
              onClick={() => onDelete(video)}
              disabled={busy}
              destructive
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </IconAction>
          </div>
        </div>
      </div>
    </div>
  );
}
