import { useState, useEffect } from "react";
import { MainLayout } from "@product/components/layout/MainLayout";
import { PageHeader } from "@product/components/layout/PageHeader";
import { EmptyState } from "@product/components/layout/EmptyState";
import { ListSkeleton } from "@product/components/layout/LoadingGrid";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import { Textarea } from "@product/components/ui/textarea";
import { Badge } from "@product/components/ui/badge";
import { Card, CardContent } from "@product/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@product/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@product/components/ui/dropdown-menu";
import { Search, Plus, Loader2, Rocket, MoreVertical, Trash2, Pencil, Target, Archive, AlertTriangle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@product/hooks/use-toast";
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  Campaign,
} from "@product/lib/api";
import { format } from "date-fns";
import { cn } from "@product/lib/utils";
import { useCampaignStore } from "@product/store/campaignStore";
import { useVerification } from "@product/context/VerificationProvider";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /*
    Distinct from "the list came back empty". Without this, a failed request
    rendered the first-run empty state — telling someone with twenty campaigns
    that they had none, and offering to help them create their first.
  */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  /** Archived campaigns are hidden by default now that Archive really hides. */
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(
    null,
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);
  const { requireVerifiedEmail, refreshUser, isVerified } = useVerification();

  const openCampaign = (campaign: Campaign) => {
    setActiveCampaign(campaign.id, campaign.name);
    navigate("/icp");
  };

  useEffect(() => {
    refreshUser();
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when the archived filter is toggled — the server decides what comes
  // back, so this cannot be done by filtering the list already in memory.
  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchCampaigns(showArchived ? "all" : undefined);
      setCampaigns(data);
    } catch (err: any) {
      /*
        Recorded in state, not just announced in a toast. A toast is gone in
        four seconds and leaves the page underneath claiming you have no
        campaigns; the page itself has to carry the failure so it can offer a
        way out of it.
      */
      setLoadError(err?.message || "Something went wrong while loading your campaigns.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await createCampaign(newName.trim(), newDescription.trim());
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      await loadCampaigns();
      toast({
        title: "Campaign created",
        description: `"${newName}" has been created.`,
      });
    } catch (err) {
      toast({
        title: "Couldn't create the campaign",
        description:
          err instanceof Error ? err.message : "Failed to create campaign.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string, name: string) =>
    requireVerifiedEmail(() => {
      const target = campaigns.find((c) => c.id === id) ?? null;
      setCampaignToDelete(target);
      setDeleteConfirmOpen(true);
    });

  const handleArchiveFromModal = async () => {
    if (!campaignToDelete) return;
    setDeleteConfirmOpen(false);
    try {
      const updated = await updateCampaign(campaignToDelete.id, {
        status: "archived",
      });
      // It really leaves the list now, unless archived ones are being shown.
      setCampaigns((prev) =>
        showArchived
          ? prev.map((c) => (c.id === campaignToDelete.id ? updated : c))
          : prev.filter((c) => c.id !== campaignToDelete.id),
      );
      toast({
        title: "Campaign archived",
        description: "It's hidden from your list. Turn on “Show archived” to find it again.",
      });
    } catch {
      toast({
        title: "Couldn't archive the campaign",
        description: "Failed to archive campaign.",
        variant: "destructive",
      });
    } finally {
      setCampaignToDelete(null);
    }
  };

  const handleDeletePermanently = async () => {
    if (!campaignToDelete) return;
    const { id } = campaignToDelete;
    setDeleteConfirmOpen(false);
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));

      /*
        Forget it if it was the one we were working in.

        The active campaign is persisted to local storage and was never cleared
        on delete, so the most likely next action — going back into the
        workspace — confidently showed the deleted campaign's name across four
        screens of failed requests, and reloading did not help because the value
        came straight back out of storage.
      */
      if (useCampaignStore.getState().activeCampaignId === id) {
        useCampaignStore.getState().clearActiveCampaign();
      }

      toast({ title: "Campaign deleted successfully" });
    } catch {
      toast({
        title: "Couldn't delete the campaign",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    } finally {
      setCampaignToDelete(null);
    }
  };

  const handleStatusToggle = (campaign: Campaign) =>
    requireVerifiedEmail(async () => {
      const newStatus = campaign.status === "active" ? "archived" : "active";
      try {
        const updated = await updateCampaign(campaign.id, {
          status: newStatus,
        });
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaign.id ? updated : c)),
        );
      } catch {
        toast({
          title: "Couldn't update the campaign",
          description: "Failed to update campaign.",
          variant: "destructive",
        });
      }
    });

  const filtered = campaigns.filter(
    (c) =>
      !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "archived":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  return (
    <MainLayout>
      <div>
        <PageHeader
          title="Campaigns"
          description="Each campaign holds one audience, its research, its scripts and everything filmed for it."
          actions={
            <Button
              variant="cta"
              onClick={() => requireVerifiedEmail(() => setCreateOpen(true))}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New campaign
            </Button>
          }
        >
          {/* The search sits inside the header rather than floating under it,
              so it reads as a control on this list instead of a stray field.
              Hidden entirely until there is something to search — a filter over
              an empty list is furniture. */}
          {(campaigns.length > 0 || showArchived) && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card pl-10"
                />
              </div>
              {/* The way back to anything archived. Without it, "archive"
                  would just mean "hide forever". */}
              <Button
                variant={showArchived ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowArchived((v) => !v)}
                className="h-11 gap-2 rounded-xl px-3.5 text-[13.5px]"
              >
                <Archive className="h-4 w-4" />
                {showArchived ? "Showing archived" : "Show archived"}
              </Button>
            </div>
          )}
        </PageHeader>

        {/* Campaign List */}
        {isLoading ? (
          <ListSkeleton count={3} />
        ) : loadError ? (
          <EmptyState
            variant="error"
            icon={AlertTriangle}
            title="Couldn't load your campaigns"
            description={loadError}
            action={
              <Button variant="outline" onClick={loadCampaigns} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          campaigns.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="Start your first campaign"
              description="A campaign is one audience and everything you make for them — research, scripts, video and the report at the end."
              action={
                <Button
                  variant="cta"
                  onClick={() => requireVerifiedEmail(() => setCreateOpen(true))}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create campaign
                </Button>
              }
            />
          ) : (
            <EmptyState
              variant="search"
              icon={Search}
              title="Nothing matched that"
              description={`No campaign contains "${searchQuery}". Try a shorter search, or clear it to see all of them.`}
              action={
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              }
            />
          )
        ) : (
          <div className="grid gap-4">
            {filtered.map((campaign) => (
              <Card
                key={campaign.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => openCampaign(campaign)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {campaign.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getStatusColor(campaign.status),
                          )}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="mb-2 truncate text-[14px] leading-relaxed text-muted-foreground">
                          {campaign.description}
                        </p>
                      )}
                      {/*
                        Progress, not just provenance.

                        The card carried four facts that look identical across
                        every campaign. These three say where the work actually
                        stopped, so the first screen after login can answer
                        "where was I?" — the question people open it to ask.
                      */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-muted-foreground">
                        <span>
                          Created{" "}
                          {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                        </span>
                        <span aria-hidden="true" className="text-border">·</span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            campaign.hasIcp && "text-foreground",
                          )}
                        >
                          <Target className="h-3 w-3" />
                          {campaign.hasIcp ? "ICP set" : "No ICP"}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            campaign.hasContent && "text-foreground",
                          )}
                        >
                          <Pencil className="h-3 w-3" />
                          {campaign.hasContent ? "Content ready" : "No content"}
                        </span>
                        {(campaign.videoCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-foreground">
                            <Rocket className="h-3 w-3" />
                            {campaign.videoCount} video
                            {campaign.videoCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openCampaign(campaign);
                          }}
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Open Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(campaign);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          {campaign.status === "active"
                            ? "Archive"
                            : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(campaign.id, campaign.name);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
            <DialogDescription>
              One campaign holds one audience and everything you make for them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              {/*
                "Optional" on the field that is optional, rather than an
                asterisk on the one that is required. An asterisk needs a legend
                to decode and this form has two fields — saying which one you
                can skip is shorter and needs no key.
              */}
              <Label htmlFor="campaign-name" className="text-[13px] font-semibold">
                Campaign name
              </Label>
              <Input
                id="campaign-name"
                placeholder="Q1 SaaS outreach"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-description" className="text-[13px] font-semibold">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="campaign-description"
                /* resize-none: the drag handle in the corner invited resizing a
                   box inside a fixed-width dialog, which only ever broke the
                   layout. */
                className="resize-none"
                placeholder="What is this campaign for?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="cta"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? "Creating" : "Create campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this campaign?</DialogTitle>
          </DialogHeader>
          {/*
            Five short paragraphs separated by stacked <br /> became two
            sentences and a highlighted alternative. The old copy buried the one
            thing that matters — archiving keeps the campaign and deleting does
            not — under three line breaks at the bottom, where the person about
            to click Delete would never reach it.
          */}
          <div className="space-y-4">
            <p className="text-[14.5px] leading-relaxed text-muted-foreground">
              Everything in it goes: the ICP, the generated content, and every
              video filmed for it. This cannot be undone, and the campaign still
              counts against your plan's allocation.
            </p>

            <div className="flex gap-3 rounded-xl border border-border/70 bg-secondary/50 p-4">
              <Archive className="mt-0.5 h-[18px] w-[18px] flex-none text-primary" strokeWidth={1.9} />
              <p className="text-[14px] leading-relaxed text-foreground">
                <span className="font-semibold">Archiving keeps it.</span> The
                campaign disappears from your list and can be restored at any
                time, with everything intact.
              </p>
            </div>
          </div>

          {/*
            Archive is the recommended path, so it is the solid button on the
            right where the eye lands last. Delete is real but quiet — a
            destructive fill here would make the dangerous option the most
            attractive thing in the dialog.
          */}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="ghost"
                onClick={handleDeletePermanently}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete permanently
              </Button>
              <Button onClick={handleArchiveFromModal}>Archive instead</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
