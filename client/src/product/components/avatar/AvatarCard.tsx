import { Badge } from "@product/components/ui/badge";
import { Button } from "@product/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@product/components/ui/tooltip";
import { Loader2, Trash2, Eye, RefreshCw, User, AlertTriangle } from "lucide-react";
import { ProcessingSurface, LiveBadge, ElapsedSince } from "@product/components/ui/processing";
import type { CustomAvatar } from "@product/lib/heygen-api";
import { cn } from "@product/lib/utils";

export const sourceConfig: Record<string, { label: string }> = {
  prompt: { label: "✨ Prompt Generated" },
  image_upload: { label: "📷 Image Upload" },
};

export const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "border-transparent bg-success/12 text-success",
  },
  processing: {
    label: "Generating",
    className: "border-transparent bg-warning/15 text-[#a85800]",
  },
  pending: {
    label: "Queued",
    className: "border-transparent bg-warning/15 text-[#a85800]",
  },
  generating: {
    label: "Generating",
    className: "border-transparent bg-primary/10 text-primary",
  },
  failed: {
    label: "Failed",
    className: "border-transparent bg-destructive/12 text-destructive",
  },
};

export function getStatusMeta(status?: string) {
  return (
    statusConfig[status || ""] || {
      label: status || "Unknown",
      className: "bg-muted text-muted-foreground border-transparent",
    }
  );
}

export function getSourceLabel(source: string) {
  return sourceConfig[source]?.label || source;
}

export function formatCreatedDate(dateString?: string) {
  if (!dateString) return "";
  // No "Created" prefix: every caller sits under its own label, and the one
  // that did not was rendering "Created / Created Aug 20, 2026".
  return `${new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

interface AvatarCardProps {
  avatar: CustomAvatar;
  syncing?: boolean;
  onView: (avatar: CustomAvatar) => void;
  onSync: (avatar: CustomAvatar) => void;
  onDelete: (avatar: CustomAvatar) => void;
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

export function AvatarCard({
  avatar,
  syncing,
  onView,
  onSync,
  onDelete,
}: AvatarCardProps) {
  const status = getStatusMeta(avatar.status);
  const working = ["pending", "processing", "generating", "training"].includes(avatar.status || "");
  const failed = avatar.status === "failed";
  /*
    Sync is offered only on a failed avatar now. While one is generating the
    list polls on its own, so a manual refresh button beside a live spinner
    reads as "the automatic thing might not be working, press this" — which is
    exactly the doubt the polling was added to remove.
  */
  const showSync = failed;

  return (
    <div className="group max-h-96 rounded-[14px] border border-border/70 bg-card overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      {/* Preview */}
      <div className="relative h-52 shrink-0 overflow-hidden bg-muted">
        {avatar.avatarImage ? (
          <img
            src={avatar.avatarImage}
            alt={avatar.name}
            loading="lazy"
            className="h-full w-full object-cover object-center"
          />
        ) : working ? (
          /*
            Was: a static person glyph reading "Avatar Preview Unavailable".
            "Unavailable" is what you say about something that failed — the
            person was watching a working render and being told it was broken.
          */
          <ProcessingSurface
            label="Generating your presenter"
            hint="Usually ready in 2-5 minutes. You can leave this page."
          />
        ) : failed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.7} />
            <p className="text-[13px] font-semibold text-foreground">Generation failed</p>
            <p className="text-[12px] leading-snug text-muted-foreground">
              Try again with a clearer photo or a more specific prompt.
            </p>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <User className="h-9 w-9" strokeWidth={1.5} />
            <span className="px-2 text-center text-xs">No preview yet</span>
          </div>
        )}
        <LiveBadge
          label={status.label}
          spinning={working}
          className={cn("absolute right-2.5 top-2.5 shadow-sm backdrop-blur", status.className)}
        />
        <button
          type="button"
          onClick={() => onView(avatar)}
          className="absolute inset-0 flex items-center justify-center bg-foreground/0 hover:bg-foreground/20 transition-colors"
        >
          <span className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-5 h-5 text-foreground" />
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <p
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
          title={avatar.name}
        >
          {avatar.name}
        </p>
        {working && <ElapsedSince iso={avatar.createdAt} />}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 mt-auto">
          <IconAction label="View" onClick={() => onView(avatar)}>
            <Eye className="w-4 h-4" />
          </IconAction>
          {showSync && (
            <IconAction
              label="Sync"
              onClick={() => onSync(avatar)}
              disabled={syncing}
            >
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
              onClick={() => onDelete(avatar)}
              destructive
            >
              <Trash2 className="w-4 h-4" />
            </IconAction>
          </div>
        </div>
      </div>
    </div>
  );
}
