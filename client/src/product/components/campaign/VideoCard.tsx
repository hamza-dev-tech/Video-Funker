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

const statusConfig: Record<VideoStatus, { label: string; className: string }> =
  {
    thinking: {
      label: "Queued",
      className: "bg-muted text-muted-foreground border-transparent",
    },
    generating: {
      label: "Filming",
      className: "border-transparent bg-primary/10 text-primary",
    },
    completed: {
      label: "Ready",
      className: "border-transparent bg-success/12 text-success",
    },
    failed: {
      label: "Failed",
      className: "border-transparent bg-destructive/12 text-destructive",
    },
  };

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
    <div className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-[320px] transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative  bg-[#f8fafc] h-64">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title || video.fileName || "Video thumbnail"}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : inFlight ? (
          /*
            A render in progress is not a missing preview.

            The largest element on the card used to read "Preview unavailable"
            while the badge in the corner said the video was still generating —
            the biggest thing on screen contradicting the small one, and saying
            the more alarming of the two.
          */
          <ProcessingSurface
            label="Rendering your video"
            hint="A few minutes. You can leave this page."
          />
        ) : video.status === "failed" ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
            <Video className="w-9 h-9" />
            <span className="text-[12.5px] leading-relaxed">
              {video.failureReason || "This render failed."}
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Video className="w-9 h-9" />
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          {hasUrl && (
            <IconAction label="View" onClick={() => onView(video)} disabled={busy}>
              <Eye className="w-4 h-4" />
            </IconAction>
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
