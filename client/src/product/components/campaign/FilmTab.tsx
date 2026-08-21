import { useState, useEffect, useMemo } from "react";
import { Loader2, AlertTriangle, FileText } from "lucide-react";
import { ScrollArea } from "@product/components/ui/scroll-area";
import { fetchContent, ContentData } from "@product/lib/content-api";
import { fetchHeygenAvatars, HeygenAvatar } from "@product/lib/heygen-api";

const PAGE_SIZE = 20;
const VOICE_PAGE_SIZE = 10;
import {
  generateVideo,
  fetchVideos,
  deleteVideo,
  getVideoDownloadUrl,
  VideoItem,
  syncVideoById,
} from "@product/lib/video-api";
import {
  fetchVoicesPage,
  type HeygenVoice,
} from "@product/services/heygenVoiceService";
import {
  listVoiceClones,
  syncVoiceClone,
  deleteVoiceClone,
  type VoiceClone,
} from "@product/lib/voice-clone-api";
import { CreateVoiceCloneModal } from "@product/components/campaign/CreateVoiceCloneModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@product/components/ui/alert-dialog";
import { getToken } from "@product/lib/api-client";
import { useToast } from "@product/hooks/use-toast";
import { useCampaignUsage } from "@product/hooks/useSubscription";
import { useVerification } from "@product/context/VerificationProvider";
import { useCampaignStore } from "@product/store/campaignStore";
import { DeleteVideoModal } from "@product/components/campaign/DeleteVideoModal";
import { VideoPlayerModal } from "@product/components/campaign/VideoPlayerModal";
import { VideoLibrary } from "@product/components/campaign/film/VideoLibrary";
import { CreateVideoWizard } from "@product/components/campaign/film/CreateVideoWizard";
import { StepAvatar } from "@product/components/campaign/film/StepAvatar";
import { StepVoice } from "@product/components/campaign/film/StepVoice";
import { StepScript } from "@product/components/campaign/film/StepScript";
import { StepReview } from "@product/components/campaign/film/StepReview";
import type { StepperStep } from "@product/components/campaign/film/Stepper";
import { EmptyState } from "@product/components/layout/EmptyState";
import { Link } from "react-router-dom";
import { Button } from "@product/components/ui/button";
import { usePollWhile } from "@product/hooks/usePollWhile";

interface FilmTabProps {
  campaignId: string;
}

const WIZARD_STEPS: StepperStep[] = [
  { label: "Avatar" },
  { label: "Voice" },
  { label: "Script" },
  { label: "Review & Generate" },
];

export function FilmTab({ campaignId }: FilmTabProps) {
  const { toast } = useToast();
  const { requireVerifiedEmail } = useVerification();
  const { usage: campaignUsage, refetch: refetchUsage } =
    useCampaignUsage(campaignId);

  // View mode
  const [mode, setMode] = useState<"library" | "create">("library");
  const [step, setStep] = useState(0);

  const [content, setContent] = useState<ContentData | null>(null);
  const [heygenAvatars, setHeygenAvatars] = useState<HeygenAvatar[]>([]);
  const [heygenLoading, setHeygenLoading] = useState(false);
  const [heygenLoadingMore, setHeygenLoadingMore] = useState(false);
  const [heygenError, setHeygenError] = useState<string | null>(null);
  const [heygenNextToken, setHeygenNextToken] = useState<string | null>(null);
  const [heygenHasMore, setHeygenHasMore] = useState(false);
  const [selectedHeygenId, setSelectedHeygenId] = useState<string>("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState("");

  // Voice selection (independent from avatar)
  const [voices, setVoices] = useState<HeygenVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesLoadingMore, setVoicesLoadingMore] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [voiceNextToken, setVoiceNextToken] = useState<string | null>(null);
  const [voiceHasMore, setVoiceHasMore] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceGender, setVoiceGender] = useState("all");
  const [selectedVoice, setSelectedVoice] = useState<HeygenVoice | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceAudio, setVoiceAudio] = useState<HTMLAudioElement | null>(null);

  // Cloned voices (HeyGen Voice Clone)
  /** Which video is being pulled down, so its button can show it. */
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [clones, setClones] = useState<VoiceClone[]>([]);
  const [clonesLoading, setClonesLoading] = useState(false);
  const [cloneSyncingId, setCloneSyncingId] = useState<string | null>(null);
  const [selectedClone, setSelectedClone] = useState<VoiceClone | null>(null);
  const [createCloneOpen, setCreateCloneOpen] = useState(false);
  const [deleteClone, setDeleteClone] = useState<VoiceClone | null>(null);
  const [deletingClone, setDeletingClone] = useState(false);
  const [errorClone, setErrorClone] = useState<VoiceClone | null>(null);
  const [playingCloneId, setPlayingCloneId] = useState<string | null>(null);

  // Video management
  const activeCampaignName = useCampaignStore((s) => s.activeCampaignName);
  const [viewVideo, setViewVideo] = useState<VideoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadHeygen();
    loadVoices();
    loadClones();
  }, [campaignId]);

  useEffect(() => {
    return () => {
      voiceAudio?.pause();
    };
  }, [voiceAudio]);


  /**
   * Re-fetches just the video list, without the loading flag.
   *
   * Rendering takes minutes on HeyGen, and the list was fetched once on mount:
   * a video that finished while you watched stayed on "Generating" until you
   * pressed the per-row sync button. This is what the poll below calls, and it
   * deliberately leaves `loading` alone so the library does not blink out and
   * back every few seconds.
   */
  const refreshVideos = async () => {
    try {
      setVideos(await fetchVideos(campaignId));
    } catch {
      // Background refresh — keep the last good list on screen.
    }
  };

  /*
    Keep refreshing while any video is still being made. "thinking" is the
    queued state and "generating" is the render itself; both are non-terminal,
    and both used to require the person to press sync to find out they had
    moved on.
  */
  const videosInFlight = videos.some((v) => v.status === "thinking" || v.status === "generating");
  usePollWhile(videosInFlight, refreshVideos);


  const loadData = async () => {
    setLoading(true);
    try {
      const [contentData, videoData] = await Promise.allSettled([
        fetchContent(campaignId),
        fetchVideos(campaignId),
      ]);
      if (contentData.status === "fulfilled") {
        setContent(contentData.value);
        setScript(contentData.value.script || "");
      }
      if (videoData.status === "fulfilled") setVideos(videoData.value);
    } catch {
      // content doesn't exist
    } finally {
      setLoading(false);
    }
  };

  const loadHeygen = async () => {
    setHeygenLoading(true);
    setHeygenError(null);
    try {
      const res = await fetchHeygenAvatars(PAGE_SIZE);
      setHeygenAvatars(res.items);
      setHeygenHasMore(res.hasMore);
      setHeygenNextToken(res.nextToken || null);
    } catch (err: any) {
      setHeygenError(err.message || "Failed to load HeyGen avatars");
    } finally {
      setHeygenLoading(false);
    }
  };

  const loadMoreHeygen = async () => {
    if (!heygenNextToken) return;

    setHeygenLoadingMore(true);
    try {
      const res = await fetchHeygenAvatars(PAGE_SIZE, heygenNextToken);
      setHeygenAvatars((prev) => [...prev, ...res.items]);
      setHeygenHasMore(res.hasMore);
      setHeygenNextToken(res.nextToken || null);
    } catch (err: any) {
      toast({
        title: "Couldn't load more avatars",
        description: err.message || "Failed to load more avatars.",
        variant: "destructive",
      });
    } finally {
      setHeygenLoadingMore(false);
    }
  };

  const loadVoices = async () => {
    setVoicesLoading(true);
    setVoicesError(null);
    try {
      const res = await fetchVoicesPage(VOICE_PAGE_SIZE);
      setVoices(res.items);
      setVoiceHasMore(res.hasMore);
      setVoiceNextToken(res.nextToken || null);
    } catch (err: any) {
      setVoicesError(err.message || "Failed to load voices");
    } finally {
      setVoicesLoading(false);
    }
  };

  const loadMoreVoices = async () => {
    if (!voiceNextToken) return;
    setVoicesLoadingMore(true);
    try {
      const res = await fetchVoicesPage(VOICE_PAGE_SIZE, voiceNextToken);
      setVoices((prev) => [...prev, ...res.items]);
      setVoiceHasMore(res.hasMore);
      setVoiceNextToken(res.nextToken || null);
    } catch (err: any) {
      toast({
        title: "Couldn't load more voices",
        description: err.message || "Failed to load more voices.",
        variant: "destructive",
      });
    } finally {
      setVoicesLoadingMore(false);
    }
  };

  const toggleVoicePreview = (voice: HeygenVoice) => {
    if (!voice.preview_audio_url) return;
    if (playingVoiceId === voice.voice_id) {
      voiceAudio?.pause();
      setPlayingVoiceId(null);
      return;
    }
    voiceAudio?.pause();
    const next = new Audio(voice.preview_audio_url);
    next.onended = () => setPlayingVoiceId(null);
    next.play().catch(() => setPlayingVoiceId(null));
    setVoiceAudio(next);
    setPlayingVoiceId(voice.voice_id);
  };

  // ---- Cloned voices ----
  const loadClones = async () => {
    setClonesLoading(true);
    try {
      const items = await listVoiceClones();
      setClones(items);
    } catch {
      // silent — DB-only load
    } finally {
      setClonesLoading(false);
    }
  };
  /*
    Voice clones have exactly the same problem videos had: HeyGen finishes them
    minutes later, nothing here noticed, and a clone that was ready could not be
    selected in the wizard because the row still said "processing". The modal
    even told people to "sync later to check the status" — the product asking
    the user to do its polling.
  */
  const clonesInFlight = clones.some((c) => c.status === "processing");
  usePollWhile(clonesInFlight, loadClones);

  const handleSyncClone = async (clone: VoiceClone) => {
    setCloneSyncingId(clone.id);
    try {
      const updated = await syncVoiceClone(clone.id);
      setClones((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (updated.status === "ready") {
        toast({
          title: "Voice synced",
          description: "Voice synced successfully.",
        });
      } else if (updated.status === "failed") {
        toast({
          title: "Voice cloning failed",
          description: updated.failureMessage || "Voice cloning failed.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Still processing",
          description: "This voice is still being cloned. Sync again shortly.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: err.message || "Unable to sync voice status.",
        variant: "destructive",
      });
    } finally {
      setCloneSyncingId(null);
    }
  };

  const handleDeleteClone = async () => {
    if (!deleteClone) return;
    setDeletingClone(true);
    try {
      await deleteVoiceClone(deleteClone.id);
      setClones((prev) => prev.filter((c) => c.id !== deleteClone.id));
      if (selectedClone?.id === deleteClone.id) setSelectedClone(null);
      toast({ title: "Deleted", description: "Voice clone removed." });
      setDeleteClone(null);
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "Unable to delete voice clone.",
        variant: "destructive",
      });
    } finally {
      setDeletingClone(false);
    }
  };

  const toggleClonePreview = (clone: VoiceClone) => {
    if (!clone.previewAudioUrl) return;
    if (playingCloneId === clone.id) {
      voiceAudio?.pause();
      setPlayingCloneId(null);
      return;
    }
    voiceAudio?.pause();
    setPlayingVoiceId(null);
    const next = new Audio(clone.previewAudioUrl);
    next.onended = () => setPlayingCloneId(null);
    next.play().catch(() => setPlayingCloneId(null));
    setVoiceAudio(next);
    setPlayingCloneId(clone.id);
  };

  const selectDefaultVoice = (voice: HeygenVoice) => {
    setSelectedClone(null);
    setSelectedVoice(voice);
  };

  const useClonedVoice = (clone: VoiceClone) => {
    setSelectedVoice(null);
    setSelectedClone(clone);
  };

  const voiceGenders = useMemo(
    () =>
      Array.from(new Set(voices.map((v) => v.gender).filter(Boolean))).sort(),
    [voices],
  );

  const filteredVoices = useMemo(() => {
    const term = voiceSearch.trim().toLowerCase();
    return voices.filter((v) => {
      const matchesTerm =
        !term ||
        v.name.toLowerCase().includes(term) ||
        v.language.toLowerCase().includes(term) ||
        v.gender.toLowerCase().includes(term);
      const matchesGender = voiceGender === "all" || v.gender === voiceGender;
      return matchesTerm && matchesGender;
    });
  }, [voices, voiceSearch, voiceGender]);

  const selectedAvatar = useMemo(
    () => heygenAvatars.find((a) => a.avatar_id === selectedHeygenId) || null,
    [heygenAvatars, selectedHeygenId],
  );

  const handleGenerate = () =>
    requireVerifiedEmail(async () => {
      if (!script.trim()) {
        toast({
          title: "Write a script first",
          description: "Script is required.",
          variant: "destructive",
        });
        return;
      }
      if (!selectedAvatar) {
        toast({
          title: "Choose a presenter",
          description: "Please select an avatar.",
          variant: "destructive",
        });
        return;
      }
      if (!selectedVoice && !selectedClone) {
        toast({
          title: "Choose a voice",
          description: "Please select a voice.",
          variant: "destructive",
        });
        return;
      }
      setGenerating(true);
      try {
        await generateVideo({
          campaignId,
          script,
          heygenAvatarId: selectedAvatar.avatar_id,
          avatarType: selectedAvatar.type,
          voiceId: selectedClone
            ? selectedClone.heygenVoiceId
            : selectedVoice!.voice_id,
          voiceName: selectedClone
            ? selectedClone.voiceName
            : selectedVoice!.name,
          voiceCloneId: selectedClone?.id,
        });
        toast({
          title: "Filming started",
          description: "AI video generation has started.",
        });

        const updated = await fetchVideos(campaignId);
        setVideos(updated);
        refetchUsage();

        // Return to the library view after a successful generation.
        setMode("library");
        setStep(0);
      } catch (err: any) {
        toast({
          title: "Couldn't start the video",
          description: err.message || "Failed to generate video.",
          variant: "destructive",
        });
      } finally {
        setGenerating(false);
      }
    });

  const handleDelete = async (id: string) => {
    await deleteVideo(id);
    setVideos((prev) => prev.filter((v) => v._id !== id));
    toast({ title: "Deleted", description: "Video removed." });
  };

  /**
   * A filename the operating system will actually open.
   *
   * This was `video.title ?? "video.mp4"`, so any video that had a title —
   * which is most of them, because HeyGen sets one — saved with no extension
   * at all. The file landed in Downloads as a bare name that does nothing on
   * double-click, at the very end of the funnel this whole product exists to
   * reach.
   */
  const downloadFilename = (video: VideoItem): string => {
    const base = (video.title || "video")
      .replace(/\.[a-z0-9]{2,4}$/i, "")
      .replace(/[^a-z0-9 _-]/gi, "")
      .trim()
      .slice(0, 80) || "video";
    return `${base}.mp4`;
  };

  const handleDownload = async (video: VideoItem) => {
    /*
      A finished 1080p render is tens of megabytes, and this pulls the whole
      file into memory as a blob before the browser's save dialog can appear.
      That is 10-30 seconds during which the page did absolutely nothing — no
      spinner, no disabled button, no message — so the only reasonable
      conclusion was that the click had missed, and people clicked again,
      starting a second download of the same file.
    */
    setDownloadingId(video._id);
    try {
      const url = getVideoDownloadUrl(video._id);
      const token = getToken();

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Without this, an expired session returns an error body and the next
      // line throws on `data.data` — reported to the customer as a download
      // failure rather than "sign in again".
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Your session has expired." : "Download link unavailable.");
      }

      const data = await res.json();
      const downloadUrl = data?.data?.downloadUrl;
      if (!downloadUrl) throw new Error("Download link unavailable.");

      // Fetch the actual video file as a blob
      const videoRes = await fetch(downloadUrl);
      const blob = await videoRes.blob();

      // Create a temporary anchor and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = downloadFilename(video); // see helper — always ends in .mp4
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({
        title: "Couldn't download the video",
        description: "The file may still be processing. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };
  const handleSyncVideo = async (video: VideoItem) => {
    setSyncingId(video._id);

    try {
      const res = await syncVideoById(video._id);

      switch (res?.status) {
        case "completed":
          setVideos((prev) => prev.map((v) => (v._id === res._id ? res : v)));
          toast({
            title: "Video ready",
            description:
              "The video has been successfully completed and is ready to view.",
          });
          break;

        case "generating":
        case "thinking":
          toast({
            title: "Still generating",
            description:
              "Your video is still being processed. Please check again in a few moments.",
          });
          break;

        case "failed":
          toast({
            title: "Generation Failed",
            description:
              "Video generation failed. Please try creating the video again.",
            variant: "destructive",
          });
          break;

        default:
          toast({
            title: "Synced",
            description: "Video status has been updated successfully.",
          });
      }

      await fetchVideos(campaignId);
    } catch (error) {
      toast({
        title: "Sync failed",
        description:
          "Unable to sync the video status at this time. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  };

  // ---- Wizard navigation helpers ----
  const stepValidity = useMemo(
    () => [
      !!selectedHeygenId,
      !!selectedVoice || !!selectedClone,
      !!script.trim(),
      true,
    ],
    [selectedHeygenId, selectedVoice, selectedClone, script],
  );

  const maxReachable = useMemo(() => {
    let reach = 0;
    for (let i = 0; i < stepValidity.length - 1; i++) {
      if (stepValidity[i]) reach = i + 1;
      else break;
    }
    return reach;
  }, [stepValidity]);

  const openCreate = () => {
    setStep(0);
    setMode("create");
  };

  const goToStep = (index: number) => {
    if (index <= maxReachable) setStep(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content || !content.script) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-8 py-8">
        <EmptyState
          icon={FileText}
          title="Write the script first"
          description="Filming starts from a script. Generate this campaign's content and the presenter has something to deliver."
          action={
            <Button asChild variant="cta" className="gap-2">
              <Link to="/content">
                <FileText className="h-4 w-4" />
                Generate content
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        {mode === "library" ? (
          <VideoLibrary
            videos={videos}
            campaignName={activeCampaignName}
            syncingId={syncingId}
          downloadingId={downloadingId}
            onCreateNew={openCreate}
            onView={(v) => setViewVideo(v)}
            onDownload={handleDownload}
            onSync={handleSyncVideo}
            onDelete={(v) => setDeleteTarget(v)}
          />
        ) : (
          <CreateVideoWizard
            steps={WIZARD_STEPS}
            current={step}
            maxReachable={maxReachable}
            canContinue={stepValidity[step]}
            onStepClick={goToStep}
            onBack={() => setStep((s) => Math.max(0, s - 1))}
            onContinue={() =>
              setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))
            }
            onCancel={() => {
              setMode("library");
              setStep(0);
            }}
          >
            {step === 0 && (
              <StepAvatar
                avatars={heygenAvatars}
                loading={heygenLoading}
                loadingMore={heygenLoadingMore}
                error={heygenError}
                hasMore={heygenHasMore}
                selectedId={selectedHeygenId}
                onSelect={setSelectedHeygenId}
                onClear={() => setSelectedHeygenId("")}
                onLoadMore={loadMoreHeygen}
              />
            )}
            {step === 1 && (
              <StepVoice
                voices={voices}
                filteredVoices={filteredVoices}
                voicesLoading={voicesLoading}
                voicesLoadingMore={voicesLoadingMore}
                voicesError={voicesError}
                voiceHasMore={voiceHasMore}
                voiceSearch={voiceSearch}
                voiceGender={voiceGender}
                voiceGenders={voiceGenders}
                selectedVoice={selectedVoice}
                playingVoiceId={playingVoiceId}
                onVoiceSearch={setVoiceSearch}
                onVoiceGender={setVoiceGender}
                onSelectVoice={selectDefaultVoice}
                onToggleVoicePreview={toggleVoicePreview}
                onLoadMoreVoices={loadMoreVoices}
                onClearSelection={() => {
                  setSelectedVoice(null);
                  setSelectedClone(null);
                }}
                clones={clones}
                clonesLoading={clonesLoading}
                cloneSyncingId={cloneSyncingId}
                selectedClone={selectedClone}
                playingCloneId={playingCloneId}
                onCreateClone={() => setCreateCloneOpen(true)}
                onUseClone={useClonedVoice}
                onToggleClonePreview={toggleClonePreview}
                onSyncClone={handleSyncClone}
                onViewCloneError={setErrorClone}
                onDeleteClone={setDeleteClone}
              />
            )}
            {step === 2 && <StepScript script={script} onChange={setScript} />}
            {step === 3 && (
              <StepReview
                selectedAvatar={selectedAvatar}
                selectedVoice={selectedVoice}
                selectedClone={selectedClone}
                script={script}
                usage={campaignUsage}
                generating={generating}
                onGenerate={handleGenerate}
              />
            )}
          </CreateVideoWizard>
        )}
      </div>

      <VideoPlayerModal
        video={viewVideo}
        open={!!viewVideo}
        onOpenChange={(o) => !o && setViewVideo(null)}
        onDownload={handleDownload}
      />
      <DeleteVideoModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget._id);
        }}
      />

      <CreateVoiceCloneModal
        open={createCloneOpen}
        onOpenChange={setCreateCloneOpen}
        onCreated={(voice) => setClones((prev) => [voice, ...prev])}
      />

      <AlertDialog
        open={!!deleteClone}
        onOpenChange={(o) => !o && !deletingClone && setDeleteClone(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voice clone?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this voice clone? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingClone}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteClone();
              }}
              disabled={deletingClone}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingClone ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!errorClone}
        onOpenChange={(o) => !o && setErrorClone(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voice cloning failed</AlertDialogTitle>
            <AlertDialogDescription>
              {errorClone?.failureMessage ||
                "The voice clone failed to process. Try creating it again with a clearer audio sample."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
