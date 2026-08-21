import { useState, useEffect } from "react";
import { CampaignPageShell } from "@product/components/campaign/CampaignPageShell";
import { ContentTab } from "@product/components/campaign/ContentTab";
import { fetchICPByCampaign } from "@product/lib/api";
import { Loader2 } from "lucide-react";

function ContentInner({ campaignId }: { campaignId: string }) {
  const [hasIcp, setHasIcp] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    setHasIcp(null);
    fetchICPByCampaign(campaignId)
      .then(() => active && setHasIcp(true))
      .catch(() => active && setHasIcp(false));
    return () => {
      active = false;
    };
  }, [campaignId]);

  if (hasIcp === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ContentTab campaignId={campaignId} hasIcp={hasIcp} />;

  // return (
  //   <div className="flex items-center justify-center min-h-[200px]">
  //     <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center max-w-md">
  //       <div className="mb-4 text-4xl">🚧</div>
  //       <h2 className="text-xl font-semibold text-gray-800 mb-2">
  //         Feature Under Development
  //       </h2>
  //       <p className="text-gray-600">
  //         We're working hard to bring this feature to you. Please check back
  //         soon for updates.
  //       </p>
  //     </div>
  //   </div>
  // );
}

export default function ContentPage() {
  return (
    <CampaignPageShell>
      {(campaignId) => (
        <div className="flex-1 overflow-hidden">
          <ContentInner key={campaignId} campaignId={campaignId} />
        </div>
      )}
    </CampaignPageShell>
  );
}
