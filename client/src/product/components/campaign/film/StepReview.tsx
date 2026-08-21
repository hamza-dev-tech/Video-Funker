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

interface StepReviewProps {
  selectedAvatar: HeygenAvatar | null;
  selectedVoice: HeygenVoice | null;
  selectedClone: VoiceClone | null;
  script: string;
  usage?: CampaignVideoUsage;
  generating: boolean;
  onGenerate: () => void;
}

export function StepReview({
  selectedAvatar,
  selectedVoice,
  selectedClone,
  script,
  usage,
  generating,
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
