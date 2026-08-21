import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@product/components/ui/dialog";
import { Button } from "@product/components/ui/button";
import { Label } from "@product/components/ui/label";
import { Textarea } from "@product/components/ui/textarea";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";

/**
 * Confirming a regeneration that destroys everything.
 *
 * "Regenerate All" was a plain outline button that ran on a single click. Before
 * a word was generated the server blanked nine fields — including the video
 * script someone may have spent an hour rewriting for a named prospect, and
 * possibly the exact script a finished video was filmed from. There was no
 * dialog, no undo and no draft.
 *
 * Two things make this more than a scare screen.
 *
 * The topic is editable here. The topic box only existed on the very first run,
 * so "Regenerate" re-rolled the identical prompt and hoped for different
 * randomness — the least likely route to a better result. Changing the angle is
 * usually the actual intent.
 *
 * And the cost is stated. It spends one of a small, fixed number of
 * regenerations, which the old button never said anywhere.
 */

interface RegenerateAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTopic: string;
  /** Sections that currently hold text and will be replaced. */
  filledSections: string[];
  remaining: number;
  max: number;
  busy?: boolean;
  onConfirm: (topic: string) => void;
}

export function RegenerateAllDialog({
  open,
  onOpenChange,
  currentTopic,
  filledSections,
  remaining,
  max,
  busy,
  onConfirm,
}: RegenerateAllDialogProps) {
  const [topic, setTopic] = useState(currentTopic);

  // Reopen should show what is stored now, not whatever was typed and abandoned
  // the last time the dialog was open.
  useEffect(() => {
    if (open) setTopic(currentTopic);
  }, [open, currentTopic]);

  const trimmed = topic.trim();
  const changed = trimmed !== currentTopic.trim();

  return (
    <Dialog open={open} onOpenChange={busy ? () => {} : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Regenerate everything?</DialogTitle>
          <DialogDescription>
            This replaces all generated content for this campaign. It cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {filledSections.length > 0 && (
          <div className="flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3.5">
            <AlertTriangle className="mt-px h-4 w-4 flex-none text-amber-600 dark:text-amber-400" strokeWidth={2} />
            <div className="text-[13px] leading-relaxed text-foreground/85">
              <p className="font-semibold text-foreground">
                {filledSections.length} section{filledSections.length > 1 ? "s" : ""} will be overwritten
              </p>
              <p className="mt-0.5">{filledSections.join(", ")}.</p>
              <p className="mt-1.5">
                Any edits you made to the video script are included. If a video has already
                been filmed from it, the video keeps its own copy.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Topic</Label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            placeholder="e.g. Why mid-market RevOps teams stall at 50 reps"
            className="resize-none"
          />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {changed
              ? "Everything will be rebuilt around this new topic."
              : "Regenerating with the same topic only re-rolls the wording. Change the angle if the last result missed."}
          </p>
        </div>

        <p className="text-[13px] text-muted-foreground">
          Uses 1 of your {max} regenerations.{" "}
          <span className="font-medium text-foreground">
            {remaining} remaining{remaining === 1 ? "" : ""} before this one.
          </span>
        </p>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep what I have
          </Button>
          <Button
            onClick={() => onConfirm(trimmed)}
            disabled={busy || !trimmed}
            className="gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {busy ? "Starting" : "Replace and regenerate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RegenerateAllDialog;
