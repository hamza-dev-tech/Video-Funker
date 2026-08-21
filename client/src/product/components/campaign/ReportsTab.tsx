import { useEffect, useState } from "react";
import { Loader2, Target, FileText, Film, BarChart3, FileCheck } from "lucide-react";
import { fetchCampaignReport, CampaignReport } from "@product/lib/reports-api";
import { useToast } from "@product/hooks/use-toast";
import { EmptyState } from "@product/components/layout/EmptyState";
import { PageHeader } from "@product/components/layout/PageHeader";
import { Link } from "react-router-dom";
import { Button } from "@product/components/ui/button";

interface ReportsTabProps {
  campaignId: string;
}

/**
 * One headline number.
 *
 * The old card stacked a shadcn CardHeader on a CardContent to show a label and
 * a figure — four wrappers and two paddings for two lines of text, in `text-xs`
 * and `text-2xl` while the rest of the product uses the display face and an
 * explicit scale. This is the same shape as the metric tiles on the billing
 * screens, so the two read as one product.
 */
function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  note?: string | null;
}) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </p>
      <p className="mt-2.5 font-display text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums text-foreground">
        {value}
      </p>
      {note && <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{note}</p>}
    </div>
  );
}

/**
 * One stage of the campaign, and whether it has happened.
 *
 * The steps used to be three separate bordered boxes with a loose arrow glyph
 * between them, which reads as three cards rather than one journey. A single
 * rail behind the row, with the completed span drawn in the accent, makes the
 * progression the thing you see first.
 */
function FunnelStep({
  icon: Icon,
  label,
  value,
  done,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  done: boolean;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-2 text-center">
      <span
        className={
          done
            ? "relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
            : "relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground"
        }
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
          {label}
        </p>
        <p
          className={
            done
              ? "font-display text-[17px] font-bold tracking-[-0.01em] text-foreground"
              : "font-display text-[17px] font-bold tracking-[-0.01em] text-muted-foreground"
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function ReportsTab({ campaignId }: ReportsTabProps) {
  const { toast } = useToast();
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCampaignReport(campaignId)
      .then((data) => { if (active) setReport(data); })
      .catch(() => toast({ title: "Couldn't load the report", description: "Failed to load report.", variant: "destructive" }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [campaignId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-8 py-8">
        <EmptyState
          icon={BarChart3}
          title="Nothing to report yet"
          description="This fills in as the campaign moves — the ICP, the content written for it, and every video filmed."
        />
      </div>
    );
  }

  const hasAnyActivity =
    report.flags.icpCompleted ||
    report.flags.contentGenerated ||
    report.flags.videoCreated;

  if (!hasAnyActivity) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-8 py-8">
        <EmptyState
          icon={BarChart3}
          title="Nothing to report yet"
          description="Start with the ICP, generate the content, then film it. Each step shows up here as it lands."
          action={
            <Button asChild variant="cta" className="gap-2">
              <Link to="/icp">
                <Target className="h-4 w-4" />
                Start with the ICP
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8 space-y-6">
      <PageHeader
        eyebrow={report.campaign.name}
        title="Report"
        description="What this campaign has produced so far."
      />

      {/*
        Three numbers, one journey, one breakdown.

        This screen used to state the same figures four times over: a summary
        card, a funnel step, a row in the content breakdown, and a "Task Status"
        list that repeated the funnel's own done/not-done in words. Videos
        appeared three times. Saying a number once and clearly is what makes a
        report read as considered rather than padded.
      */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Metric
          icon={Target}
          label="ICP"
          value={report.icpCreated ? "Set" : "Not set"}
        />
        <Metric
          icon={FileText}
          label="Content sets"
          value={report.contentCount}
        />
        <Metric
          icon={Film}
          label="Videos ready"
          value={report.videoCount}
          note={
            report.videoBreakdown &&
            (report.videoBreakdown.rendering > 0 || report.videoBreakdown.failed > 0)
              ? [
                  report.videoBreakdown.rendering > 0 &&
                    `${report.videoBreakdown.rendering} still rendering`,
                  report.videoBreakdown.failed > 0 &&
                    `${report.videoBreakdown.failed} failed`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : null
          }
        />
      </div>

      <div className="rounded-[14px] border border-border/70 bg-card p-6">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Campaign funnel
        </p>
        <div className="relative">
          {/* The rail sits behind the tiles at their centre line, so the three
              stages read as one path rather than three unrelated cards. */}
          <span
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-[22px] h-px bg-border"
          />
          <div className="relative flex items-start gap-2">
            <FunnelStep
              icon={Target}
              label="ICP"
              value={report.icpCreated ? "Yes" : "No"}
              done={report.flags.icpCompleted}
            />
            <FunnelStep
              icon={FileText}
              label="Content"
              value={report.contentCount}
              done={report.flags.contentGenerated}
            />
            <FunnelStep
              icon={Film}
              label="Videos"
              value={report.videoCount}
              done={report.flags.videoCreated}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[14px] border border-border/70 bg-card p-6">
        <p className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <FileCheck className="h-3.5 w-3.5" strokeWidth={2} />
          What was written
        </p>
        <dl className="space-y-2.5 text-[14.5px]">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Articles</dt>
            <dd className="font-medium tabular-nums text-foreground">{report.articleCount}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Video scripts</dt>
            <dd className="font-medium tabular-nums text-foreground">{report.scriptCount}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Research briefs</dt>
            <dd className="font-medium tabular-nums text-foreground">{report.researchCount}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
