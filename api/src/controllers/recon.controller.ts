import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import ReconInsight from '../models/ReconInsight';
import ICPProfile from '../models/ICPProfile';
import { sendSuccess } from '../utils/response';
import { AppError, BadRequestError, NotFoundError } from '../errors';
import { assertCanRegenerateRecon, getReconRegenerationUsage } from '../services/recon-usage.service';
import { getOpenAI, chatModel } from '../config/openai';


const UPLOADS_ROOT = path.join(__dirname, '../..', 'uploads', 'campaigns');

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const insights = await ReconInsight.find({ userId: req.user!._id }).sort('-createdAt');
  sendSuccess(res, insights);
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  const insight = await ReconInsight.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!insight) throw new NotFoundError('Recon insight not found');
  sendSuccess(res, insight);
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const insight = await ReconInsight.create({ userId: req.user!._id, ...req.body });
  sendSuccess(res, insight, 201);
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  const insight = await ReconInsight.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
  if (!insight) throw new NotFoundError('Recon insight not found');
  sendSuccess(res, { message: 'Deleted' });
};

const PROSPECT_RESEARCH_SYSTEM_PROMPT = `You are an elite B2B sales intelligence analyst. You produce structured, actionable prospect research that a sales team can use immediately.

STRICT OUTPUT RULES:
- Return ONLY valid JSON matching the requested schema. No prose outside the JSON.
- No markdown, no headings, no asterisks, no bullet symbols, no stage directions, no commentary about being an AI.
- No generic filler or vague advice. Every item must be specific and actionable.
- Write in clear, professional, sales-team-ready language.`;

interface BuyerPersona {
  role: string;
  goals: string;
  whatTheyCareAbout: string;
}

interface CommonObjection {
  objection: string;
  response: string;
}

interface ProspectResearchData {
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

const str = (v: any): string => {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : String(v);
};

// Try to coerce a value (which may be a stringified JSON object) into a plain object.
const toObject = (v: any): any => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        // not valid JSON, fall through
      }
    }
  }
  return null;
};

const normalizePersona = (v: any): BuyerPersona => {
  const obj = toObject(v);
  if (obj) {
    return {
      role: str(obj.role ?? obj.title ?? obj.persona),
      goals: str(obj.goals ?? obj.goal),
      whatTheyCareAbout: str(obj.whatTheyCareAbout ?? obj.caresAbout ?? obj.priorities),
    };
  }
  // Legacy plain string — preserve text in whatTheyCareAbout so nothing is lost.
  return { role: '', goals: '', whatTheyCareAbout: str(v) };
};

const normalizeObjection = (v: any): CommonObjection => {
  const obj = toObject(v);
  if (obj) {
    return {
      objection: str(obj.objection ?? obj.concern ?? obj.title),
      response: str(obj.response ?? obj.recommendedResponse ?? obj.answer ?? obj.handling),
    };
  }
  return { objection: str(v), response: '' };
};

const normalizeInsights = (raw: any): ProspectResearchData => {
  const arr = (v: any): string[] => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))) : []);
  const objArr = <T,>(v: any, fn: (x: any) => T): T[] => (Array.isArray(v) ? v.map(fn) : []);
  const ts = raw?.targetingStrategy || {};
  return {
    executiveSummary: typeof raw?.executiveSummary === 'string' ? raw.executiveSummary : '',
    idealCompanies: arr(raw?.idealCompanies),
    buyerPersonas: objArr(raw?.buyerPersonas, normalizePersona),
    buyingTriggers: arr(raw?.buyingTriggers),
    commonObjections: objArr(raw?.commonObjections, normalizeObjection),
    prospectingKeywords: arr(raw?.prospectingKeywords),
    targetingStrategy: {
      primaryAudience: typeof ts.primaryAudience === 'string' ? ts.primaryAudience : '',
      secondaryAudience: typeof ts.secondaryAudience === 'string' ? ts.secondaryAudience : '',
      channels: arr(ts.channels),
    },
    outreachRecommendations: arr(raw?.outreachRecommendations),
  };
};

export const processData = async (req: AuthRequest, res: Response): Promise<void> => {
  const { icpId } = req.body;
  if (!icpId) throw new BadRequestError('icpId is required');

  const profile = await ICPProfile.findOne({ _id: icpId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found');

  // Determine initial vs regeneration based on an existing insight for this ICP.
  const existing = await ReconInsight.findOne({ icpId, userId: req.user!._id });
  /*
    Count every generation, including the first.

    This used to store 0 for the initial run, so the sequence was 0,1,2,3,4,5 —
    six paid AI calls against a limit of five. It also meant a customer who had
    generated once read "Recon Generations Used: 0 / 5", so the number on screen
    disagreed with the number that eventually stopped them and the last click
    came as a surprise.
  */
  let regenerationCount = 1;
  if (existing) {
    assertCanRegenerateRecon(existing); // throws 403 when limit reached
    regenerationCount = (existing.regenerationCount ?? 0) + 1;
  }

  const data: any = profile.data || {};
  const userPrompt = `Generate a structured Prospect Research Report using ALL of the following Ideal Customer Profile information.

ICP Name: ${profile.name}
Industry: ${data.industry || 'N/A'}
Company Size: ${data.companySize || 'N/A'}
Roles / Decision Makers: ${(data.roles || []).join(', ') || 'N/A'}
Pain Points: ${(data.painPoints || []).join(', ') || 'N/A'}
Buying Triggers: ${(data.buyingTriggers || []).join(', ') || 'N/A'}
Regions: ${(data.regions || []).join(', ') || 'N/A'}
Messaging Angles: ${(data.messagingAngles || []).join(', ') || 'N/A'}
Content Tone: ${data.contentTone || 'N/A'}
Solution / Product Being Sold: ${data.solution || 'N/A'}
Additional Notes: ${data.additionalNotes || 'N/A'}

Return ONLY JSON with this exact shape:
{
  "executiveSummary": "concise paragraph summarizing the opportunity and who to target",
  "idealCompanies": ["specific company profiles / firmographic descriptions to target"],
  "buyerPersonas": [{ "role": "job title", "goals": "what this persona is trying to achieve", "whatTheyCareAbout": "their priorities and decision criteria" }],
  "buyingTriggers": ["specific signals/events indicating a prospect is ready to buy"],
  "commonObjections": [{ "objection": "the objection a prospect raises", "response": "the recommended way to handle it" }],
  "prospectingKeywords": ["search terms and keywords for finding prospects"],
  "targetingStrategy": {
    "primaryAudience": "the highest-priority audience to focus on",
    "secondaryAudience": "the next audience to expand into",
    "channels": ["specific outreach channels to use"]
  },
  "outreachRecommendations": ["specific, actionable outreach tactics and messaging guidance"]
}

CRITICAL: buyerPersonas and commonObjections MUST be arrays of real JSON objects with the exact keys shown above. Never return stringified JSON, escaped JSON, or objects wrapped in quotes. Each persona is an object with "role", "goals", "whatTheyCareAbout"; each objection is an object with "objection" and "response".`;

  const completion = await getOpenAI().chat.completions.create({
    model: chatModel(),
    messages: [
      { role: 'system', content: PROSPECT_RESEARCH_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(completion.choices[0].message.content || '{}');
  } catch {
    parsed = {};
  }
  const insights = normalizeInsights(parsed);

  /*
    An unusable response is an error, not a save.

    normalizeInsights always returns a correctly shaped object, so a failed
    parse produced an empty-but-valid report that was written straight over the
    customer's existing research — keeping the spent generation, returning
    success, and showing "No summary provided" in every section with no error.
    Nothing here is versioned, so the previous report was simply gone.

    Throwing before the write leaves the stored research untouched and, because
    the counter is only persisted in that same write, does not consume one of
    the five.
  */
  const isEmpty =
    !insights.executiveSummary.trim() &&
    !insights.idealCompanies.length &&
    !insights.buyerPersonas.length &&
    !insights.buyingTriggers.length &&
    !insights.outreachRecommendations.length;

  if (isEmpty) {
    throw new AppError(
      'The research came back empty, so nothing was changed and this did not count against your generations. Try again in a moment.',
      502
    );
  }

  const documentHash = Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32);
  const processedAt = new Date();

  const saved = await ReconInsight.findOneAndUpdate(
    { icpId, userId: req.user!._id },
    {
      userId: req.user!._id,
      icpId,
      campaignId: profile.campaignId,
      insights,
      documentHash,
      processedAt,
      regenerationCount,
      maxRegenerations: existing?.maxRegenerations ?? 5,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const usage = getReconRegenerationUsage(saved!);
  sendSuccess(res, { ...saved!.toObject(), usage });
};

const sectionList = (title: string, items: string[]): string => {
  const body = items.length ? items.map((i) => `- ${i}`).join('\n') : '- N/A';
  return `${title}\n${'='.repeat(title.length)}\n${body}\n`;
};

const personaSection = (personas: any[]): string => {
  const title = 'BUYER PERSONAS';
  if (!personas.length) return `${title}\n${'='.repeat(title.length)}\n- N/A\n`;
  const body = personas
    .map((p) => {
      const n = normalizePersona(p);
      return [
        `Role: ${n.role || 'N/A'}`,
        `Goals: ${n.goals || 'N/A'}`,
        `What They Care About: ${n.whatTheyCareAbout || 'N/A'}`,
      ].join('\n');
    })
    .join('\n\n');
  return `${title}\n${'='.repeat(title.length)}\n${body}\n`;
};

const objectionSection = (objections: any[]): string => {
  const title = 'COMMON OBJECTIONS';
  if (!objections.length) return `${title}\n${'='.repeat(title.length)}\n- N/A\n`;
  const body = objections
    .map((o) => {
      const n = normalizeObjection(o);
      return [`Objection: ${n.objection || 'N/A'}`, `Recommended Response: ${n.response || 'N/A'}`].join('\n');
    })
    .join('\n\n');
  return `${title}\n${'='.repeat(title.length)}\n${body}\n`;
};

export const downloadReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { icpId } = req.params;
  const insight = await ReconInsight.findOne({ icpId, userId: req.user!._id });
  if (!insight) throw new NotFoundError('Recon insight not found for this ICP');
  if (!insight.insights) throw new NotFoundError('No insights have been generated yet');

  const profile = await ICPProfile.findOne({ _id: icpId, userId: req.user!._id });
  const campaignId = String(insight.campaignId || profile?.campaignId || 'unknown');
  const ins: any = insight.insights;

  const isStructured = ins && typeof ins.executiveSummary === 'string';
  const generatedAt = new Date();

  let report = '';
  report += `PROSPECT RESEARCH REPORT\n========================\n\n`;
  report += `ICP / Campaign: ${profile?.name || 'Untitled ICP'}\n`;
  report += `Generated: ${generatedAt.toLocaleString()}\n\n`;

  if (isStructured) {
    report += `EXECUTIVE SUMMARY\n=================\n${ins.executiveSummary || 'N/A'}\n\n`;
    report += sectionList('IDEAL COMPANIES', ins.idealCompanies || []) + '\n';
    report += personaSection(ins.buyerPersonas || []) + '\n';
    report += sectionList('BUYING TRIGGERS', ins.buyingTriggers || []) + '\n';
    report += objectionSection(ins.commonObjections || []) + '\n';
    report += sectionList('PROSPECTING KEYWORDS', ins.prospectingKeywords || []) + '\n';
    const ts = ins.targetingStrategy || {};
    report += `TARGETING STRATEGY\n==================\n`;
    report += `Primary Audience: ${ts.primaryAudience || 'N/A'}\n`;
    report += `Secondary Audience: ${ts.secondaryAudience || 'N/A'}\n`;
    report += `Channels: ${(ts.channels || []).join(', ') || 'N/A'}\n\n`;
    report += sectionList('OUTREACH RECOMMENDATIONS', ins.outreachRecommendations || []);
  } else {
    // Legacy insight shape — dump readable JSON so old records still download.
    report += `INSIGHTS\n========\n${JSON.stringify(ins, null, 2)}\n`;
  }

  const reconDir = path.join(UPLOADS_ROOT, campaignId, 'recon');
  if (!fs.existsSync(reconDir)) fs.mkdirSync(reconDir, { recursive: true });
  const filePath = path.join(reconDir, 'prospect-research-report.txt');
  fs.writeFileSync(filePath, report, 'utf-8');

  insight.reportFilePath = `/uploads/campaigns/${campaignId}/recon/prospect-research-report.txt`;
  insight.reportGeneratedAt = generatedAt;
  await insight.save();

  res.download(filePath, `prospect-research-report-${campaignId}.txt`);
};
