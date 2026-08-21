import { CampaignPageShell } from "@product/components/campaign/CampaignPageShell";
import { ReportsTab } from "@product/components/campaign/ReportsTab";

export default function ReportsPage() {
  return (
    <CampaignPageShell>
      {(campaignId) => (
        <div className="flex-1 overflow-auto">
          <ReportsTab key={campaignId} campaignId={campaignId} />
        </div>
      )}
    </CampaignPageShell>
  );
}
