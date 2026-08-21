import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CampaignStore {
  activeCampaignId: string | null;
  activeCampaignName: string | null;
  setActiveCampaign: (campaignId: string, campaignName: string) => void;
  clearActiveCampaign: () => void;
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set) => ({
      activeCampaignId: null,
      activeCampaignName: null,
      setActiveCampaign: (campaignId, campaignName) =>
        set({ activeCampaignId: campaignId, activeCampaignName: campaignName }),
      clearActiveCampaign: () =>
        set({ activeCampaignId: null, activeCampaignName: null }),
    }),
    { name: "saleslights-active-campaign" }
  )
);
