import { CampaignPageShell } from "@product/components/campaign/CampaignPageShell";
import { FilmTab } from "@product/components/campaign/FilmTab";

export default function FilmPage() {
  return (
    <CampaignPageShell>
      {(campaignId) => (
        <div className="flex-1 overflow-hidden">
          <FilmTab key={campaignId} campaignId={campaignId} />
        </div>
      )}
    </CampaignPageShell>
  );
}
