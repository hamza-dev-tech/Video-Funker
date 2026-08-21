import { apiGet } from "./api-client";

export interface CampaignReport {
  icpCreated: boolean;
  contentCount: number;
  articleCount: number;
  scriptCount: number;
  researchCount: number;
  /** Finished videos only. Failed and in-flight renders are in videoBreakdown. */
  videoCount: number;
  videoBreakdown?: {
    ready: number;
    rendering: number;
    failed: number;
  };
  flags: {
    icpCompleted: boolean;
    contentGenerated: boolean;
    videoCreated: boolean;
  };
  campaign: {
    name: string;
    status: string;
    createdAt: string;
  };
}

export const fetchCampaignReport = (campaignId: string) =>
  apiGet<CampaignReport>(`/reports/${campaignId}`);
