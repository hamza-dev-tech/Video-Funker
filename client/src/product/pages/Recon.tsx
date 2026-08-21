import { useState, useEffect } from "react";
import { MainLayout } from "@product/components/layout/MainLayout";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Card, CardContent } from "@product/components/ui/card";
import { Badge } from "@product/components/ui/badge";
import { ScrollArea } from "@product/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@product/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@product/components/ui/dialog";
import {
  ArrowLeft, Search, Loader2, RefreshCw, FileText, Brain, Target, Database,
  Users, Zap, CheckCircle2, Clock, Eye, Sparkles, ChevronRight, AlertCircle,
  Download, Lock, Building2, MessageSquare, ShieldAlert, KeyRound, Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  processICPWithAI, downloadReconReport,
  ICPProfileWithRecon, ReconInsightData, ReconInsightContent,
  ProspectResearchData, isProspectResearch, normalizeInsightContent,
} from "@product/lib/recon-api";
import { fetchCampaigns, fetchICPByCampaign } from "@product/lib/api";
import { apiGet } from "@product/lib/api-client";
import { useToast } from "@product/hooks/use-toast";
import { cn } from "@product/lib/utils";
import { EmptyState } from "@product/components/layout/EmptyState";

// Build recon profiles from campaigns
async function loadReconProfiles(): Promise<ICPProfileWithRecon[]> {
  const [campaigns, reconInsights] = await Promise.all([
    fetchCampaigns(),
    apiGet<any[]>('/recon').catch(() => []),
  ]);

  /*
    One round trip per campaign, but all at once.

    This was a sequential for-loop with an await inside, so a twenty-campaign
    account made twenty-one requests one after another before anything appeared
    — and did it again after every generation and every Refresh. In parallel the
    wall-clock cost is the slowest single request rather than the sum of all of
    them.

    Each is still isolated: a campaign with no ICP yet resolves to null instead
    of failing the whole list, which is what the original try/catch did.
  */
  const settled = await Promise.all(
    campaigns.map(async (campaign): Promise<ICPProfileWithRecon | null> => {
      try {
        const icp = await fetchICPByCampaign(campaign.id);
        const insight = (reconInsights || []).find((i: any) => i.icpId === icp.id);
        return {
          id: icp.id,
          name: icp.name,
          status: icp.status,
          campaignId: icp.campaignId,
          data: icp.data,
          generatedFilePath: icp.generatedFilePath,
          createdAt: icp.createdAt,
          updatedAt: icp.updatedAt,
          reconStatus: insight ? 'generated' : 'pending',
          reconInsight: insight ? {
            id: insight._id || insight.id,
            icpId: insight.icpId,
            data: normalizeInsightContent(insight.insights),
            documentHash: insight.documentHash || '',
            processedAt: insight.processedAt || '',
            updatedAt: insight.updatedAt,
            regenerationCount: insight.regenerationCount ?? 0,
            maxRegenerations: insight.maxRegenerations ?? 5,
            reportFilePath: insight.reportFilePath ?? null,
            reportGeneratedAt: insight.reportGeneratedAt ?? null,
          } : null,
          lastProcessedAt: insight?.processedAt || null,
        };
      } catch {
        // No ICP for this campaign yet.
        return null;
      }
    })
  );

  const results = settled.filter((r): r is ICPProfileWithRecon => r !== null);

  return results;
}

export default function Recon() {
  const [profiles, setProfiles] = useState<ICPProfileWithRecon[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ICPProfileWithRecon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  /*
    Seconds spent waiting.

    The whole AI call happens inside one open request and takes 20-60 seconds,
    and the only feedback was a spinning icon inside a button. There was no way
    to tell "working" from "hung", so people reloaded — and on reload the server
    finishes and saves anyway while the screen still says Pending, meaning they
    paid and appeared to get nothing.
  */
  const [processingFor, setProcessingFor] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInsightTab, setActiveInsightTab] = useState("prospect");
  const [previewData, setPreviewData] = useState<{ title: string; data: unknown } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async (): Promise<ICPProfileWithRecon[]> => {
    try {
      setIsLoading(true);
      const data = await loadReconProfiles();
      setProfiles(data);
      // Keep the detail panel bound to the latest data for the selected profile.
      setSelectedProfile((prev) => (prev ? data.find((p) => p.id === prev.id) ?? prev : prev));
      return data;
    } catch {
      toast({ title: "Couldn't load ICP profiles", description: "Failed to load ICP profiles.", variant: "destructive" });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessICP = async (profile: ICPProfileWithRecon) => {
    let ticker: ReturnType<typeof setInterval> | null = null;
    try {
      setIsProcessing(true);
      setProcessingFor(0);
      ticker = setInterval(() => setProcessingFor((n) => n + 1), 1000);
      await processICPWithAI(profile.id);
      const data = await loadProfiles();
      const updated = data.find((p) => p.id === profile.id);
      if (updated) setSelectedProfile(updated);
      toast({ title: "Processing Complete", description: `Insights generated for ${profile.name}` });
    } catch (err) {
      toast({ title: "Processing Failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      if (ticker) clearInterval(ticker);
      setIsProcessing(false);
    }
  };

  const handleDownloadReport = async (profile: ICPProfileWithRecon) => {
    try {
      setIsDownloading(true);
      await downloadReconReport(profile.id, `prospect-research-${profile.name.replace(/\s+/g, '-').toLowerCase()}.txt`);
    } catch (err) {
      toast({ title: "Download Failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = {
    total: profiles.length,
    generated: profiles.filter((p) => p.reconStatus === "generated").length,
    pending: profiles.filter((p) => p.reconStatus === "pending").length,
  };

  const getStatusBadge = (status: ICPProfileWithRecon["reconStatus"]) => {
    if (status === "generated") return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Generated</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const renderInsights = (data: ReconInsightContent) => (
    isProspectResearch(data)
      ? <ProspectResearchView data={data} />
      : renderLegacyInsightPreview(data as ReconInsightData)
  );

  const renderLegacyInsightPreview = (insight: ReconInsightData) => (
    <Tabs value={activeInsightTab} onValueChange={setActiveInsightTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="prospect" className="text-xs"><Target className="w-3 h-3 mr-1" />Prospect</TabsTrigger>
        <TabsTrigger value="enrichment" className="text-xs"><Database className="w-3 h-3 mr-1" />Enrichment</TabsTrigger>
        <TabsTrigger value="segments" className="text-xs"><Users className="w-3 h-3 mr-1" />Segments</TabsTrigger>
        <TabsTrigger value="intent" className="text-xs"><Zap className="w-3 h-3 mr-1" />Intent</TabsTrigger>
      </TabsList>

      <TabsContent value="prospect" className="mt-4 space-y-4">
        <InsightCard title="Search Queries" items={insight.prospectSearch.searchQueries} onPreview={() => setPreviewData({ title: "Prospect Search", data: insight.prospectSearch })} />
        <InsightCard title="LinkedIn Filters" items={[
          `Industries: ${insight.prospectSearch.linkedInFilters.industries.join(", ")}`,
          `Titles: ${insight.prospectSearch.linkedInFilters.titles.join(", ")}`,
          `Regions: ${insight.prospectSearch.linkedInFilters.regions.join(", ")}`,
        ]} />
      </TabsContent>

      <TabsContent value="enrichment" className="mt-4 space-y-4">
        <InsightCard title="Required Fields" items={insight.dataEnrichment.requiredFields} onPreview={() => setPreviewData({ title: "Data Enrichment", data: insight.dataEnrichment })} />
        <InsightCard title="Qualification Criteria" items={[
          `Must Have: ${insight.dataEnrichment.qualificationCriteria.mustHave.length} criteria`,
          `Nice to Have: ${insight.dataEnrichment.qualificationCriteria.niceToHave.length} criteria`,
          `Disqualifiers: ${insight.dataEnrichment.qualificationCriteria.disqualifiers.length} criteria`,
        ]} />
      </TabsContent>

      <TabsContent value="segments" className="mt-4 space-y-4">
        {insight.segmentation.segments.map((segment, i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{segment.name}</span>
              <Badge variant="outline" className={segment.priority === "high" ? "border-red-500/50 text-red-500" : segment.priority === "medium" ? "border-amber-500/50 text-amber-500" : "border-muted-foreground/50"}>{segment.priority}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{segment.description}</p>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setPreviewData({ title: "Segmentation", data: insight.segmentation })}>
          <Eye className="w-3 h-3 mr-1" />View Full Data
        </Button>
      </TabsContent>

      <TabsContent value="intent" className="mt-4 space-y-4">
        <InsightCard title="Intent Signals" items={insight.intentFiltering.intentSignals.map((s) => `${s.signal} (${s.weight})`)} onPreview={() => setPreviewData({ title: "Intent Filtering", data: insight.intentFiltering })} />
        <InsightCard title="Trigger Events" items={insight.intentFiltering.triggerEvents} />
      </TabsContent>
    </Tabs>
  );

  return (
    <MainLayout bleed>
      <div className="flex flex-col h-screen">
        {/* Same bar as the campaign screens: an icon tile, the name in the
            display face, the one action on the right. "Recon Main" was an
            internal name — nobody outside the codebase knows what Main meant. */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-8 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button asChild variant="ghost" size="icon" className="-ml-2 flex-none">
              <Link to="/" aria-label="Back to campaigns"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Brain className="h-[15px] w-[15px]" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[17px] font-bold tracking-[-0.01em] text-foreground">
                Prospect research
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadProfiles} className="flex-none gap-2">
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
        </header>

        {/* The counts, as badges rather than coloured bare numbers. Emerald and
            amber text on a tinted strip was three different greys' worth of
            contrast and no shared shape. */}
        <div className="shrink-0 border-b border-border bg-secondary/40 px-8 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{stats.total} profiles</Badge>
            <Badge variant="success">{stats.generated} generated</Badge>
            <Badge variant="warning">{stats.pending} pending</Badge>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="px-2 py-12 text-center">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-foreground">
                      {searchQuery ? "Nothing matches that" : "No ICPs yet"}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-[26ch] text-[13px] leading-relaxed text-muted-foreground">
                      {searchQuery
                        ? "Try a shorter search, or clear it to see them all."
                        : "Build an ICP on a campaign and it appears here, ready to research."}
                    </p>
                  </div>
                ) : (
                  filteredProfiles.map((profile) => (
                    /*
                      A button, not a Card wrapping a div with an onClick.

                      The row was not focusable and not reachable by keyboard,
                      and it used the generic shadcn Card scale (`font-medium`,
                      `text-xs`) rather than the explicit type scale the rest of
                      the product is set on. Selection now reads as selection —
                      a ring and a tinted ground, the same treatment as the
                      presenter picker and the recipe cards.
                    */
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setSelectedProfile(profile)}
                      aria-current={selectedProfile?.id === profile.id}
                      className={cn(
                        "group w-full rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        selectedProfile?.id === profile.id
                          ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                          : "border-border/70 bg-card hover:border-primary/45 hover:bg-secondary/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-semibold text-foreground">
                            {profile.name}
                          </p>
                          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                            {profile.data.industry || "No industry set"}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {getStatusBadge(profile.reconStatus)}
                            {profile.generatedFilePath && (
                              <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-medium text-secondary-foreground">
                                <FileText className="h-3 w-3" />Report
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 flex-none text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 bg-background overflow-hidden">
            {selectedProfile ? (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-[22px] font-bold tracking-[-0.018em] text-foreground">{selectedProfile.name}</h2>
                      <p className="mt-1 text-[14px] text-muted-foreground">{selectedProfile.data.industry || "No industry set"} · {selectedProfile.data.companySize || "No size set"}</p>
                    </div>
                    {(() => {
                      const used = selectedProfile.reconInsight?.regenerationCount ?? 0;
                      const max = selectedProfile.reconInsight?.maxRegenerations ?? 5;
                      const limitReached = !!selectedProfile.reconInsight && used >= max;
                      const hasInsight = !!selectedProfile.reconInsight;
                      return (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {hasInsight && (
                              <Button
                                variant="outline"
                                onClick={() => handleDownloadReport(selectedProfile)}
                                disabled={isDownloading}
                                className="gap-2"
                              >
                                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Download Report
                              </Button>
                            )}
                            <Button onClick={() => handleProcessICP(selectedProfile)} disabled={isProcessing || limitReached} className="gap-2">
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : limitReached ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                              {isProcessing
                                ? `Researching… ${processingFor}s`
                                : limitReached
                                  ? "Regeneration Limit Reached"
                                  : hasInsight
                                    ? "Regenerate Insights"
                                    : "Process with AI"}
                            </Button>
                          </div>
                          {hasInsight && (
                            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                              <span>Recon Generations Used: <strong className="text-foreground">{used} / {max}</strong></span>
                              {limitReached && <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Limit Reached</Badge>}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {/*
                    Warn about the thing that actually matters.

                    This used to say "Generate an ICP document first" — but the
                    recon prompt never reads that document. It is built from the
                    ICP fields. So the warning nagged about an irrelevant step
                    while the prerequisite that does matter — whether the ICP has
                    any content at all — was checked nowhere, and an empty ICP
                    happily produced ten lines of "N/A" from a paid call.

                    It also flags research that predates the current ICP, using
                    the documentHash the server was already computing, storing
                    and sending and which nothing ever compared.
                  */}
                  {(() => {
                    const d: any = selectedProfile.data || {};
                    const thin =
                      !d.industry || !d.companySize || !(d.roles?.length);

                    /*
                      Compared by time, not by re-deriving the server's hash.

                      The server hashes its own Mongoose subdocument, whose JSON
                      key order and field set need not match what arrives here,
                      so recomputing it in the browser would report "stale" on
                      unchanged data and nag forever. "The ICP was saved after
                      this research ran" asks the same question in a way that
                      cannot drift. The minute of slack absorbs the gap between
                      a save and the generation it triggers.
                    */
                    const processedAt = selectedProfile.reconInsight?.processedAt;
                    const icpUpdatedAt = selectedProfile.updatedAt;
                    const stale =
                      !!processedAt &&
                      !!icpUpdatedAt &&
                      new Date(icpUpdatedAt).getTime() - new Date(processedAt).getTime() > 60_000;

                    if (thin) {
                      return (
                        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 flex-none text-amber-500" />
                          <p className="text-[14px] leading-relaxed text-amber-700 dark:text-amber-400">
                            This ICP is missing industry, company size or target roles.
                            Research built from it will be generic — fill those in first.
                          </p>
                        </div>
                      );
                    }

                    if (stale) {
                      return (
                        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 flex-none text-amber-500" />
                          <p className="text-[14px] leading-relaxed text-amber-700 dark:text-amber-400">
                            Your ICP has changed since this research was generated.
                            Regenerate to bring it up to date.
                          </p>
                        </div>
                      );
                    }

                    if (selectedProfile.generatedFilePath) {
                      return (
                        <div className="mt-4 p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
                          <FileText className="w-5 h-5 flex-none text-primary" />
                          <p className="truncate text-[14px] font-medium text-foreground">{selectedProfile.generatedFilePath}</p>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
                <ScrollArea className="flex-1 p-6">
                  {selectedProfile.reconInsight ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center gap-2 font-display text-[16px] font-bold tracking-[-0.01em] text-foreground"><Brain className="h-4 w-4 text-primary" />Prospect research</h3>
                        <span className="text-[12.5px] text-muted-foreground">Processed {new Date(selectedProfile.reconInsight.processedAt).toLocaleString()}</span>
                      </div>
                      {renderInsights(selectedProfile.reconInsight.data)}
                    </div>
                  ) : (
                    /* The shared empty state, so this reads like the rest of
                       the product rather than a floating grey icon. */
                    <EmptyState
                      icon={Brain}
                      title="No research yet"
                      description="We'll read this ICP and come back with the companies to target, who decides, what they object to, and how to open."
                      action={
                        <Button
                          onClick={() => handleProcessICP(selectedProfile)}
                          disabled={isProcessing}
                          className="gap-2"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          {isProcessing ? `Researching… ${processingFor}s` : "Research this ICP"}
                        </Button>
                      }
                    />
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <div className="max-w-[34ch] text-center">
                  <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Brain className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-display text-[19px] font-bold tracking-[-0.01em] text-foreground">
                    Pick an ICP
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                    Choose one from the list to see its research, or to run it for the first time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>{previewData?.title}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="overflow-x-auto rounded-xl border border-border/70 bg-secondary/60 p-4 font-mono text-[12px] leading-relaxed">{JSON.stringify(previewData?.data, null, 2)}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function InsightCard({ title, items, onPreview }: { title: string; items: string[]; onPreview?: () => void }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {onPreview && <Button variant="ghost" size="sm" onClick={onPreview} className="h-6 px-2"><Eye className="w-3 h-3" /></Button>}
      </div>
      <ul className="space-y-1">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span><span className="line-clamp-2">{item}</span></li>
        ))}
        {items.length > 5 && <li className="text-xs text-primary">+{items.length - 5} more</li>}
      </ul>
    </div>
  );
}

function SectionCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    /*
      This is the research the customer paid for, so it is set as a document
      rather than as UI chrome: the section name becomes a small tracked label,
      the body gets a readable measure, and the card takes the same radius and
      border weight as every other surface in the product.
    */
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return <p className="text-[13.5px] italic text-muted-foreground">No items provided.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-foreground/85">
          <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PersonaList({ personas }: { personas: ProspectResearchData["buyerPersonas"] }) {
  if (!personas || personas.length === 0) {
    return <p className="text-[13.5px] italic text-muted-foreground">No personas provided.</p>;
  }
  return (
    <div className="space-y-3">
      {personas.map((p, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-border/70 bg-secondary/40 p-3.5">
          <div className="text-[14px] leading-relaxed">
            <span className="font-semibold text-foreground">Role: </span>
            <span className="text-muted-foreground">{p.role || "N/A"}</span>
          </div>
          <div className="text-[14px] leading-relaxed">
            <span className="font-semibold text-foreground">Goals: </span>
            <span className="text-muted-foreground">{p.goals || "N/A"}</span>
          </div>
          <div className="text-[14px] leading-relaxed">
            <span className="font-semibold text-foreground">What They Care About: </span>
            <span className="text-muted-foreground">{p.whatTheyCareAbout || "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectionList({ objections }: { objections: ProspectResearchData["commonObjections"] }) {
  if (!objections || objections.length === 0) {
    return <p className="text-[13.5px] italic text-muted-foreground">No objections provided.</p>;
  }
  return (
    <div className="space-y-3">
      {objections.map((o, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-border/70 bg-secondary/40 p-3.5">
          <div className="text-[14px] leading-relaxed">
            <span className="font-semibold text-foreground">Objection: </span>
            <span className="text-muted-foreground">{o.objection || "N/A"}</span>
          </div>
          <div className="text-[14px] leading-relaxed">
            <span className="font-semibold text-foreground">Recommended Response: </span>
            <span className="text-muted-foreground">{o.response || "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProspectResearchView({ data }: { data: ProspectResearchData }) {
  return (
    <div className="space-y-4">
      <SectionCard icon={<FileText className="w-4 h-4" />} title="Executive Summary">
        <p className="max-w-[68ch] text-[15px] leading-relaxed text-foreground/90">
          {data.executiveSummary || "No summary provided."}
        </p>
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard icon={<Building2 className="w-4 h-4" />} title="Ideal Companies">
          <BulletList items={data.idealCompanies} />
        </SectionCard>
        <SectionCard icon={<Users className="w-4 h-4" />} title="Buyer Personas">
          <PersonaList personas={data.buyerPersonas} />
        </SectionCard>
        <SectionCard icon={<Zap className="w-4 h-4" />} title="Buying Triggers">
          <BulletList items={data.buyingTriggers} />
        </SectionCard>
        <SectionCard icon={<ShieldAlert className="w-4 h-4" />} title="Common Objections">
          <ObjectionList objections={data.commonObjections} />
        </SectionCard>
      </div>

      <SectionCard icon={<KeyRound className="w-4 h-4" />} title="Prospecting Keywords">
        {data.prospectingKeywords?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.prospectingKeywords.map((kw, i) => (
              <Badge key={i} variant="outline" className="text-[12px] font-normal">{kw}</Badge>
            ))}
          </div>
        ) : <p className="text-[13.5px] italic text-muted-foreground">No keywords provided.</p>}
      </SectionCard>

      <SectionCard icon={<Target className="w-4 h-4" />} title="Targeting Strategy">
        <div className="space-y-3 text-[14.5px] leading-relaxed">
          <div>
            <span className="font-medium text-foreground">Primary Audience: </span>
            <span className="text-muted-foreground">{data.targetingStrategy?.primaryAudience || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">Secondary Audience: </span>
            <span className="text-muted-foreground">{data.targetingStrategy?.secondaryAudience || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium text-foreground block mb-1">Channels:</span>
            {data.targetingStrategy?.channels?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.targetingStrategy.channels.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-[12px] font-normal">{c}</Badge>
                ))}
              </div>
            ) : <span className="text-[13.5px] italic text-muted-foreground">N/A</span>}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<Send className="w-4 h-4" />} title="Outreach Recommendations">
        <BulletList items={data.outreachRecommendations} />
      </SectionCard>
    </div>
  );
}
