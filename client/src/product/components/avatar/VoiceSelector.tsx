import { useEffect, useMemo, useState } from "react";
import { Input } from "@product/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@product/components/ui/select";
import { ScrollArea } from "@product/components/ui/scroll-area";
import { Loader2, Search, Play, Pause, Check } from "lucide-react";
import { cn } from "@product/lib/utils";
import { getAllVoices, type HeygenVoice } from "@product/services/heygenVoiceService";

interface VoiceSelectorProps {
  selectedVoiceId?: string;
  onSelect: (voice: HeygenVoice) => void;
}

export function VoiceSelector({ selectedVoiceId, onSelect }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<HeygenVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<string>("all");
  const [gender, setGender] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    getAllVoices()
      .then((v) => {
        if (active) setVoices(v);
      })
      .catch((e) => {
        if (active) setError(e?.message || "Failed to load voices");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      audio?.pause();
    };
  }, [audio]);

  const languages = useMemo(
    () => Array.from(new Set(voices.map((v) => v.language).filter(Boolean))).sort(),
    [voices]
  );
  const genders = useMemo(
    () => Array.from(new Set(voices.map((v) => v.gender).filter(Boolean))).sort(),
    [voices]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return voices.filter((v) => {
      const matchesTerm =
        !term ||
        v.name.toLowerCase().includes(term) ||
        v.language.toLowerCase().includes(term) ||
        v.gender.toLowerCase().includes(term);
      const matchesLang = language === "all" || v.language === language;
      const matchesGender = gender === "all" || v.gender === gender;
      return matchesTerm && matchesLang && matchesGender;
    });
  }, [voices, search, language, gender]);

  const togglePlay = (voice: HeygenVoice) => {
    if (!voice.preview_audio_url) return;
    if (playingId === voice.voice_id) {
      audio?.pause();
      setPlayingId(null);
      return;
    }
    audio?.pause();
    const next = new Audio(voice.preview_audio_url);
    next.onended = () => setPlayingId(null);
    next.play().catch(() => setPlayingId(null));
    setAudio(next);
    setPlayingId(voice.voice_id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive py-6 text-center">{error}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, language, gender"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            {genders.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-72 rounded-md border border-border">
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No voices match your filters.
            </p>
          ) : (
            filtered.map((voice) => {
              const isSelected = voice.voice_id === selectedVoiceId;
              return (
                <button
                  type="button"
                  key={voice.voice_id}
                  onClick={() => onSelect(voice)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                      {voice.name}
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {voice.language} · {voice.gender}
                    </p>
                  </div>
                  {voice.preview_audio_url && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(voice);
                      }}
                      className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {playingId === voice.voice_id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
