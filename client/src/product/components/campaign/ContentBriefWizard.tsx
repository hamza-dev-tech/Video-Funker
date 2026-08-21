import { useMemo, useState } from "react";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import { Textarea } from "@product/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@product/components/ui/select";
import {
  ArrowLeft, ArrowRight, Loader2, FileText, ChevronDown, Wand2,
} from "lucide-react";
import { cn } from "@product/lib/utils";
import {
  CAMPAIGN_ANGLES, OUTCOME_OPTIONS, previewBrief, summariseBrief,
  type CampaignBrief,
} from "@product/components/campaign/campaignAngles";

/**
 * Setting up a campaign, instead of typing one line into a box.
 *
 * What this replaces was a single `Input` labelled "Enter topic" and a button
 * that started eight AI calls. Typing `x` passed validation. Nothing on screen
 * suggested what a good topic looked like, nobody was asked who it was for or
 * what should happen afterwards, and there was no review before a long,
 * expensive, irreversible run.
 *
 * Three screens, deliberately mirroring the presenter wizard so the two feel
 * like one product: choose the stance, fill in the specifics, see exactly what
 * will be asked for. Picking an angle advances by itself — one decision with
 * the options fully visible does not need a second click to confirm it.
 */

type Screen = "angle" | "refine" | "review";
const FLOW: Screen[] = ["angle", "refine", "review"];

const HEADINGS: Record<Screen, { title: string; body: string }> = {
  angle: {
    title: "What kind of campaign is this?",
    body: "The angle is the stance you take, not the subject. It is what makes the difference between an article about a category and an argument someone stops to read.",
  },
  refine: {
    title: "The specifics",
    body: "Only the topic is required. Everything else sharpens the output.",
  },
  review: {
    title: "This is what will be written",
    body: "Research, an article, a video script, captions, LinkedIn posts, outbound scripts, an image concept and a long-form post.",
  },
};

interface ContentBriefWizardProps {
  generating: boolean;
  onGenerate: (brief: CampaignBrief) => void;
}

export function ContentBriefWizard({ generating, onGenerate }: ContentBriefWizardProps) {
  const [screen, setScreen] = useState<Screen>("angle");
  const [angle, setAngle] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [outcome, setOutcome] = useState("");
  const [showFull, setShowFull] = useState(false);

  const idx = Math.max(0, FLOW.indexOf(screen));
  const chosen = CAMPAIGN_ANGLES.find((a) => a.id === angle);

  const brief: CampaignBrief = useMemo(
    () => ({ angle, topic, audience, outcome }),
    [angle, topic, audience, outcome]
  );

  const full = useMemo(() => previewBrief(brief), [brief]);
  const summary = useMemo(() => summariseBrief(brief), [brief]);

  const chooseAngle = (id: string) => {
    setAngle(id);
    setScreen("refine");
  };

  const go = (delta: number) => {
    const next = FLOW[idx + delta];
    if (next) setScreen(next);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-12">
      <div className="mb-7 space-y-2.5 text-center">
        <h3 className="font-display text-[24px] font-bold tracking-[-0.015em] text-foreground">
          {HEADINGS[screen].title}
        </h3>
        <p className="mx-auto max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          {HEADINGS[screen].body}
        </p>
      </div>

      {/* No bar on the first screen: you have not started a path yet. */}
      {screen !== "angle" && (
        <div className="mb-7 flex items-center gap-1.5" aria-hidden="true">
          {FLOW.slice(1).map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i < idx ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      {screen === "angle" && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {CAMPAIGN_ANGLES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => chooseAngle(a.id)}
              className={cn(
                "group rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                angle === a.id
                  ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                  : "border-border/70 hover:border-primary/45 hover:bg-secondary/50 hover:shadow-[0_8px_20px_-14px_rgba(12,43,74,.4)]"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[14.5px] font-semibold text-foreground">{a.label}</span>
                <ArrowRight className="h-4 w-4 flex-none text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transform-none" />
              </span>
              <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">
                {a.blurb}
              </span>
              <span className="mt-2.5 flex flex-wrap gap-1">
                {a.chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-medium text-secondary-foreground"
                  >
                    {c}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}

      {screen === "refine" && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Topic</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              autoFocus
              /* The placeholder is written for the chosen angle, so the field
                 demonstrates the shape of a good answer rather than waiting. */
              placeholder={chosen?.placeholder}
              className="resize-none text-[15px]"
            />
            {chosen?.framing && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                We'll write it as a {chosen.label.toLowerCase()}.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">
              Who is it for{" "}
              <span className="font-normal text-muted-foreground">— optional</span>
            </Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. RevOps leads at 200-1000 person B2B SaaS"
              className="text-[15px]"
            />
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Leave this blank to use the ICP you set for this campaign.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">
              What should they do afterwards{" "}
              <span className="font-normal text-muted-foreground">— optional</span>
            </Label>
            <Select value={outcome || "none"} onValueChange={(v) => setOutcome(v === "none" ? "" : v)}>
              <SelectTrigger className="text-[15px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_OPTIONS.map((o) => (
                  <SelectItem key={o.value || "none"} value={o.value || "none"}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {screen === "review" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" /> The brief
            </p>
            <p className="text-[14.5px] leading-relaxed text-foreground">{summary}</p>

            {/*
              The exact text is available but folded away — the same treatment
              the presenter review uses. Proof of work is worth seeing once and
              tiring on every visit.
            */}
            <button
              type="button"
              onClick={() => setShowFull((v) => !v)}
              className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-primary"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", showFull && "rotate-180")}
              />
              {showFull ? "Hide" : "See"} exactly what we'll ask for
            </button>
            {showFull && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                {full}
              </p>
            )}
          </div>

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            This runs eight AI steps in order and takes a few minutes. You can close
            this and keep working — each section appears as it is ready.
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => go(-1)}
          disabled={idx === 0 || generating}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {screen === "refine" && (
          <Button onClick={() => go(1)} disabled={!topic.trim()} className="gap-1.5">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {screen === "review" && (
          <Button
            onClick={() => onGenerate(brief)}
            disabled={generating || !topic.trim()}
            className="gap-2"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {generating ? "Starting" : "Generate the campaign"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ContentBriefWizard;
