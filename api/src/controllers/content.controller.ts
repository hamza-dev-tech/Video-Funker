import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Content, { SectionKey } from '../models/Content';
import ICPProfile from '../models/ICPProfile';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../errors';
import fs from 'fs';
import path from 'path';
import { assertCanRegenerateContent } from '../services/content-usage.service';
import { runAllSections, runSingleSection } from '../services/content-generation.service';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, data: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data, 'utf-8');
}

const SECTION_KEYS: SectionKey[] = [
  'research',
  'article',
  'videoScript',
  'captions',
  'linkedinPosts',
  'outboundScripts',
  'linkedinImage',
  'longForm',
];

const allPending = () =>
  SECTION_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: { status: 'pending' as const, error: '' } }),
    {} as Record<SectionKey, { status: 'pending'; error: string }>
  );

/**
 * Create a content generation job. Returns immediately with the doc set to
 * all-pending, then kicks off sequential background generation (fire-and-forget).
 */
export const generateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId, topic } = req.body;
  if (!campaignId || !topic) throw new BadRequestError('campaignId and topic are required');

  const icp = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!icp) throw new NotFoundError('ICP not found for this campaign. Please create ICP first.');

  // Enforce per-campaign regeneration limit on re-generations.
  const existingContent = await Content.findOne({ campaignId, userId: req.user!._id });
  let nextRegenerationCount = 0;
  let nextMaxRegenerations = 5;
  if (existingContent) {
    const usage = assertCanRegenerateContent(existingContent);
    nextRegenerationCount = usage.used + 1;
    nextMaxRegenerations = usage.max;
  }

  const content = await Content.findOneAndUpdate(
    { campaignId, userId: req.user!._id },
    {
      topic,
      research: '',
      article: '',
      script: '',
      captions: {},
      captionsText: '',
      linkedinPosts: '',
      outboundScripts: '',
      linkedinImagePrompt: '',
      longFormPost: '',
      sections: allPending(),
      regenerationCount: nextRegenerationCount,
      maxRegenerations: nextMaxRegenerations,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Fire-and-forget: do not block the response on AI generation. The catch is
  // not optional — an unhandled rejection here kills the process for everyone.
  void runAllSections(String(content._id), String(campaignId), String(req.user!._id)).catch((err) => {
    console.error('runAllSections failed', err);
  });

  sendSuccess(res, content, 201);
};

export const getByCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  const content = await Content.findOne({ campaignId: req.params.campaignId, userId: req.user!._id });
  if (!content) throw new NotFoundError('No content found for this campaign');
  sendSuccess(res, content);
};

/** Regenerate a single section only. Returns immediately, regenerates in background. */
export const regenerateSection = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId, section } = req.params;
  if (!SECTION_KEYS.includes(section as SectionKey)) {
    throw new BadRequestError('Invalid section');
  }

  const content = await Content.findOne({ campaignId, userId: req.user!._id });
  if (!content) throw new NotFoundError('No content found for this campaign');

  /*
    Metered, like Regenerate All.

    The limit was enforced on the whole-campaign path only, so the eight small
    refresh icons and the Retry button on a failed section called OpenAI with no
    cap and no counter — including while the screen was showing "Limit Reached".
    The only spend control in this flow was bypassed by using the more
    convenient button.

    Counted before the work starts, so two quick clicks cannot both pass.
  */
  const usage = assertCanRegenerateContent(content);
  await Content.updateOne(
    { _id: content._id },
    {
      $set: {
        regenerationCount: usage.used + 1,
        maxRegenerations: usage.max,
        [`sections.${section}.status`]: 'processing',
        [`sections.${section}.error`]: '',
        [`sections.${section}.truncated`]: false,
      },
    }
  );

  void runSingleSection(
    String(content._id),
    String(campaignId),
    String(req.user!._id),
    section as SectionKey
  ).catch((err) => {
    // Unhandled rejections terminate the process on modern Node, taking the API
    // down for every user because one customer's section failed.
    console.error('runSingleSection failed', err);
  });

  const updated = await Content.findById(content._id);
  sendSuccess(res, updated);
};

export const updateScript = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const { script } = req.body;

  if (typeof script !== 'string' || !script.trim()) {
    throw new BadRequestError('Script content cannot be empty');
  }
  if (script.length > 2500) {
    throw new BadRequestError('Script must be 2500 characters or fewer');
  }

  const content = await Content.findOne({ campaignId, userId: req.user!._id });
  if (!content) throw new NotFoundError('No content found for this campaign');

  content.script = script;
  await content.save();

  try {
    const baseDir = path.resolve(__dirname, '../../uploads/campaigns', campaignId as string, 'content');
    writeFile(path.join(baseDir, 'script.txt'), script);
  } catch {
    // Non-fatal: DB is the source of truth
  }

  sendSuccess(res, content);
};
