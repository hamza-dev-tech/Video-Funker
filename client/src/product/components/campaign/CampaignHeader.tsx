import { useState, useEffect } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@product/components/ui/dropdown-menu";
import { Button } from "@product/components/ui/button";
import { ChevronDown, Check, Loader2, Plus, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchCampaigns, Campaign } from "@product/lib/api";
import { useCampaignStore } from "@product/store/campaignStore";

/**
 * The bar above every campaign screen.
 *
 * It answers one question — which campaign am I looking at — and it has to
 * answer it at a glance, because every tab below it (ICP, Content, Film,
 * Reports) shows data that is meaningless attached to the wrong campaign. The
 * previous version buried that in a grey "Current Campaign:" label beside an
 * outline button the same weight as every other button on the page.
 *
 * Now the campaign's name is the largest thing in the bar, set in the display
 * face, with the switcher attached to it. The label is gone: a dropdown showing
 * a campaign name in a campaign workspace does not need to be told what it is.
 */
export function CampaignHeader() {
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);
  const activeCampaignName = useCampaignStore((s) => s.activeCampaignName);
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  /*
    A failed request is not an empty account.

    This swallowed the error and set an empty list, so a network blip or an
    expired session told someone with twenty campaigns that they had none — the
    exact bug the campaigns list page carries a comment about having fixed, on
    the one control that lets you change campaign from inside the workspace.
    Getting it wrong here strands people rather than merely misinforming them.
  */
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    fetchCampaigns()
      .then(setCampaigns)
      .catch((err: any) =>
        setLoadError(err?.message || "Couldn't load your campaigns."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open || campaigns.length > 0) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaigns.length]);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-8 py-4">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="group flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 -ml-2 transition-colors hover:bg-secondary/70"
            aria-label="Switch campaign"
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="h-[15px] w-[15px]" />
            </span>
            <span className="truncate font-display text-[17px] font-bold tracking-[-0.01em] text-foreground">
              {activeCampaignName || "Select a campaign"}
            </span>
            <ChevronDown className="h-4 w-4 flex-none text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="min-w-[260px] p-1.5">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Switch campaign
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="space-y-2 px-2 py-3 text-center">
              <p className="text-sm text-foreground">{loadError}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  load();
                }}
                className="text-[12.5px] font-semibold text-primary"
              >
                Try again
              </button>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No campaigns yet.
            </div>
          ) : (
            campaigns.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActiveCampaign(c.id, c.name)}
                className="gap-2 rounded-lg py-2"
              >
                <Check
                  className={`h-4 w-4 flex-none ${c.id === activeCampaignId ? "text-primary opacity-100" : "opacity-0"}`}
                />
                <span className="truncate text-[14px]">{c.name}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button asChild variant="outline" size="sm" className="flex-none gap-2">
        <Link to="/campaigns">
          <Plus className="h-4 w-4" />
          All campaigns
        </Link>
      </Button>
    </header>
  );
}
