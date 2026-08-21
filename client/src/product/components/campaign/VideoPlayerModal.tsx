import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@product/components/ui/dialog";
import { Button } from "@product/components/ui/button";
import { Badge } from "@product/components/ui/badge";
import { useEffect, useState } from "react";
import { Download, X, Clock, ChevronDown, Mic, User } from "lucide-react";
import { cn } from "@product/lib/utils";
import type { VideoItem } from "@product/lib/video-api";

interface VideoPlayerModalProps {
  video: VideoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (video: VideoItem) => void;
}

export function VideoPlayerModal({
  video,
  open,
  onOpenChange,
  onDownload,
}: VideoPlayerModalProps) {
  const [scriptOpen, setScriptOpen] = useState(false);

  // A different video should not inherit the last one's expanded script.
  useEffect(() => {
    setScriptOpen(false);
  }, [video?._id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {video?.title || video?.fileName || "Video Preview"}
          </DialogTitle>
        </DialogHeader>

        {video?.videoUrl ? (
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="aspect-video w-full rounded-xl bg-black"
          />
        ) : (
          <p className="py-8 text-center text-[14.5px] text-muted-foreground">
            Video URL is not available.
          </p>
        )}

        {/*
          What is actually in this video.

          The modal showed title, duration and status — three facts about the
          record, none about the content. The script, the presenter and the
          voice were all being fetched and rendered nowhere, so with several
          variants in the library there was no way to tell two apart without
          watching both of them end to end.
        */}
        {(video?.voiceName || video?.avatarType || video?.script) && (
          <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/40 p-4">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
              {video?.avatarType && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {video.avatarType === "custom" ? "Your presenter" : "HeyGen presenter"}
                </span>
              )}
              {video?.voiceName && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mic className="h-3.5 w-3.5" />
                  {video.voiceName}
                </span>
              )}
            </div>

            {video?.script && (
              <div>
                <button
                  type="button"
                  onClick={() => setScriptOpen((v) => !v)}
                  className="flex items-center gap-1 text-[12.5px] font-semibold text-primary"
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", scriptOpen && "rotate-180")}
                  />
                  {scriptOpen ? "Hide the script" : "Read the script"}
                </button>
                {scriptOpen && (
                  <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3 text-[13px] leading-relaxed text-foreground">
                    {video.script}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-[14px] text-muted-foreground">
            {video?.duration ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {video.duration.toFixed(0)} sec
              </span>
            ) : null}
            {video?.status && (
              <Badge variant="secondary" className="capitalize">
                {video.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {video?.videoUrl && onDownload && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => onDownload(video)}
              >
                <Download className="w-4 h-4" /> Download
              </Button>
            )}
            <Button
              variant="default"
              className="gap-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
