import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@product/components/ui/dialog";
import { Button } from "@product/components/ui/button";
import { Textarea } from "@product/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@product/lib/utils";
import { useToast } from "@product/hooks/use-toast";
import { updateScript, ContentData } from "@product/lib/content-api";

const MAX_CHARS = 2500;

interface EditScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  script: string;
  onSaved: (content: ContentData) => void;
}

export function EditScriptModal({ open, onOpenChange, campaignId, script, onSaved }: EditScriptModalProps) {
  const { toast } = useToast();
  const [value, setValue] = useState(script);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(script);
  }, [open, script]);

  const trimmed = value.trim();
  const overLimit = value.length > MAX_CHARS;
  const canSave = trimmed.length > 0 && !overLimit && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await updateScript(campaignId, value);
      onSaved(updated);
      onOpenChange(false);
      toast({ title: "Success", description: "Video script updated successfully." });
    } catch (err: any) {
      toast({
        title: "Couldn't save the script",
        description: err?.message || "Failed to update video script.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return; // prevent accidental closure during save
        /*
          Ask before throwing away edits.

          Closing dropped everything typed here with no warning — and this is
          the one screen where someone rewrites the opening line for a named
          prospect. A click outside the dialog was enough to lose it, with no
          draft kept anywhere.
        */
        if (!next && value !== script) {
          const discard = window.confirm(
            "Discard your changes to this script? They have not been saved."
          );
          if (!discard) return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit the script</DialogTitle>
          <DialogDescription>
            Modify the spoken script below. Line breaks and formatting are preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={14}
            className="resize-y font-sans text-[15px] leading-relaxed"
            placeholder="What the presenter says, word for word"
            disabled={saving}
          />
          <div className="flex items-center justify-between text-[12.5px]">
            <span className={cn("text-muted-foreground", trimmed.length === 0 && "text-destructive")}>
              {trimmed.length === 0 ? "Script cannot be empty" : ""}
            </span>
            <span className={cn("text-muted-foreground", overLimit && "text-destructive font-medium")}>
              {value.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="cta" onClick={handleSave} disabled={!canSave} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving" : "Save script"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
