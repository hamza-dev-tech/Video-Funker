import { Button } from "@product/components/ui/button";
import { TooltipProvider } from "@product/components/ui/tooltip";
import { Film, Plus } from "lucide-react";
import type { VideoItem } from "@product/lib/video-api";
import { VideoCard } from "@product/components/campaign/VideoCard";

interface VideoLibraryProps {
  videos: VideoItem[];
  campaignName?: string | null;
  syncingId: string | null;
  /** Which video is currently being pulled down, so its button can say so. */
  downloadingId?: string | null;
  onCreateNew: () => void;
  onView: (video: VideoItem) => void;
  onDownload: (video: VideoItem) => void;
  onSync: (video: VideoItem) => void;
  onDelete: (video: VideoItem) => void;
}

export function VideoLibrary({
  videos,
  campaignName,
  syncingId,
  downloadingId,
  onCreateNew,
  onView,
  onDownload,
  onSync,
  onDelete,
}: VideoLibraryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Generated Videos{videos.length > 0 ? ` (${videos.length})` : ""}
          </h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Your video library for this campaign.
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="w-4 h-4" /> Create New Video
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 rounded-xl border border-dashed border-border">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Film className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-[14.5px] font-medium text-foreground">
              No videos generated yet.
            </p>
            <p className="text-[14px] text-muted-foreground">
              Start by creating your first AI video.
            </p>
          </div>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="w-4 h-4" /> Create New Video
          </Button>
        </div>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                campaignName={campaignName}
                syncing={syncingId === video._id}
                onView={onView}
                onDownload={onDownload}
                downloading={downloadingId === video._id}
                onSync={onSync}
                onDelete={onDelete}
              />
            ))}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
