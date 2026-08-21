import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@product/components/ui/dialog";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import { Checkbox } from "@product/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@product/components/ui/select";
import { Loader2, Upload, X, FileAudio } from "lucide-react";
import { useToast } from "@product/hooks/use-toast";
import { createVoiceClone, VoiceClone } from "@product/lib/voice-clone-api";

interface CreateVoiceCloneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (voice: VoiceClone) => void;
}

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave"];
const NO_LANGUAGE = "__auto__";

export function CreateVoiceCloneModal({
  open,
  onOpenChange,
  onCreated,
}: CreateVoiceCloneModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [voiceName, setVoiceName] = useState("");
  const [language, setLanguage] = useState<string>(NO_LANGUAGE);
  const [file, setFile] = useState<File | null>(null);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setVoiceName("");
    setLanguage(NO_LANGUAGE);
    setFile(null);
    setRemoveNoise(true);
    setConsent(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isAudio = ACCEPTED.includes(f.type) || /\.(mp3|wav)$/i.test(f.name);
    if (!isAudio) {
      toast({
        title: "Invalid file",
        description: "Only MP3 or WAV audio files are supported.",
        variant: "destructive",
      });
      return;
    }
    if (f.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: "Audio file must be 20MB or smaller.",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
  };

  const nameValid = voiceName.trim().length >= 1 && voiceName.trim().length <= 100;
  const canSubmit = nameValid && !!file && consent && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !file) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("voiceName", voiceName.trim());
      if (language !== NO_LANGUAGE) fd.append("language", language);
      fd.append("removeBackgroundNoise", String(removeNoise));
      fd.append("consent", "true");
      fd.append("audio", file);

      const created = await createVoiceClone(fd);
      toast({
        title: "Voice clone submitted",
        description: "Voice clone submitted successfully. Sync later to check status.",
      });
      onCreated(created);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to create voice clone",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting) return; // prevent closing mid-submit
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Clone a voice</DialogTitle>
          <DialogDescription>
            Upload an audio sample to create a HeyGen voice clone. Processing happens on
            HeyGen — sync later to check the status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Voice name */}
          <div className="space-y-2">
            <Label htmlFor="voice-name" className="text-[13px] font-semibold">
              Voice name
            </Label>
            <Input
              id="voice-name"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g. Founder voice"
              maxLength={100}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">{voiceName.trim().length}/100</p>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="voice-language" className="text-[13px] font-semibold">
              Language <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Select value={language} onValueChange={setLanguage} disabled={submitting}>
              <SelectTrigger id="voice-language">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LANGUAGE}>Auto-detect</SelectItem>
                <SelectItem value="en">English (en)</SelectItem>
                <SelectItem value="es">Spanish (es)</SelectItem>
                <SelectItem value="hi">Hindi (hi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audio upload */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Audio sample</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              className="hidden"
              onChange={handleFile}
              disabled={submitting}
            />
            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-secondary/50 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-sm text-foreground truncate">
                  <FileAudio className="w-4 h-4 shrink-0 text-primary" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={submitting}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" /> Select MP3 or WAV (max 20MB)
              </Button>
            )}
          </div>

          {/* Remove background noise */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="remove-noise"
              checked={removeNoise}
              onCheckedChange={(c) => setRemoveNoise(c === true)}
              disabled={submitting}
            />
            <Label htmlFor="remove-noise" className="font-normal cursor-pointer">
              Remove background noise
            </Label>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-2 rounded-md border border-border p-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(c) => setConsent(c === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="font-normal cursor-pointer text-sm leading-snug">
              I confirm that I own this voice or have permission to clone it.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating..." : "Create Voice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
