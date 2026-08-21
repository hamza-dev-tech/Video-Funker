import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Link } from "react-router-dom";
import { EmptyState } from "@product/components/layout/EmptyState";
import { Card, CardContent } from "@product/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@product/components/ui/tabs";
import { ScrollArea } from "@product/components/ui/scroll-area";
import { Badge } from "@product/components/ui/badge";
import { Progress } from "@product/components/ui/progress";
import { Skeleton } from "@product/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@product/components/ui/tooltip";
import { Loader2, FileText, Film, MessageSquare, Search, RefreshCw, AlertTriangle, Send, Copy, Pencil, Linkedin, Image as ImageIcon, CheckCircle2, Circle, XCircle, Target } from "lucide-react";
import { useToast } from "@product/hooks/use-toast";
import { RegenerateAllDialog } from "@product/components/campaign/RegenerateAllDialog";
import { ContentBriefWizard } from "@product/components/campaign/ContentBriefWizard";
import type { CampaignBrief } from "@product/components/campaign/campaignAngles";
import {
  fetchContent,
  generateContent,
  regenerateSection,
  ContentData,
  SectionKey,
  SectionStatus,
} from "@product/lib/content-api";
import { useVerification } from "@product/context/VerificationProvider";
import { EditScriptModal } from "@product/components/campaign/EditScriptModal";

interface ContentTabProps {
  campaignId: string;
  hasIcp: boolean;
}

interface TabDef {
  value: string;
  key: SectionKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  field: keyof ContentData;
  editable?: boolean;
}

const TABS: TabDef[] = [
  { value: "research", key: "research", label: "Research", shortLabel: "Research", icon: Search, field: "research" },
  { value: "article", key: "article", label: "Article", shortLabel: "Article", icon: FileText, field: "article" },
  { value: "script", key: "videoScript", label: "Video Script", shortLabel: "Video Script", icon: Film, field: "script", editable: true },
  { value: "captions", key: "captions", label: "Captions", shortLabel: "Captions", icon: MessageSquare, field: "captionsText" },
  { value: "linkedinPosts", key: "linkedinPosts", label: "LinkedIn Posts", shortLabel: "LinkedIn Posts", icon: Linkedin, field: "linkedinPosts" },
  { value: "outboundScripts", key: "outboundScripts", label: "Outbound Scripts", shortLabel: "Outbound", icon: Send, field: "outboundScripts" },
  { value: "linkedinImage", key: "linkedinImage", label: "LinkedIn Image", shortLabel: "LinkedIn Image", icon: ImageIcon, field: "linkedinImagePrompt" },
  { value: "longForm", key: "longForm", label: "Long Form Post", shortLabel: "Long Form", icon: FileText, field: "longFormPost" },
];

export function ContentTab({ campaignId, hasIcp }: ContentTabProps) {
  const { toast } = useToast();
  const { requireVerifiedEmail } = useVerification();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  /* Separate from `content === null`, which means "none generated yet". */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [regenAllOpen, setRegenAllOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("research");
  const [editOpen, setEditOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStatus = useCallback(
    (data: ContentData | null, key: SectionKey): SectionStatus => {
      if (!data) return "pending";
      const s = data.sections?.[key]?.status;
      if (s) return s;
      // Legacy docs without a sections map: treat present content as completed.
      const tab = TABS.find((t) => t.key === key);
      const value = tab ? (data[tab.field] as string | undefined) : "";
      return value ? "completed" : "pending";
    },
    []
  );

  const hasActiveGeneration = useCallback(
    (data: ContentData | null) =>
      !!data && TABS.some((t) => {
        const s = getStatus(data, t.key);
        return s === "pending" || s === "processing";
      }),
    [getStatus]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchContent(campaignId);
        setContent(data);
        if (!hasActiveGeneration(data)) stopPolling();
      } catch {
        /* keep polling; transient errors are non-fatal */
      }
    }, 3000);
  }, [campaignId, hasActiveGeneration, stopPolling]);

  useEffect(() => {
    loadContent();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    if (content && hasActiveGeneration(content)) startPolling();
    else stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const loadContent = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchContent(campaignId);
      setContent(data);
      setTopic(data.topic || "");
    } catch (err: any) {
      /*
        A 500 and "this campaign has no content yet" are completely different
        situations that used to produce identical screens, because both ended
        with content === null. Only a 404 means the content genuinely does not
        exist; anything else is a failure and has to say so.
      */
      if (err?.status === 404) {
        setContent(null);
        setLoadError(null);
      } else {
        setLoadError(err?.message || "Something went wrong while loading this content.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (overrideTopic?: string, brief?: CampaignBrief) =>
    requireVerifiedEmail(async () => {
      const useTopic = (overrideTopic ?? topic).trim();
      if (!useTopic) {
        toast({ title: "Add a topic first", description: "Please enter a topic.", variant: "destructive" });
        return;
      }
      setGenerating(true);
      try {
        const data = await generateContent(
          campaignId,
          useTopic,
          brief ? { angle: brief.angle, audience: brief.audience, outcome: brief.outcome } : undefined,
        );
        setTopic(useTopic);
        setRegenAllOpen(false);
        setContent(data);
        setActiveTab("research");
        toast({ title: "Generation started", description: "Content is being generated. You'll see each section appear as it's ready." });
      } catch (err: any) {
        toast({ title: "Couldn't start generating", description: err.message || "Failed to start generation.", variant: "destructive" });
      } finally {
        setGenerating(false);
      }
    });

  const handleRegenerateSection = (key: SectionKey) =>
    requireVerifiedEmail(async () => {
      try {
        const data = await regenerateSection(campaignId, key);
        setContent(data);
        toast({ title: "Regenerating", description: "This section is being regenerated." });
      } catch (err: any) {
        toast({ title: "Couldn't regenerate", description: err.message || "Failed to regenerate.", variant: "destructive" });
      }
    });

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text || "").then(
      () => toast({ title: "Copied", description: `${label} copied to clipboard.` }),
      () => toast({ title: "Couldn't copy", description: "Failed to copy.", variant: "destructive" }),
    );
  };

  if (!hasIcp) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-8 py-8">
        <EmptyState
          icon={Target}
          title="Build the ICP first"
          description="Everything written here is aimed at a specific audience. Define who that is and the content follows."
          action={
            <Button asChild variant="cta" className="gap-2">
              <Link to="/icp">
                <Target className="h-4 w-4" />
                Go to ICP
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    /*
      Was: fall through to the topic-entry screen below, which is the first-run
      state. A campaign with a finished article, script, captions and posts
      looked brand new, and the obvious action — type a topic and generate —
      would have overwritten work that was never actually lost.
    */
    return (
      <div className="mx-auto w-full max-w-[1180px] px-8 py-8">
        <EmptyState
          variant="error"
          icon={AlertTriangle}
          title="Couldn't load this campaign's content"
          description={loadError}
          action={
            <Button variant="outline" onClick={loadContent} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (!content) {
    /*
      A three-step brief, not a single text box.

      The whole input surface for eight AI calls used to be one Input reading
      "Enter topic" — typing `x` passed validation and started the run. The
      wizard asks for the stance, the specifics, and shows what will be asked
      for before anything is spent.
    */
    return (
      <ContentBriefWizard
        generating={generating}
        onGenerate={(brief) => handleGenerate(brief.topic, brief)}
      />
    );
  }

  const regenUsed = content.regenerationCount ?? 0;
  const regenMax = content.maxRegenerations ?? 5;
  const regenRemaining = Math.max(regenMax - regenUsed, 0);
  const regenLimitReached = regenUsed >= regenMax;
  const busy = hasActiveGeneration(content);

  const completedCount = TABS.filter((t) => getStatus(content, t.key) === "completed").length;

  const copyActiveTab = () => {
    const tab = TABS.find((t) => t.value === activeTab);
    if (!tab) return;
    copyText(tab.label, (content[tab.field] as string) || "");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 px-6 py-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/*
            The topic set as the page's subject, not as a labelled field.

            "Topic: " prefixed onto a `font-semibold` line made the campaign's
            actual subject read as metadata. It is the one thing this whole
            screen is about, so it takes the display face and the eyebrow above
            it carries the label instead.
          */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Topic
          </p>
          <h3 className="mt-1 font-display text-[19px] font-bold leading-snug tracking-[-0.015em] text-foreground">
            {content.topic}
          </h3>
          {/* With the time, not just the date. A run that finished ninety
              seconds ago and one from this morning read identically before. */}
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            Generated{" "}
            {new Date(content.updatedAt).toLocaleString(undefined, {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-medium text-muted-foreground">
              {regenUsed} of {regenMax} regenerations used
            </span>
            {regenLimitReached ? (
              <Badge variant="destructive">Limit Reached</Badge>
            ) : (
              <Badge variant="secondary">{regenRemaining} remaining</Badge>
            )}
          </div>
          <Progress value={(regenUsed / regenMax) * 100} className="h-1.5 w-40" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    /* Opens a dialog rather than firing. This blanks nine
                       fields on the server before generating anything. */
                    onClick={() => setRegenAllOpen(true)}
                    disabled={generating || busy || regenLimitReached}
                    className="gap-2"
                  >
                    {generating || busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {regenLimitReached ? "Regeneration Limit Reached" : "Regenerate All"}
                  </Button>
                </span>
              </TooltipTrigger>
              {regenLimitReached && (
                <TooltipContent>You have used all {regenMax} regenerations for this campaign.</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Generation progress
          </span>
          <span className="text-[12.5px] tabular-nums text-muted-foreground">
            {completedCount} of {TABS.length} done
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {TABS.map((t) => {
            const status = getStatus(content, t.key);
            return (
              <div key={t.key} className="flex items-center gap-1.5 text-[12.5px]">
                {status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                {status === "processing" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                {status === "pending" && <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />}
                {status === "failed" && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                <span className={status === "completed" ? "text-foreground" : "text-muted-foreground"}>
                  {t.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-6 border-b border-border overflow-x-auto">
          <TabsList className="bg-transparent h-10 p-0 gap-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="gap-1.5 whitespace-nowrap rounded-none px-3 text-[13px] font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Icon className="w-3 h-3" /> {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TABS.map((t) => {
          const status = getStatus(content, t.key);
          const text = (content[t.field] as string) || "";
          const error = content.sections?.[t.key]?.error;
          return (
            <TabsContent key={t.value} value={t.value} className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-end gap-1">
                    {t.editable && status === "completed" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Video Script</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={copyActiveTab}
                            disabled={status !== "completed" || !text}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Content</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRegenerateSection(t.key)}
                            disabled={status === "processing" || status === "pending"}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate {t.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      {status === "completed" && (
                        <>
                          {/*
                            Cut-off output used to be stored as completed with a
                            green tick and no warning, so a LinkedIn plan asked
                            for eight posts and stopped at five looked finished.
                          */}
                          {content.sections?.[t.key]?.truncated && (
                            <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3">
                              <AlertTriangle className="mt-px h-4 w-4 flex-none text-amber-600 dark:text-amber-400" strokeWidth={2} />
                              <p className="text-[13px] leading-relaxed text-foreground/85">
                                This stopped at the length limit, so the ending is missing.
                                Regenerate this section to get the full version.
                              </p>
                            </div>
                          )}
                          <pre className="max-w-[72ch] whitespace-pre-wrap font-sans text-[15px] leading-[1.7] text-foreground">
                            {text || "No content generated."}
                          </pre>
                        </>
                      )}

                      {status === "processing" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Writing this section&hellip;
                          </div>
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      )}

                      {status === "pending" && (
                        <div className="flex items-center justify-center gap-2 py-8 text-[14px] text-muted-foreground">
                          <Circle className="h-4 w-4" /> Waiting for the step before this one.
                        </div>
                      )}

                      {status === "failed" && (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                          <XCircle className="w-8 h-8 text-destructive" />
                          <p className="text-[15px] font-semibold text-foreground">
                            {error?.startsWith("Waiting on") ? "Not generated" : "Generation failed"}
                          </p>
                          {error && (
                            <p className="max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
                              {error}
                            </p>
                          )}
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => handleRegenerateSection(t.key)}>
                            <RefreshCw className="w-4 h-4" /> Retry
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>

      <EditScriptModal
        open={editOpen}
        onOpenChange={setEditOpen}
        campaignId={campaignId}
        script={content.script || ""}
        onSaved={(updated) => setContent(updated)}
      />

      <RegenerateAllDialog
        open={regenAllOpen}
        onOpenChange={setRegenAllOpen}
        currentTopic={content.topic || topic}
        /* Only sections that actually hold text, so the warning names real
           losses rather than reciting all eight every time. */
        filledSections={TABS.filter((t) => {
          const v = content[t.field];
          return typeof v === "string" && v.trim().length > 0;
        }).map((t) => t.label)}
        remaining={regenRemaining}
        max={regenMax}
        busy={generating}
        onConfirm={(nextTopic) => handleGenerate(nextTopic)}
      />
    </div>
  );
}
