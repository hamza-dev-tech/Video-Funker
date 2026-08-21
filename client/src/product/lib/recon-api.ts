import { apiGet, apiPost, apiDelete, getToken, httpMessage } from "@product/lib/api-client";
import { API_BASE } from '@product/config';

// Types
export interface ReconInsightData {
  prospectSearch: {
    searchQueries: string[];
    linkedInFilters: {
      industries: string[];
      companySizes: string[];
      titles: string[];
      regions: string[];
    };
    keywordClusters: string[];
  };
  dataEnrichment: {
    requiredFields: string[];
    enrichmentSources: string[];
    prioritySignals: string[];
    qualificationCriteria: {
      mustHave: string[];
      niceToHave: string[];
      disqualifiers: string[];
    };
  };
  segmentation: {
    segments: {
      name: string;
      description: string;
      criteria: string[];
      priority: 'high' | 'medium' | 'low';
    }[];
  };
  intentFiltering: {
    intentSignals: {
      signal: string;
      weight: 'high' | 'medium' | 'low';
      source: string;
    }[];
    triggerEvents: string[];
    timingIndicators: string[];
  };
  metadata: {
    processedAt: string;
    documentHash: string;
    version: string;
  };
}

// New structured prospect research shape
export interface BuyerPersona {
  role: string;
  goals: string;
  whatTheyCareAbout: string;
}

export interface CommonObjection {
  objection: string;
  response: string;
}

export interface ProspectResearchData {
  executiveSummary: string;
  idealCompanies: string[];
  buyerPersonas: BuyerPersona[];
  buyingTriggers: string[];
  commonObjections: CommonObjection[];
  prospectingKeywords: string[];
  targetingStrategy: {
    primaryAudience: string;
    secondaryAudience: string;
    channels: string[];
  };
  outreachRecommendations: string[];
}

export type ReconInsightContent = ReconInsightData | ProspectResearchData;

// Type guard to detect the new structured shape
export function isProspectResearch(data: any): data is ProspectResearchData {
  return !!data && typeof data.executiveSummary === 'string';
}

// --- Normalization helpers (handle legacy stringified-JSON records) ---
const asString = (v: any): string => (v === null || v === undefined ? '' : typeof v === 'string' ? v : String(v));

function coerceObject(v: any): Record<string, any> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.startsWith('{') && t.endsWith('}')) {
      try {
        const parsed = JSON.parse(t);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        /* not JSON */
      }
    }
  }
  return null;
}

export function normalizeBuyerPersona(v: any): BuyerPersona {
  const o = coerceObject(v);
  if (o) {
    return {
      role: asString(o.role ?? o.title ?? o.persona),
      goals: asString(o.goals ?? o.goal),
      whatTheyCareAbout: asString(o.whatTheyCareAbout ?? o.caresAbout ?? o.priorities),
    };
  }
  return { role: '', goals: '', whatTheyCareAbout: asString(v) };
}

export function normalizeCommonObjection(v: any): CommonObjection {
  const o = coerceObject(v);
  if (o) {
    return {
      objection: asString(o.objection ?? o.concern ?? o.title),
      response: asString(o.response ?? o.recommendedResponse ?? o.answer ?? o.handling),
    };
  }
  return { objection: asString(v), response: '' };
}

export function normalizeInsightContent(raw: any): ReconInsightContent {
  if (isProspectResearch(raw)) {
    return {
      ...raw,
      buyerPersonas: Array.isArray(raw.buyerPersonas) ? raw.buyerPersonas.map(normalizeBuyerPersona) : [],
      commonObjections: Array.isArray(raw.commonObjections) ? raw.commonObjections.map(normalizeCommonObjection) : [],
    } as ProspectResearchData;
  }
  return raw as ReconInsightContent;
}

export interface ReconInsight {
  id: string;
  icpId: string;
  data: ReconInsightContent;
  documentHash: string;
  processedAt: string;
  updatedAt: string;
  regenerationCount?: number;
  maxRegenerations?: number;
  reportFilePath?: string | null;
  reportGeneratedAt?: string | null;
}

export interface ICPProfileWithRecon {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  campaignId: string;
  data: {
    industry: string | null;
    companySize: string | null;
    roles: string[];
    painPoints: string[];
    buyingTriggers: string[];
    regions: string[];
    messagingAngles: string[];
    contentTone: string | null;
    additionalNotes: string;
  };
  generatedFilePath: string | null;
  createdAt: string;
  updatedAt: string;
  reconStatus: 'pending' | 'generated';
  reconInsight: ReconInsight | null;
  lastProcessedAt: string | null;
}

function transformReconInsight(raw: any): ReconInsight {
  return {
    id: raw._id || raw.id,
    icpId: raw.icpId,
    data: normalizeInsightContent(raw.insights),
    documentHash: raw.documentHash || '',
    processedAt: raw.processedAt || '',
    updatedAt: raw.updatedAt,
    regenerationCount: raw.regenerationCount ?? 0,
    maxRegenerations: raw.maxRegenerations ?? 5,
    reportFilePath: raw.reportFilePath ?? null,
    reportGeneratedAt: raw.reportGeneratedAt ?? null,
  };
}

// Process ICP with AI — generates structured prospect research server-side
export async function processICPWithAI(
  icpId: string,
  _icpName?: string,
  _icpDocument?: string,
  _icpData?: Record<string, unknown>
): Promise<ReconInsight> {
  const result = await apiPost('/recon/process', { icpId });
  return transformReconInsight(result);
}

// Save recon insight (legacy, retained for backward compatibility)
export async function saveReconInsight(
  icpId: string,
  data: ReconInsightContent,
  documentHash: string
): Promise<ReconInsight> {
  const result = await apiPost('/recon', {
    icpId,
    insights: data,
    documentHash,
    processedAt: new Date().toISOString(),
  });
  return transformReconInsight(result);
}

// Download the generated prospect research report (authenticated blob download)
export async function downloadReconReport(icpId: string, fileName = 'prospect-research-report.txt'): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/recon/report/${icpId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  /*
    Say which failure it was.

    An expired session, a report that no longer exists and a server crash all
    produced "Failed to download report", which sends someone looking for a
    broken file when the real fix is signing back in. The app already has
    correct sentences for each status; this call was simply bypassing them.
  */
  if (!res.ok) throw new Error(httpMessage(res.status));
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Get recon insight for an ICP
export async function getReconInsight(icpId: string): Promise<ReconInsight | null> {
  try {
    const all = await apiGet<any[]>('/recon');
    const found = all?.find((i: any) => i.icpId === icpId);
    return found ? transformReconInsight(found) : null;
  } catch {
    return null;
  }
}

// Delete recon insight
export async function deleteReconInsight(icpId: string): Promise<void> {
  const all = await apiGet<any[]>('/recon');
  const found = all?.find((i: any) => i.icpId === icpId);
  if (found) {
    await apiDelete(`/recon/${found._id || found.id}`);
  }
}

// Check if insight needs re-sync
export async function checkInsightSync(icpId: string): Promise<{
  needsSync: boolean;
  reason: string;
}> {
  const insight = await getReconInsight(icpId);
  if (!insight) return { needsSync: true, reason: 'No insight exists' };
  return { needsSync: false, reason: 'Insight is up to date' };
}
