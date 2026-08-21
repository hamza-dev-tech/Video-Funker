import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@product/lib/api-client";
import { API_BASE } from '@product/config';

// Types
export interface ICPData {
  industry: string | null;
  companySize: string | null;
  roles: string[];
  painPoints: string[];
  buyingTriggers: string[];
  regions: string[];
  messagingAngles: string[];
  solution: string | null;
  contentTone: string | null;
  additionalNotes: string;
}

export interface ICPProfile {
  id: string;
  campaignId: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  data: ICPData;
  generatedFilePath: string | null;
  /*
    The generated document itself.

    It used to live only in browser memory, so reloading the page lost something
    the customer had paid for and the only route back was downloading a .txt.
    The server stores it now, so it survives a refresh.
  */
  generatedDocument: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  progress: number;
  createdAt: string;
  updatedAt: string;
  /*
    Where this campaign has got to. Sent by the list endpoint so the first
    screen after login can answer "where was I?" instead of showing four
    facts that are the same for every campaign.
  */
  hasIcp?: boolean;
  hasContent?: boolean;
  videoCount?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  message: string;
  dataExtracted: Partial<ICPData>;
  progress: {
    completedSections?: string[];
    currentSection?: string;
    percentComplete: number;
  };
  suggestedQuestion?: string;
}

// Transform backend response
function transformToICPProfile(row: any): ICPProfile {
  const rawData = row.data || {};
  return {
    id: row._id || row.id,
    campaignId: row.campaignId,
    name: row.name,
    status: row.status as 'draft' | 'active' | 'archived',
    data: {
      industry: rawData.industry ?? null,
      companySize: rawData.companySize ?? null,
      roles: Array.isArray(rawData.roles) ? rawData.roles : [],
      painPoints: Array.isArray(rawData.painPoints) ? rawData.painPoints : [],
      buyingTriggers: Array.isArray(rawData.buyingTriggers) ? rawData.buyingTriggers : [],
      regions: Array.isArray(rawData.regions) ? rawData.regions : [],
      messagingAngles: Array.isArray(rawData.messagingAngles) ? rawData.messagingAngles : [],
      solution: rawData.solution ?? null,
      contentTone: rawData.contentTone ?? null,
      additionalNotes: rawData.additionalNotes ?? ''
    },
    generatedFilePath: row.generatedFilePath || null,
    generatedDocument: row.generatedDocument || null,
    generatedAt: row.generatedAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function transformToCampaign(row: any): Campaign {
  return {
    id: row._id || row.id,
    name: row.name,
    description: row.description || '',
    status: row.status,
    progress: row.progress || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    hasIcp: !!row.hasIcp,
    hasContent: !!row.hasContent,
    videoCount: row.videoCount ?? 0,
  };
}

// ─── Campaign API ────────────────────────────────────────────

/**
 * Campaigns for the list.
 *
 * The server hides archived ones by default, because the delete dialog offers
 * Archive as the safe alternative and promises the campaign "disappears from
 * your list" — which was not true while everything came back unfiltered. Pass
 * "all" to include them.
 */
export async function fetchCampaigns(status?: 'all' | 'archived'): Promise<Campaign[]> {
  const query = status ? `?status=${status}` : '';
  const data = await apiGet<any[]>(`/campaigns${query}`);
  return (data || []).map(transformToCampaign);
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  const data = await apiGet(`/campaigns/${id}`);
  return transformToCampaign(data);
}

export async function createCampaign(name: string, description?: string): Promise<Campaign> {
  const data = await apiPost('/campaigns', { name, description });
  return transformToCampaign(data);
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  const data = await apiPut(`/campaigns/${id}`, updates);
  return transformToCampaign(data);
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiDelete(`/campaigns/${id}`);
}

// ─── ICP Profile API (campaign-scoped) ───────────────────────

export async function fetchICPByCampaign(campaignId: string): Promise<ICPProfile> {
  const data = await apiGet(`/icp/campaign/${campaignId}`);
  return transformToICPProfile(data);
}

export async function createOrUpdateICP(campaignId: string, body: { name?: string; data?: Partial<ICPData>; status?: string }): Promise<ICPProfile> {
  const data = await apiPost(`/icp/campaign/${campaignId}`, body);
  return transformToICPProfile(data);
}

export async function updateICPData(campaignId: string, icpData: Partial<ICPData>): Promise<ICPProfile> {
  const result = await apiPatch(`/icp/campaign/${campaignId}/data`, icpData);
  return transformToICPProfile(result);
}

export async function deleteICP(campaignId: string): Promise<void> {
  await apiDelete(`/icp/campaign/${campaignId}`);
}

// ─── AI Chat ─────────────────────────────────────────────────

export async function sendChatMessage(
  campaignId: string,
  message: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  return apiPost('/icp/chat', { campaignId, message, conversationHistory });
}

// ─── Generate ICP Document ───────────────────────────────────

export async function generateICPDocument(campaignId: string): Promise<{ content: string; filePath: string; generatedAt: string }> {
  return apiPost('/icp/generate-document', { campaignId });
}

// ─── Download ICP Document ──────────────────────────────────

export function getICPDownloadUrl(campaignId: string): string {
  return `${API_BASE}/icp/download/${campaignId}`;
}

