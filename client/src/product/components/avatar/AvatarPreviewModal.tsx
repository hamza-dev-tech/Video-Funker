import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@product/components/ui/dialog";
import { Badge } from "@product/components/ui/badge";
import { Button } from "@product/components/ui/button";
import { ProcessingSurface, ElapsedSince } from "@product/components/ui/processing";
import {
  User, Trash2, Maximize2, Play, Pause, ChevronDown, Wand2,
} from "lucide-react";
import type { CustomAvatar, PresenterSpec } from "@product/lib/heygen-api";
import { cn } from "@product/lib/utils";
import { summarise } from "@product/lib/presenterPrompt";
import { POSE_OPTIONS, ORIENTATION_OPTIONS } from "./presenterRecipes";
import {
  getSourceLabel,
  getStatusMeta,
  formatCreatedDate,
} from "@product/components/avatar/AvatarCard";

/**
 * Looking at a presenter you already made.
 *
 * What this replaces showed three facts — source, status, date — none of which
 * describe the presenter, next to a 200px crop of the face inside a 672px
 * dialog that was two thirds empty. The only coloured control was Delete, so
 * the most prominent thing in a window for admiring your work was the button
 * that destroys it.
 *
 * Everything added here was already in the database and simply never sent to
 * the browser: the prompt, the spec that built it, the true image dimensions,
 * and a playable sample of the voice. The old modal was not missing
 * information, it was built before that information existed and never caught up.
 */

interface AvatarPreviewModalProps {
  avatar: CustomAvatar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (avatar: CustomAvatar) => void;
}

/** The look of a presenter in three words, from the spec that produced it. */
function specChips(spec?: PresenterSpec | null): string[] {
  if (!spec) return [];
  const chips: string[] = [];
  if (spec.style && spec.style !== "Unspecified") chips.push(spec.style);
  const pose = POSE_OPTIONS.find((p) => p.value === spec.pose);
  if (pose) chips.push(pose.label);
  const orientation = ORIENTATION_OPTIONS.find((o) => o.value === spec.orientation);
  if (orientation) chips.push(orientation.label);
  return chips;
}

export function AvatarPreviewModal({
  avatar,
  open,
  onOpenChange,
  onDelete,
}: AvatarPreviewModalProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Closing the dialog while a voice sample plays would otherwise leave it
  // playing from a window that is no longer on screen.
  useEffect(() => {
    if (!open) {
      audio.current?.pause();
      setPlaying(false);
      setShowPrompt(false);
    }
  }, [open]);

  if (!avatar) return null;

  const status = getStatusMeta(avatar.status);
  const processing = ["pending", "processing", "generating", "training"].includes(
    avatar.status || ""
  );

  const chips = specChips(avatar.presenterSpec);
  const summary = avatar.presenterSpec ? summarise(avatar.presenterSpec) : "";

  /*
    Size the frame to the image we actually received. The old markup forced
    aspect-[3/4] with object-cover, so any avatar HeyGen returned in another
    shape was cropped to fit — usually taking the top of the head with it.
    object-contain on a neutral ground shows the whole thing, always.
  */
  const ratio =
    avatar.imageWidth && avatar.imageHeight
      ? `${avatar.imageWidth} / ${avatar.imageHeight}`
      : "3 / 4";

  const toggleVoice = () => {
    if (!audio.current) return;
    if (playing) {
      audio.current.pause();
      setPlaying(false);
    } else {
      void audio.current.play();
      setPlaying(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-4">
            <div className="min-w-0">
              <DialogTitle className="line-clamp-2">{avatar.name}</DialogTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Added {formatCreatedDate(avatar.createdAt) || "—"}
              </p>
            </div>
            <Badge variant="outline" className={cn("flex-none", status.className)}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[232px_minmax(0,1fr)]">
          <div className="space-y-2">
            <div
              /*
                A floor as well as a ratio. Following the image exactly is right
                for the portraits HeyGen usually returns, but a wide one
                collapses the frame to a strip — measured at 220x120 on a 900x490
                avatar. The minimum keeps the preview a preview; object-contain
                letterboxes into it rather than cropping.
              */
              className="relative min-h-[200px] overflow-hidden rounded-xl border border-border/70 bg-secondary/50"
              style={{ aspectRatio: ratio }}
            >
              {processing ? (
                <ProcessingSurface
                  label="Building the face"
                  /*
                    Not "Generating" — the status badge two lines above already
                    says that, and the two rendered stacked as "Generating /
                    Generating". This says what is being made and what to do
                    with the wait instead of repeating the state.
                  */
                  hint="A few minutes. You can close this and keep working."
                />
              ) : avatar.avatarImage ? (
                <img
                  src={avatar.avatarImage}
                  alt={avatar.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <User className="h-9 w-9" />
                  <span className="px-2 text-center text-[12.5px]">
                    No preview available
                  </span>
                </div>
              )}

              {!processing && avatar.imageWidth && avatar.imageHeight && (
                <span className="absolute bottom-2 left-2 rounded-md border border-border/70 bg-card/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                  {avatar.imageWidth} × {avatar.imageHeight}
                </span>
              )}
            </div>

            {processing && (
              <ElapsedSince iso={avatar.createdAt} className="block text-center" />
            )}
          </div>

          <div className="min-w-0 space-y-3.5">
            {summary ? (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  What we generated
                </p>
                <p className="text-[14px] leading-relaxed text-foreground">{summary}</p>
              </div>
            ) : (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Source
                </p>
                <p className="text-[14px] text-foreground">
                  {getSourceLabel(avatar.avatarSourceType)}
                </p>
              </div>
            )}

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-medium text-secondary-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {avatar.voiceName && (
              <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5">
                {avatar.previewAudioUrl && (
                  <>
                    <audio
                      ref={audio}
                      src={avatar.previewAudioUrl}
                      onEnded={() => setPlaying(false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={toggleVoice}
                      aria-label={playing ? "Pause voice sample" : "Play voice sample"}
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {playing ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="ml-0.5 h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {avatar.voiceName}
                    {avatar.voiceLanguage ? ` — ${avatar.voiceLanguage}` : ""}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {avatar.previewAudioUrl ? "Hear this voice" : "No sample available"}
                  </p>
                </div>
              </div>
            )}

            {/*
              The literal prompt, available but folded away. Six hundred
              characters of lens direction is worth seeing once and tiring on
              every visit, so the readable summary leads and this backs it up.
            */}
            {avatar.heygenPrompt && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPrompt((v) => !v)}
                  className="flex items-center gap-1 text-[12.5px] font-semibold text-primary"
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", showPrompt && "rotate-180")}
                  />
                  {showPrompt ? "Hide" : "See"} the exact prompt
                </button>
                {showPrompt && (
                  <p className="mt-2 rounded-lg border border-border/70 bg-secondary/40 p-3 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                    <Wand2 className="mr-1.5 inline h-3 w-3" />
                    {avatar.heygenPrompt}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/*
          Delete sits apart from the confirming actions and carries no fill.
          It was the only coloured control in the old dialog, which made the
          destructive path the brightest thing in a window meant for looking.
        */}
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onDelete(avatar);
            }}
            className="flex items-center gap-1.5 rounded-lg px-1 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {avatar.avatarImage && !processing && (
              <Button asChild className="gap-1.5">
                <a href={avatar.avatarImage} target="_blank" rel="noopener noreferrer">
                  <Maximize2 className="h-4 w-4" />
                  Open full size
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
