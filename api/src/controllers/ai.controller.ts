import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import ICPProfile from '../models/ICPProfile';
import Conversation from '../models/Conversation';
import { sendSuccess } from '../utils/response';
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from '../errors';
import { getOpenAI, chatModel } from '../config/openai';


const UPLOADS_ROOT = path.join(__dirname, '../..', 'uploads', 'campaigns');

const ICP_SYSTEM_PROMPT = `You are an expert B2B sales strategist helping users build comprehensive Ideal Customer Profiles (ICPs). Your job is to ask intelligent, adaptive questions to gather all the information needed to create a complete ICP.

## ICP Data Structure to Collect:
- industry, companySize, roles, painPoints, buyingTriggers, regions, messagingAngles, solution, contentTone

## Guidelines:
1. Ask ONE focused question at a time
2. Adapt based on previous answers
3. Provide examples when helpful

## Response Format (JSON):
{
  "message": "Your response",
  "dataExtracted": {},
  "suggestedQuestion": "Next question",
  "progress": {
    "completedSections": [],
    "currentSection": "",
    "percentComplete": 0
  }
}`;

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId, message, conversationHistory = [] } = req.body;
  if (!campaignId) throw new BadRequestError('Campaign ID is required');

  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found for this campaign');

  const messages: any[] = [
    { role: 'system', content: ICP_SYSTEM_PROMPT },
    { role: 'system', content: `Current ICP Data: ${JSON.stringify(profile.data || {}, null, 2)}` },
    ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: chatModel(),
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  const responseContent = completion.choices[0].message.content || '';
  let parsed: any;
  try {
    parsed = JSON.parse(responseContent);
  } catch {
    parsed = { message: responseContent, dataExtracted: {}, progress: { percentComplete: 0 } };
  }

  // Merge extracted data into profile
  if (parsed.dataExtracted && Object.keys(parsed.dataExtracted).length > 0) {
    const current: any = profile.data || {};
    for (const [key, value] of Object.entries(parsed.dataExtracted)) {
      if (Array.isArray(current[key]) && Array.isArray(value)) {
        current[key] = [...new Set([...current[key], ...(value as any[])])];
      } else if (value !== null && value !== undefined) {
        current[key] = value;
      }
    }
    profile.data = current;
    await profile.save();
  }

  // Save conversation
  await Conversation.findOneAndUpdate(
    { icpId: profile._id, userId: req.user!._id },
    {
      messages: [
        ...conversationHistory,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: parsed.message, timestamp: new Date().toISOString() },
      ],
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  sendSuccess(res, {
    message: parsed.message,
    dataExtracted: parsed.dataExtracted || {},
    progress: parsed.progress || { percentComplete: 0 },
    suggestedQuestion: parsed.suggestedQuestion,
  });
};

export const generateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.body;
  if (!campaignId) throw new BadRequestError('Campaign ID is required');

  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found for this campaign need to be created first');

  /*
    Refuse to spend on an empty profile.

    Every completeness check lived in the browser and one of the three buttons
    that reach this endpoint bypassed them, so `{"data":{}}` was accepted and
    the two characters `{}` were pasted in as the customer definition below.
    The model then wrote confident generic filler, we charged for it, and the
    product looked weak for a reason the customer could not see.

    The message names the fields, because "invalid input" gives nobody a way to
    fix it.
  */
  const d: any = profile.data || {};
  const missing: string[] = [];
  if (!d.industry) missing.push('industry');
  if (!d.roles?.length) missing.push('at least one target role');
  if (!d.solution) missing.push('what you sell');
  if (missing.length) {
    throw new BadRequestError(
      `Your ICP needs ${missing.join(', ')} before a document can be generated. Fill those in and save first.`
    );
  }

  /*
    Metered, atomically, before the paid call.

    Content and Recon both cap at 5. This endpoint had no cap and no counters,
    so a customer nudging the wording with Regenerate burned spend nobody was
    tracking. The conditional update means two quick clicks cannot both pass.
  */
  const max = profile.maxDocumentGenerations ?? 5;
  const claimed = await ICPProfile.findOneAndUpdate(
    {
      _id: profile._id,
      $or: [
        { documentGenerationCount: { $lt: max } },
        { documentGenerationCount: { $exists: false } },
      ],
    },
    { $inc: { documentGenerationCount: 1 }, $set: { maxDocumentGenerations: max } },
    { new: true }
  );
  if (!claimed) {
    throw new ForbiddenError(
      `You have used all ${max} ICP document generations for this campaign.`
    );
  }

  const prompt = `
Act as an elite founder-led GTM strategist, B2B growth architect, LinkedIn GTM engineer, unicorn-level positioning expert, and customer intelligence analyst.

Your job is to take raw client onboarding notes and turn them into a clean Client Master ICP foundation, as the "ICP Document".

Do NOT overcomplicate.
Do NOT create fluffy marketing language.
Do NOT invent unsupported claims.
Do NOT create a new campaign yet.

Create a clean, reusable client truth document that Video Funker can use for ICP, targeting, content, and outbound.

INPUT:

${JSON.stringify(profile.data || {}, null, 2)}

OUTPUT STRUCTURE:

# 1. Company Overview

- What the company does
- Who it serves
- Why it matters

# 2. Solution Definition

- Clear description of the solution
- Service, software, or both
- What problem it solves in less than 2 sentences

# 3. Strategic Value

- What the solution changes at the business level
- Why executives care

# 4. Tactical Value

- What the solution helps teams do operationally
- What workflows, processes, or activities improve

# 5. Technical Value

- What the solution does technically
- What systems, data, automation, infrastructure, AI, platform, or process capabilities matter

# 6. Unique Technical Feature

- What is technically differentiated
- What competitors may not have
- Why this matters to buyers

# 7. Initial ICP

- Best-fit company types
- Best-fit buyer titles
- Company size
- Industry
- Buyer pain
- Buyer triggers

# 8. Buyer Psychology

- Why the buyer would care now
- What pressure they are under
- What they fear
- What outcome they want

# 9. Positioning Foundation

- Simple positioning statement
- Founder-led narrative angle
- What Video Funker should avoid saying

#10. Content Direction
- Client-provided topic ideas
- Recommended stronger topic angles if needed
- Whether article, long-form post, video, or combination is best

#11. Missing Information
List any unclear details that must be clarified before campaign launch.

FINAL RULE:
This should be clear enough that a new operator can understand the client in 10 minutes.


IMPORTANT:

- Only use information present in the provided data.
- Do not invent facts, metrics, customers, or capabilities.
- If information is missing, acknowledge the limitation instead of making assumptions.
- Return a clean, professional ICP foundation document that can be reused throughout Video Funker.
`;

  const completion = await getOpenAI().chat.completions.create({
    model: chatModel(),
    messages: [
      { role: 'system', content: 'You are an expert B2B sales document writer. Create clear, actionable ICP documents.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 2000,
  });

  const content = completion.choices[0].message.content || '';

  /*
    Keep the document in the database, not only on disk.

    It was written to a file and held in browser memory, so a page reload lost
    it and the only way back to something the customer had paid for was
    downloading a .txt. Storing the text means the preview can render it on
    every visit, and means a regeneration no longer destroys the only copy of
    the previous version the moment it starts.
  */
  await ICPProfile.updateOne(
    { _id: profile._id },
    { $set: { generatedDocument: content, generatedAt: new Date() } }
  );

  // Save generated document to /uploads/campaigns/{campaignId}/icp/
  const icpDir = path.join(UPLOADS_ROOT, campaignId, 'icp');
  if (!fs.existsSync(icpDir)) fs.mkdirSync(icpDir, { recursive: true });

  const txtPath = path.join(icpDir, 'icp-report.txt');
  const jsonPath = path.join(icpDir, 'icp-report.json');

  fs.writeFileSync(txtPath, content, 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    campaignId,
    data: profile.data,
    content,
  }, null, 2), 'utf-8');

  // Update profile with file path and status
  profile.status = 'active';
  profile.generatedFilePath = `/uploads/campaigns/${campaignId}/icp/icp-report.txt`;
  await profile.save();

  sendSuccess(res, {
    content,
    campaignId,
    filePath: profile.generatedFilePath,
    generatedAt: new Date().toISOString(),
  });
};

export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found for this campaign');
  if (!profile.generatedFilePath) throw new NotFoundError('No generated document found');

  const absolutePath = path.join(__dirname, '../..', profile.generatedFilePath);
  if (!fs.existsSync(absolutePath)) throw new NotFoundError('Document file not found on disk');

  res.download(absolutePath, `icp-report-${campaignId}.txt`);
};


/**
 * Suggests more options for one ICP field, tailored to the ICP so far.
 *
 * The static lists in the browser are a good floor — instant, free, and they
 * stop the three hardest fields being blank boxes. They are also generic to an
 * industry: a ten-person startup and a thousand-person enterprise selling
 * different things get identical buying triggers, because a hand-written table
 * cannot know what the customer actually sells.
 *
 * This reads what they have already filled in — the solution, the size, the
 * region, the roles — and proposes options that fit that specific business.
 * It is the difference between "Raised a Series A" and a trigger that only
 * makes sense for what this company sells.
 *
 * Metered, because it is a paid call reachable from a button. That was the
 * exact mistake the ICP document endpoint made.
 */
const SUGGESTABLE: Record<string, string> = {
  roles: 'job titles of the people who decide or influence this purchase',
  painPoints: 'specific, concrete problems this buyer is living with',
  buyingTriggers: 'observable events that signal this buyer is ready to buy',
  messagingAngles: 'angles the messaging could take with this buyer',
};

const MAX_SUGGESTION_CALLS = 20;

export const suggestIcpOptions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId, field } = req.body || {};
  if (!campaignId) throw new BadRequestError('campaignId is required');

  const wanted = SUGGESTABLE[String(field)];
  if (!wanted) {
    throw new BadRequestError(`field must be one of: ${Object.keys(SUGGESTABLE).join(', ')}`);
  }

  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('Save your ICP before asking for suggestions.');

  const d: any = profile.data || {};
  if (!d.industry && !d.solution) {
    throw new BadRequestError(
      'Add your industry or what you sell first — otherwise the suggestions would be generic.'
    );
  }

  // Claimed atomically, so a double-click cannot spend two.
  const used = (profile as any).suggestionCalls ?? 0;
  const claimed = await ICPProfile.findOneAndUpdate(
    {
      _id: profile._id,
      $or: [
        { suggestionCalls: { $lt: MAX_SUGGESTION_CALLS } },
        { suggestionCalls: { $exists: false } },
      ],
    },
    { $inc: { suggestionCalls: 1 } },
    { new: true }
  );
  if (!claimed) {
    throw new ForbiddenError(
      `You have used all ${MAX_SUGGESTION_CALLS} suggestion requests for this ICP.`
    );
  }

  const context = [
    d.industry && `Industry: ${d.industry}`,
    d.companySize && `Company size: ${d.companySize}`,
    d.regions?.length && `Regions: ${d.regions.join(', ')}`,
    d.solution && `What we sell: ${d.solution}`,
    d.roles?.length && `Roles already listed: ${d.roles.join(', ')}`,
    d.painPoints?.length && `Pain points already listed: ${d.painPoints.join(', ')}`,
    d.buyingTriggers?.length && `Buying triggers already listed: ${d.buyingTriggers.join(', ')}`,
    d.additionalNotes && `Notes: ${d.additionalNotes}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are a B2B demand generation strategist.

Propose 6 options for one field of an ideal customer profile: ${wanted}.

${context}

RULES
- Specific to this business, not generic to the industry.
- Do not repeat anything already listed above.
- Each option is a short phrase a person would recognise, not a sentence of marketing copy.
- Maximum 9 words each.
- No invented statistics, company names or product names.

Return ONLY a JSON array of strings. No commentary.`;

  const completion = await getOpenAI().chat.completions.create({
    model: chatModel(),
    messages: [
      { role: 'system', content: 'You return only valid JSON arrays of strings.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });

  let options: string[] = [];
  try {
    const raw = JSON.parse(completion.choices[0].message.content || '[]');
    if (Array.isArray(raw)) {
      const existing: string[] = Array.isArray(d[String(field)]) ? d[String(field)] : [];
      options = raw
        .filter((x: unknown): x is string => typeof x === 'string')
        .map((x) => x.trim())
        .filter((x) => x && !existing.includes(x))
        .slice(0, 6);
    }
  } catch {
    /* handled below */
  }

  if (!options.length) {
    // Give the call back — an unusable response should not cost one.
    await ICPProfile.updateOne({ _id: profile._id }, { $inc: { suggestionCalls: -1 } });
    throw new AppError('Could not come up with anything useful. Try again in a moment.', 502);
  }

  sendSuccess(res, {
    options,
    remaining: Math.max(MAX_SUGGESTION_CALLS - (used + 1), 0),
  });
};

export const getAdaptiveQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found for this campaign');

  const prompt = `Based on this current ICP data, what are the most important questions to ask next?

Current ICP Data: ${JSON.stringify(profile.data || {}, null, 2)}

Return a JSON array of 3-5 questions:
[{ "question": "...", "field": "...", "priority": "high/medium/low", "examples": ["..."] }]`;

  const completion = await getOpenAI().chat.completions.create({
    model: chatModel(),
    messages: [
      { role: 'system', content: 'You are an ICP expert. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  let questions: any[] = [];
  try {
    questions = JSON.parse(completion.choices[0].message.content || '[]');
  } catch { /* empty */ }

  sendSuccess(res, questions);
};
