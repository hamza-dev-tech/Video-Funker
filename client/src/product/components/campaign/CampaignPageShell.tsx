import { MainLayout } from "@product/components/layout/MainLayout";
import { CampaignHeader } from "@product/components/campaign/CampaignHeader";
import { NoCampaignSelected } from "@product/components/campaign/NoCampaignSelected";
import { useCampaignStore } from "@product/store/campaignStore";

interface CampaignPageShellProps {
  /** Render-prop receiving the active campaign id (guaranteed non-null). */
  children: (campaignId: string) => React.ReactNode;
}

export function CampaignPageShell({ children }: CampaignPageShellProps) {
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);

  return (
    <MainLayout bleed>
      <div className="flex flex-col h-screen">
        <CampaignHeader />
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeCampaignId ? children(activeCampaignId) : <NoCampaignSelected />}
        </div>
      </div>
    </MainLayout>
  );
}
