import { useCallback, useEffect, useMemo, useState } from "react";
import { usePollWhile } from "@product/hooks/usePollWhile";
import { CardGridSkeleton } from "@product/components/layout/LoadingGrid";
import { Button } from "@product/components/ui/button";
import { Card, CardContent } from "@product/components/ui/card";
import { Input } from "@product/components/ui/input";
import { TooltipProvider } from "@product/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@product/components/ui/select";
import { Loader2, Plus, User, Search } from "lucide-react";
import { useToast } from "@product/hooks/use-toast";
import { useVerification } from "@product/context/VerificationProvider";
import {
  listCustomAvatars,
  deleteCustomAvatar,
  syncAvatarData,
  type CustomAvatar,
} from "@product/lib/heygen-api";
import { AvatarCreationWizard } from "@product/components/avatar/AvatarCreationWizard";
import { DeleteAvatarModal } from "@product/components/avatar/DeleteAvatarModal";
import { AvatarCard } from "@product/components/avatar/AvatarCard";
import { AvatarPreviewModal } from "@product/components/avatar/AvatarPreviewModal";
import { EmptyState } from "@product/components/layout/EmptyState";
import { PageHeader } from "@product/components/layout/PageHeader";

export function AvatarStudioTab() {
  const { toast } = useToast();
  const { requireVerifiedEmail } = useVerification();
  const [avatars, setAvatars] = useState<CustomAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CustomAvatar | null>(null);
  const [preview, setPreview] = useState<CustomAvatar | null>(null);

  /**
   * Re-fetches without touching `loading`.
   *
   * `load` sets `loading` true, which swaps the grid for its placeholder. Fine
   * on first paint, wrong for a background poll — the list would blink away
   * and back every few seconds while an avatar rendered.
   */
  const refresh = useCallback(async () => {
    try {
      const res = await listCustomAvatars({
        search: search || undefined,
        avatarSourceType: sourceFilter !== "all" ? (sourceFilter as any) : undefined,
        limit: 100,
      });
      setAvatars(res.items);
    } catch {
      // Background refresh: leave the last good data on screen.
    }
  }, [search, sourceFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCustomAvatars({
        search: search || undefined,
        avatarSourceType: sourceFilter !== "all" ? (sourceFilter as any) : undefined,
        limit: 100,
      });
      setAvatars(res.items);
    } catch (err: any) {
      toast({ title: "Couldn't load avatars", description: err?.message || "Failed to load avatars", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, toast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  /*
    Anything still being made keeps the list refreshing until it is done.

    Without this the page was a snapshot taken on mount: an avatar that finished
    thirty seconds later stayed "Processing" on screen until the person either
    pressed the per-card sync button or reloaded. `refresh` rather than `load`
    so the poll does not flip the whole grid back into its loading state every
    few seconds.
  */
  const hasWorkInFlight = useMemo(
    () => avatars.some((a) => ["pending", "processing", "generating", "training"].includes(a.status || "")),
    [avatars]
  );

  usePollWhile(hasWorkInFlight, refresh);

  const handleSync = (av: CustomAvatar) =>
    requireVerifiedEmail(async () => {
      setSyncingId(av.id);
      try {
        await syncAvatarData(av.avatar_id);
        toast({ title: "Synced", description: `${av.name} updated.` });
        await load();
      } catch (err: any) {
        toast({ title: "Sync failed", description: err?.message || "Sync failed.", variant: "destructive" });
      } finally {
        setSyncingId(null);
      }
    });

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCustomAvatar(toDelete.id);
      toast({ title: "Avatar deleted" });
      await load();
    } catch (err: any) {
      toast({ title: "Couldn't delete that", description: err?.message || "Delete failed.", variant: "destructive" });
      throw err;
    }
  };

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-[1180px] px-8 py-8 space-y-6">
        <PageHeader
          title="Avatar Studio"
          description="The presenters who deliver your scripts on camera."
          actions={
            <Button
              variant="cta"
              onClick={() => requireVerifiedEmail(() => setWizardOpen(true))}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Create avatar
            </Button>
          }
        />

        <div className="flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search avatars"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="prompt">Prompt Generated</SelectItem>
              <SelectItem value="image_upload">Image Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : avatars.length === 0 ? (
          <EmptyState
            icon={User}
            title="Cast your first presenter"
            description="An avatar is the face that delivers your scripts. Generate one from a description, or upload a photo."
            action={
              <Button
                variant="cta"
                onClick={() => requireVerifiedEmail(() => setWizardOpen(true))}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Create avatar
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {avatars.map((av) => (
              <AvatarCard
                key={av.id}
                avatar={av}
                syncing={syncingId === av.id}
                onView={setPreview}
                onSync={handleSync}
                onDelete={(a) => requireVerifiedEmail(() => setToDelete(a))}
              />
            ))}
          </div>
        )}

        <AvatarCreationWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={load} />
        <AvatarPreviewModal
          avatar={preview}
          open={!!preview}
          onOpenChange={(o) => !o && setPreview(null)}
          onDelete={(a) => requireVerifiedEmail(() => setToDelete(a))}
        />
        <DeleteAvatarModal
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          avatarName={toDelete?.name}
          onConfirm={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}
