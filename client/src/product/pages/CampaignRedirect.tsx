import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { fetchCampaign } from "@product/lib/api";
import { useCampaignStore } from "@product/store/campaignStore";

const SECTION_ROUTES: Record<string, string> = {
  icp: "/icp",
  "avatar-studio": "/avatar-studio",
  "data-avatar": "/avatar-studio",
  content: "/content",
  film: "/film",
  reports: "/reports",
};

export default function CampaignRedirect() {
  const { campaignId, section } = useParams<{ campaignId: string; section?: string }>();
  const navigate = useNavigate();
  const setActiveCampaign = useCampaignStore((s) => s.setActiveCampaign);

  useEffect(() => {
    const target = (section && SECTION_ROUTES[section]) || "/icp";
    if (!campaignId) {
      navigate("/campaigns", { replace: true });
      return;
    }
    let active = true;
    fetchCampaign(campaignId)
      .then((c) => {
        if (active) setActiveCampaign(c.id, c.name);
      })
      .catch(() => {})
      .finally(() => {
        if (active) navigate(target, { replace: true });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, section]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
