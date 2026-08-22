import { useEffect, useState } from "react";
import { Loader2, Target, FileText, Film, BarChart3, FileCheck, AlertTriangle, Check, X, Circle } from "lucide-react";
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

  const { campaign, brief, audience, sections, videos, videoBreakdown, attention } = report;
  const written = sections.filter((s) => s.status === "completed" && s.words > 0);
  const dot = " · ";

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 px-8 py-8">
      <PageHeader
        eyebrow={campaign.name}
        title="Report"
        description={`Started ${new Date(campaign.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.`}
      />

      {/*
        What still needs a person, first.

        A report that lists only successes hides the reason a campaign
        underperformed. Anything failed, cut off or missing is named here rather
        than folded into a total — and when nothing is wrong this block
        disappears rather than announcing "0 issues".
      */}
      {attention.length > 0 && (
        <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/[0.07] p-5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
            Needs attention
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {attention.map((a) => (
              <li key={a} className="flex items-start gap-2 text-[14.5px] leading-relaxed text-foreground">
                <span className="mt-[9px] h-1 w-1 flex-none rounded-full bg-amber-600" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Metric icon={FileCheck} label="Words written" value={report.totalWords.toLocaleString()} />
        <Metric icon={FileText} label="Assets" value={`${written.length} of ${sections.length}`} />
        <Metric
          icon={Film}
          label="Videos ready"
          value={videoBreakdown.ready}
          note={
            videoBreakdown.rendering || videoBreakdown.failed
              ? [
                  videoBreakdown.rendering > 0 && `${videoBreakdown.rendering} rendering`,
                  videoBreakdown.failed > 0 && `${videoBreakdown.failed} failed`,
                ]
                  .filter(Boolean)
                  .join(dot)
              : null
          }
        />
      </div>

      {/*
        The strategy behind the campaign.

        None of this was shown anywhere. A report that says "1 article" without
        saying what the article argued, or who it was for, is an inventory — you
        cannot judge the work from it, and you certainly cannot show it to
        anyone.
      */}
      {(brief || audience) && (
        <div className="rounded-[14px] border border-border/70 bg-card p-6">
          <p className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Target className="h-3.5 w-3.5" strokeWidth={2} />
            The argument
          </p>

          {brief?.topic && (
            <p className="font-display text-[19px] font-bold leading-snug tracking-[-0.015em] text-foreground">
              {brief.topic}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {brief?.angle && <Chip>{brief.angle}</Chip>}
            {audience?.industry && <Chip>{audience.industry}</Chip>}
            {audience?.companySize && <Chip>{audience.companySize}</Chip>}
            {brief?.outcome && <Chip>So they {brief.outcome}</Chip>}
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-3 border-t border-border/70 pt-4 text-[14.5px] sm:grid-cols-2">
            {(brief?.audience || audience?.roles?.length) && (
              <div>
                <dt className="text-[12.5px] text-muted-foreground">Written for</dt>
                <dd className="mt-0.5 leading-relaxed text-foreground">
                  {brief?.audience || audience!.roles.join(", ")}
                </dd>
              </div>
            )}
            {audience?.solution && (
              <div>
                <dt className="text-[12.5px] text-muted-foreground">What we sell</dt>
                <dd className="mt-0.5 leading-relaxed text-foreground">{audience.solution}</dd>
              </div>
            )}
            {audience?.painPoints?.length ? (
              <div className="sm:col-span-2">
                <dt className="text-[12.5px] text-muted-foreground">Their problem</dt>
                <dd className="mt-0.5 leading-relaxed text-foreground">
                  {audience.painPoints.join(dot)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}

      {/* Every asset, its length, and a way to open it. */}
      {sections.length > 0 && (
        <div className="rounded-[14px] border border-border/70 bg-card p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              What was written
            </p>
            <Link to="/content" className="text-[12.5px] font-semibold text-primary">
              Open the content
            </Link>
          </div>

          <ul className="divide-y divide-border/70">
            {sections.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  {s.status === "completed" ? (
                    <Check className="h-3.5 w-3.5 flex-none text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  ) : s.status === "failed" ? (
                    <X className="h-3.5 w-3.5 flex-none text-destructive" strokeWidth={2.5} />
                  ) : (
                    <Circle className="h-3.5 w-3.5 flex-none text-muted-foreground/50" />
                  )}
                  <span className="truncate text-[14.5px] text-foreground">{s.label}</span>
                  {s.truncated && (
                    <span className="flex-none rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      cut off
                    </span>
                  )}
                </span>
                <span className="flex-none text-[13px] tabular-nums text-muted-foreground">
                  {s.words ? `${s.words.toLocaleString()} words` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The videos themselves, not a count of them. */}
      {videos.length > 0 && (
        <div className="rounded-[14px] border border-border/70 bg-card p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Film className="h-3.5 w-3.5" strokeWidth={2} />
              Filmed
            </p>
            <Link to="/film" className="text-[12.5px] font-semibold text-primary">
              Open the library
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((v) => (
              <div key={v.id} className="flex gap-3 rounded-xl border border-border/70 p-3">
                <div className="h-16 w-24 flex-none overflow-hidden rounded-lg bg-[#0d1b2a]">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-white/40">
                      <Film className="h-5 w-5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {v.title || "Untitled"}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {v.status === "completed"
                      ? `${v.duration ? Math.round(v.duration) + "s" : "Ready"}${v.captions ? dot + "subtitled" : ""}`
                      : v.status === "failed"
                        ? v.failureReason || "Failed"
                        : "Still rendering"}
                  </p>
                  {v.exactScript && (
                    <p className="mt-1 text-[11.5px] text-muted-foreground">Your script, word for word</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*
        Said plainly, because the alternative is letting someone assume this
        page knows something it does not. Nothing in the product measures what
        happens after a video is published.
      */}
      <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
        This report covers what the campaign produced. Views, replies and meetings
        are not tracked yet — nothing here measures what happens after you publish.
      </p>
    </div>
  );
}

/** Small factual label. Same shape as the chips on the recipe cards. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 text-[12px] font-medium text-secondary-foreground">
      {children}
    </span>
  );
}
