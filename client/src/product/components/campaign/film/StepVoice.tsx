import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Badge } from "@product/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@product/components/ui/select";
import {
  Loader2,
  AlertTriangle,
  Search,
  Check,
  Mic,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  CircleAlert,
} from "lucide-react";
import type { HeygenVoice } from "@product/services/heygenVoiceService";
import type { VoiceClone } from "@product/lib/voice-clone-api";
import { cn } from "@product/lib/utils";

interface StepVoiceProps {
  // default voices
  voices: HeygenVoice[];
  filteredVoices: HeygenVoice[];
  voicesLoading: boolean;
  voicesLoadingMore: boolean;
  voicesError: string | null;
  voiceHasMore: boolean;
  voiceSearch: string;
  voiceGender: string;
  voiceGenders: string[];
  selectedVoice: HeygenVoice | null;
  playingVoiceId: string | null;
  onVoiceSearch: (value: string) => void;
  onVoiceGender: (value: string) => void;
  onSelectVoice: (voice: HeygenVoice) => void;
  onToggleVoicePreview: (voice: HeygenVoice) => void;
  onLoadMoreVoices: () => void;
  onClearSelection: () => void;
  // cloned voices
  clones: VoiceClone[];
  clonesLoading: boolean;
  cloneSyncingId: string | null;
  selectedClone: VoiceClone | null;
  playingCloneId: string | null;
  onCreateClone: () => void;
  onUseClone: (clone: VoiceClone) => void;
  onToggleClonePreview: (clone: VoiceClone) => void;
  onSyncClone: (clone: VoiceClone) => void;
  onViewCloneError: (clone: VoiceClone) => void;
  onDeleteClone: (clone: VoiceClone) => void;
}

export function StepVoice(props: StepVoiceProps) {
  const {
    filteredVoices,
    voicesLoading,
    voicesLoadingMore,
    voicesError,
    voiceHasMore,
    voiceSearch,
    voiceGender,
    voiceGenders,
    selectedVoice,
    playingVoiceId,
    onVoiceSearch,
    onVoiceGender,
    onSelectVoice,
    onToggleVoicePreview,
    onLoadMoreVoices,
    onClearSelection,
    clones,
    clonesLoading,
    cloneSyncingId,
    selectedClone,
    playingCloneId,
    onCreateClone,
    onUseClone,
    onToggleClonePreview,
    onSyncClone,
    onViewCloneError,
    onDeleteClone,
  } = props;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Mic className="w-5 h-5 text-primary" /> Select a Voice
          </h3>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Pick a default voice or use one of your cloned voices.
          </p>
        </div>
        {(selectedVoice || selectedClone) && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Default voices */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Default Voices
        </p>
        {voicesLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[14px] text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading voices...
          </div>
        ) : voicesError ? (
          <div className="flex items-center gap-2 text-[14px] text-destructive border border-destructive/30 bg-destructive/5 rounded-md p-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{voicesError}</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, language, gender"
                  value={voiceSearch}
                  onChange={(e) => onVoiceSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={voiceGender} onValueChange={onVoiceGender}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  {voiceGenders.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1 content-start">
              {filteredVoices.length === 0 ? (
                <p className="col-span-full py-8 text-center text-[14px] text-muted-foreground">
                  No voices match your filters.
                </p>
              ) : (
                filteredVoices.map((voice) => {
                  const isSelected = voice.voice_id === selectedVoice?.voice_id;
                  return (
                    <button
                      type="button"
                      key={voice.voice_id}
                      onClick={() => onSelectVoice(voice)}
                      className={cn(
                        "relative rounded-xl border p-3 text-left transition-all flex flex-col gap-2 h-fit",
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:shadow-sm",
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      <div className="min-w-0 pr-6">
                        <p className="truncate text-[14.5px] font-semibold text-foreground">
                          {voice.name}
                        </p>
                        <p className="text-[12.5px] capitalize text-muted-foreground">
                          {voice.gender} · {voice.language}
                        </p>
                      </div>
                      {voice.preview_audio_url && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVoicePreview(voice);
                          }}
                          className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
                        >
                          {playingVoiceId === voice.voice_id ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Preview
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {voiceHasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onLoadMoreVoices}
                  disabled={voicesLoadingMore}
                  className="gap-2"
                >
                  {voicesLoadingMore && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {voicesLoadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* My Cloned Voices */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            My Cloned Voices
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 h-8"
            onClick={onCreateClone}
          >
            <Plus className="w-3.5 h-3.5" /> Create Voice Clone
          </Button>
        </div>

        {clonesLoading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-[14px] text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading voices...
          </div>
        ) : clones.length === 0 ? (
          <p className="py-3 text-[14px] text-muted-foreground">
            No cloned voices yet. Create one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clones.map((clone) => {
              const isReady = clone.status === "ready";
              const isSelected = selectedClone?.id === clone.id;
              return (
                <div
                  key={clone.id}
                  className={cn(
                    "rounded-xl border p-3 transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                      : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold text-foreground">
                        {clone.voiceName}
                      </p>
                      <p className="text-[12.5px] capitalize text-muted-foreground">
                        {isReady
                          ? [clone.language, clone.gender]
                              .filter(Boolean)
                              .join(" · ") || "Ready"
                          : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(clone.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        clone.status === "ready"
                          ? "default"
                          : clone.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      className="capitalize shrink-0"
                    >
                      {clone.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {isReady && clone.previewAudioUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => onToggleClonePreview(clone)}
                      >
                        {playingCloneId === clone.id ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Preview
                      </Button>
                    )}
                    {isReady && (
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "secondary"}
                        className="h-8 gap-1.5"
                        onClick={() => onUseClone(clone)}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Selected
                          </>
                        ) : (
                          "Use Voice"
                        )}
                      </Button>
                    )}
                    {clone.status === "failed" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => onViewCloneError(clone)}
                      >
                        <CircleAlert className="w-3.5 h-3.5" /> View Error
                      </Button>
                    )}
                    {(clone.status === "processing" ||
                      clone.status === "failed") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => onSyncClone(clone)}
                        disabled={cloneSyncingId === clone.id}
                      >
                        <RefreshCw
                          className={cn(
                            "w-3.5 h-3.5",
                            cloneSyncingId === clone.id && "animate-spin",
                          )}
                        />
                        Sync
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => onDeleteClone(clone)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
