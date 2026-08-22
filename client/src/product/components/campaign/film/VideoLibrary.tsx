import { Button } from "@product/components/ui/button";
import { TooltipProvider } from "@product/components/ui/tooltip";
import { Film, Plus } from "lucide-react";
import { PageHeader } from "@product/components/layout/PageHeader";
import { EmptyState } from "@product/components/layout/EmptyState";
import type { VideoItem } from "@product/lib/video-api";
import { VideoCard } from "@product/components/campaign/VideoCard";
import { NextStepBanner } from "@product/components/campaign/NextStepBanner";

interface VideoLibraryProps {
  campaignId: string;
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
  campaignId,
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
      {/*
        The shared header, so this screen sits at the same rhythm as Campaigns,
        Reports and Avatar Studio. It was rolling its own `text-lg` heading —
        smaller than every other page title in the product, which made the Film
        library read as a panel inside something rather than a screen.

        The count moves into the eyebrow: "Generated Videos (2)" put a number in
        parentheses inside the title, and a title is a name, not a readout.
      */}
      <PageHeader
        eyebrow={campaignName || undefined}
        title="Videos"
        description={
          videos.length === 1
            ? "One video filmed for this campaign."
            : `${videos.length} videos filmed for this campaign.`
        }
        actions={
          <Button onClick={onCreateNew} variant="cta" className="gap-2">
            <Plus className="h-4 w-4" /> New video
          </Button>
        }
      />

      <NextStepBanner campaignId={campaignId} />

      {videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title="Nothing filmed yet"
          description="Pick a presenter, pick a voice, and the script for this campaign gets delivered to camera."
          action={
            <Button onClick={onCreateNew} variant="cta" className="gap-2">
              <Plus className="h-4 w-4" /> Film the first one
            </Button>
          }
        />
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
