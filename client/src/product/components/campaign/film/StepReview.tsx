import { useState } from "react";
import { Button } from "@product/components/ui/button";
import { Badge } from "@product/components/ui/badge";
import { Progress } from "@product/components/ui/progress";
import { Loader2, Play, User, Mic, Film, AlertTriangle, ChevronDown } from "lucide-react";
import type { HeygenAvatar } from "@product/lib/heygen-api";
import type { HeygenVoice } from "@product/services/heygenVoiceService";
import type { VoiceClone } from "@product/lib/voice-clone-api";
import type { CampaignVideoUsage } from "@product/lib/subscription-api";
import { cn } from "@product/lib/utils";
import { BACKDROPS } from "@product/components/campaign/film/videoBackdrops";
import { VIDEO_ENGINES } from "@product/components/campaign/film/videoEngines";

interface StepReviewProps {
  selectedAvatar: HeygenAvatar | null;
  selectedVoice: HeygenVoice | null;
  selectedClone: VoiceClone | null;
  script: string;
  usage?: CampaignVideoUsage;
  generating: boolean;
  renderMode: "exact" | "agent";
  onRenderModeChange: (mode: "exact" | "agent") => void;
  captions: boolean;
  onCaptionsChange: (on: boolean) => void;
  backdrop: string;
  onBackdropChange: (id: string) => void;
  engine: "avatar_iii" | "avatar_iv" | "avatar_v";
  onEngineChange: (id: "avatar_iii" | "avatar_iv" | "avatar_v") => void;
  onGenerate: () => void;
}

export function StepReview({
  selectedAvatar,
  selectedVoice,
  selectedClone,
  script,
  usage,
  generating,
  renderMode,
  onRenderModeChange,
  captions,
  onCaptionsChange,
  backdrop,
  onBackdropChange,
  engine,
  onEngineChange,
  onGenerate,
}: StepReviewProps) {
  const [scriptOpen, setScriptOpen] = useState(false);
  const voiceName = selectedClone?.voiceName || selectedVoice?.name || "—";
  const voiceType = selectedClone ? "Cloned voice" : "Default voice";
  const reachedLimit = !!usage?.reachedLimit;
  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 0;
  const remaining = usage?.remaining ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Review &amp; Generate
        </h3>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Confirm your selections before generating the video.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Avatar */}
        <div className="rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#f8fafc] shrink-0 flex items-center justify-center">
            {selectedAvatar?.preview_image_url ? (
              <img
                src={selectedAvatar.preview_image_url}
                alt={selectedAvatar.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <User className="w-3.5 h-3.5" /> Avatar
            </p>
            <p className="mt-0.5 truncate text-[14.5px] font-semibold text-foreground">
              {selectedAvatar?.name || "—"}
            </p>
          </div>
        </div>

        {/* Voice */}
        <div className="rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
            <Mic className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Mic className="w-3.5 h-3.5" /> Voice
            </p>
            <p className="mt-0.5 truncate text-[14.5px] font-semibold text-foreground">
              {voiceName}
            </p>
            <p className="text-[12.5px] text-muted-foreground">{voiceType}</p>
          </div>
        </div>
      </div>

      {/* Script summary */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Film className="w-3.5 h-3.5" /> Script
          </p>
          <span className="text-[12.5px] text-muted-foreground">
            {script.length} characters
          </span>
        </div>
        {/*
          Expandable, not permanently clamped.

          Four lines with no way to see the rest meant the one thing being
          rendered was the one thing you could not check. A wrong prospect name
          in the third paragraph stayed invisible until the video came back and
          the credit was gone.
        */}
        <p
          className={cn(
            "text-sm text-foreground whitespace-pre-wrap",
            !scriptOpen && "line-clamp-4",
          )}
        >
          {script || "No script provided."}
        </p>
        {script.length > 220 && (
          <button
            type="button"
            onClick={() => setScriptOpen((v) => !v)}
            className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-primary"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", scriptOpen && "rotate-180")}
            />
            {scriptOpen ? "Show less" : "Read the whole script"}
          </button>
        )}
      </div>

      {/*
        How this gets rendered.

        Both are real HeyGen pipelines and they behave very differently, so the
        choice belongs on the screen where the cost is about to be spent rather
        than buried in settings. "Exact" is first and default: this product
        writes the script, so the script should be what gets spoken.
      */}
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          How it gets made
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            {
              id: "exact" as const,
              title: "Speak my script",
              body: "Your presenter says these exact words. Faster, and the result is the same every time.",
            },
            {
              id: "agent" as const,
              title: "Let HeyGen write it",
              body: "HeyGen writes its own script and picks its own title from your topic. Cheaper per second, slower to render.",
            },
          ]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onRenderModeChange(opt.id)}
              disabled={generating}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60",
                renderMode === opt.id
                  ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                  : "border-border/70 hover:border-primary/45 hover:bg-secondary/50",
              )}
            >
              <span className="block text-[14px] font-semibold text-foreground">{opt.title}</span>
              <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">
                {opt.body}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/*
        How lifelike the render is.

        This is the single biggest quality lever HeyGen sells and the product
        was never pulling it: avatars in this account support avatar_v,
        avatar_iv and avatar_iii, and every render asked for none of them, so
        the base pipeline produced a face capable of far better. Named for what
        they do — a customer choosing between "avatar_iv" and "avatar_v" is
        being asked to read a changelog.
      */}
      {renderMode === "exact" && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Render quality
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {VIDEO_ENGINES.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onEngineChange(e.id)}
                disabled={generating}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60",
                  engine === e.id
                    ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                    : "border-border/70 hover:border-primary/45 hover:bg-secondary/50",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-foreground">{e.label}</span>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">{e.cost}</span>
                </span>
                <span className="mt-1 block text-[12px] leading-snug text-muted-foreground">
                  {e.blurb}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/*
        The backdrop, as named swatches.

        A generated presenter comes with whatever wall its recipe described —
        usually grey studio, which is also what every other AI video on the feed
        looks like. HeyGen applies a colour at render time, so this costs nothing
        and needs no new avatar. Named rather than a hex picker: a colour field
        asks the customer to be a colour designer, which is the same mistake the
        blank prompt box made.
      */}
      {renderMode === "exact" && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Backdrop
          </p>
          <div className="flex flex-wrap gap-2">
            {BACKDROPS.map((b) => {
              const active = backdrop === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onBackdropChange(b.id)}
                  disabled={generating}
                  title={b.note}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60",
                    active
                      ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                      : "border-border/70 hover:border-primary/45 hover:bg-secondary/50",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-6 w-6 flex-none rounded-md border",
                      b.color ? "border-black/10" : "border-dashed border-border",
                    )}
                    style={{ background: b.swatch }}
                  />
                  <span className="text-[13px] font-medium text-foreground">{b.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {BACKDROPS.find((b) => b.id === backdrop)?.note}
          </p>
        </div>
      )}

      {/*
        Subtitles, and only where they are actually available.

        The agent pipeline composes its own output and does not take this
        option, so offering it there would be a control that silently does
        nothing. Defaulted on because the majority of feed video is watched
        with the sound off — an uncaptioned talking head is one nobody hears.
      */}
      {renderMode === "exact" && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            checked={captions}
            onChange={(e) => onCaptionsChange(e.target.checked)}
            disabled={generating}
            className="mt-0.5 h-4 w-4 flex-none accent-primary"
          />
          <span>
            <span className="block text-[14px] font-semibold text-foreground">
              Burn in subtitles
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
              Rendered into the file, so they survive every platform. Most feed
              video is watched with the sound off.
            </span>
          </span>
        </label>
      )}

      {/* Usage */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Usage
          </span>
          {reachedLimit ? (
            <Badge variant="destructive">Limit Reached</Badge>
          ) : (
            <Badge variant="secondary">{remaining} remaining</Badge>
          )}
        </div>
        <Progress
          value={limit ? (used / limit) * 100 : 0}
          className="h-1.5"
        />
        <p className="text-[12.5px] text-muted-foreground">
          {used} / {limit} generations used
        </p>
      </div>

      {reachedLimit && (
        <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          This campaign has reached its video limit ({limit} total generations).
          No more videos can be generated.
        </p>
      )}

      <Button
        onClick={onGenerate}
        disabled={
          generating ||
          reachedLimit ||
          !selectedAvatar ||
          (!selectedVoice && !selectedClone) ||
          !script.trim()
        }
        className="gap-2 w-full sm:w-auto"
      >
        {generating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {generating
          ? "Generating..."
          : used > 0
            ? "Regenerate Video"
            : "Generate Video"}
      </Button>
    </div>
  );
}
