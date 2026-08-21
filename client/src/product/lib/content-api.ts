import { apiGet, apiPost, apiPatch } from "@product/lib/api-client";

export interface LinkedInOutreach {
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
}

export interface EmailMessage {
  subject?: string;
  body?: string;
}

export interface EmailOutreach {
  email1?: EmailMessage;
  email2?: EmailMessage;
  email3?: EmailMessage;
  email4?: EmailMessage;
}

export interface ColdCallScript {
  opening?: string;
  qualification_questions?: string[];
  pitch?: string;
  objection_handling?: string;
  cta?: string;
}

export interface CalendarWeek {
  week?: number;
  title?: string;
  post?: string;
}

/**
 * LEGACY. Nothing writes this.
 *
 * The generation pipeline sets `captions: {}` on every run and then fills
 * `captionsText` (a plain string) instead. So `cold_call_script`,
 * `email_outreach` and `linkedin_calendar` describe a shape the current
 * eight-step chain never produces — they are left over from an earlier design.
 *
 * Worth knowing because it reads like hidden value: fully typed here, present
 * on the model, serialized to the browser, rendered nowhere. Building a panel
 * for it would show an empty box forever. Either wire up prompts that actually
 * emit this structure, or delete the field and these types.
 */
export interface ContentCaptions {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  email_subject?: string;
  linkedin_outreach?: LinkedInOutreach;
  email_outreach?: EmailOutreach;
  cold_call_script?: ColdCallScript;
  linkedin_calendar?: CalendarWeek[];
  [key: string]: unknown;
}

export type SectionStatus = "pending" | "processing" | "completed" | "failed";

export type SectionKey =
  | "research"
  | "article"
  | "videoScript"
  | "captions"
  | "linkedinPosts"
  | "outboundScripts"
  | "linkedinImage"
  | "longForm";

export interface SectionState {
  status: SectionStatus;
  error?: string;
  /** The model ran out of room mid-sentence. Server sets this from finish_reason. */
  truncated?: boolean;
}

export interface ContentData {
  _id: string;
  campaignId: string;
  topic: string;
  research: string;
  article: string;
  script: string;
  captions: ContentCaptions;
  captionsText?: string;
  linkedinPosts?: string;
  outboundScripts?: string;
  linkedinImagePrompt?: string;
  longFormPost?: string;
  sections?: Record<SectionKey, SectionState>;
  regenerationCount?: number;
  maxRegenerations?: number;
  filePaths: {
    research?: string;
    article?: string;
    script?: string;
    captions?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function fetchContent(campaignId: string): Promise<ContentData> {
  return apiGet<ContentData>(`/content/${campaignId}`);
}

/**
 * Starts the eight-step generation.
 *
 * `brief` is optional so the existing call sites — the regenerate dialog, which
 * only changes the topic — keep working unchanged. When it is present the
 * server composes the campaign brief from it, exactly as the presenter endpoint
 * composes a prompt from a spec, rather than trusting anything built here.
 */
export async function generateContent(
  campaignId: string,
  topic: string,
  brief?: { angle?: string; audience?: string; outcome?: string },
): Promise<ContentData> {
  return apiPost<ContentData>('/content/generate', { campaignId, topic, ...brief });
}

export async function updateScript(campaignId: string, script: string): Promise<ContentData> {
  return apiPatch<ContentData>(`/content/${campaignId}/script`, { script });
}

export async function regenerateSection(campaignId: string, section: SectionKey): Promise<ContentData> {
  return apiPost<ContentData>(`/content/${campaignId}/section/${section}`, {});
}

