import { apiGet } from "./api-client";

export type SectionStatus = "pending" | "processing" | "completed" | "failed";

export interface ReportSection {
  key: string;
  label: string;
  status: SectionStatus;
  /** Length of what was written. Zero when nothing was produced. */
  words: number;
  /** The model ran out of room mid-sentence. */
  truncated: boolean;
  error: string | null;
}

export interface ReportVideo {
  id: string;
  title: string | null;
  duration: number | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  status: "thinking" | "generating" | "completed" | "failed";
  createdAt: string;
  failureReason: string | null;
  /** Rendered from the exact script rather than authored by HeyGen. */
  exactScript: boolean;
  captions: boolean;
}

export interface CampaignReport {
  campaign: {
    name: string;
    status: string;
    description: string | null;
    createdAt: string;
  };

  /** What this campaign was arguing, and to whom. Null before content exists. */
  brief: {
    topic: string | null;
    angle: string | null;
    audience: string | null;
    outcome: string | null;
    writtenAt: string;
  } | null;

  audience: {
    industry: string | null;
    companySize: string | null;
    roles: string[];
    painPoints: string[];
    solution: string | null;
    regions: string[];
  } | null;

  sections: ReportSection[];
  totalWords: number;

  videos: ReportVideo[];
  videoBreakdown: { ready: number; rendering: number; failed: number };

  /** Anything that still needs a person. Empty when the campaign is clean. */
  attention: string[];

  /* Older shape, kept so nothing that reads it breaks. */
  icpCreated: boolean;
  contentCount: number;
  videoCount: number;
  flags: {
    icpCompleted: boolean;
    contentGenerated: boolean;
    videoCreated: boolean;
  };
}

export const fetchCampaignReport = (campaignId: string) =>
  apiGet<CampaignReport>(`/reports/${campaignId}`);
