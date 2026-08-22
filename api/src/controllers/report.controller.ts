import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Campaign from '../models/Campaign';
import ICPProfile from '../models/ICPProfile';
import Content from '../models/Content';
import Video from '../models/Video';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';

/**
 * Everything one campaign produced, and the thinking behind it.
 *
 * What this replaces counted four things and stopped: an ICP flag, a content
 * count, a video count and a per-type breakdown — the same numbers restated in
 * four places, with nothing you could open and nothing explaining what the
 * campaign was even arguing. Every render was counted as a success, so three
 * failures read as "Videos Created: 3" and turned the funnel green.
 *
 * A report on a campaign should answer three questions: what were we trying to
 * say, what got made, and what still needs attention. All of that is already in
 * the database; none of it was being sent.
 *
 * Bodies are deliberately not returned — a word count says as much about an
 * article as its full text does, and moving four thousand words to render the
 * number 4,000 is what made the old endpoint slow.
 */

const SECTIONS: { key: string; label: string; field: string }[] = [
  { key: 'research', label: 'Research brief', field: 'research' },
  { key: 'article', label: 'Article', field: 'article' },
  { key: 'videoScript', label: 'Video script', field: 'script' },
  { key: 'captions', label: 'Captions', field: 'captionsText' },
  { key: 'linkedinPosts', label: 'LinkedIn posts', field: 'linkedinPosts' },
  { key: 'outboundScripts', label: 'Outbound scripts', field: 'outboundScripts' },
  { key: 'linkedinImage', label: 'Image concept', field: 'linkedinImagePrompt' },
  { key: 'longForm', label: 'Long-form post', field: 'longFormPost' },
];

const words = (text?: string): number =>
  text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

/** Human label for an angle id, mirroring campaignAngles.ts on the client. */
const ANGLE_LABEL: Record<string, string> = {
  contrarian: 'Contrarian take',
  'hidden-cost': 'The hidden cost',
  teardown: 'How we actually do it',
  'buyer-mistake': 'The mistake buyers make',
  'market-shift': "What's changing",
  scratch: 'Written from scratch',
};

const OUTCOME_LABEL: Record<string, string> = {
  book: 'book a call',
  reply: 'reply to outreach',
  rethink: 'rethink how they work today',
  follow: 'follow for more',
  share: 'share it with their team',
};

export const getCampaignReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const userId = req.user!._id;

  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');

  const [icp, content, videos] = await Promise.all([
    ICPProfile.findOne({ campaignId, userId }),
    Content.findOne({ campaignId, userId }),
    Video.find({ campaignId, userId, isDeleted: { $ne: true } })
      .select('title duration thumbnailUrl videoUrl status createdAt failureReason renderMode captions')
      .sort('-createdAt'),
  ]);

  const d: any = icp?.data || {};
  const spec: any = (content as any)?.briefSpec || {};

  /*
    Per section: whether it exists, how long it is, and whether it was cut off.
    "3 articles" told you nothing; "Article — 1,240 words" is something you can
    judge, and a failed section is named rather than hidden inside a total.
  */
  const sections = content
    ? SECTIONS.map((s) => {
        const text = (content as any)[s.field] as string | undefined;
        const state = (content.sections as any)?.[s.key] || {};
        return {
          key: s.key,
          label: s.label,
          status: state.status || (text ? 'completed' : 'pending'),
          words: words(text),
          truncated: !!state.truncated,
          error: state.error || null,
        };
      })
    : [];

  const videoRows = videos.map((v: any) => ({
    id: String(v._id),
    title: v.title || null,
    duration: v.duration ?? null,
    thumbnailUrl: v.thumbnailUrl || null,
    videoUrl: v.videoUrl || null,
    status: v.status,
    createdAt: v.createdAt,
    failureReason: v.failureReason || null,
    exactScript: v.renderMode === 'exact',
    captions: v.captions !== false,
  }));

  const videoBreakdown = {
    ready: videoRows.filter((v) => v.status === 'completed').length,
    rendering: videoRows.filter((v) => v.status === 'generating' || v.status === 'thinking').length,
    failed: videoRows.filter((v) => v.status === 'failed').length,
  };

  /*
    What still needs a person. A report that only lists successes is a report
    that hides the reason a campaign underperformed.
  */
  const attention: string[] = [];
  if (!icp) attention.push('No ICP yet — everything downstream is written blind.');
  if (icp && !d.solution) attention.push('The ICP does not say what you sell.');
  sections
    .filter((s) => s.status === 'failed')
    .forEach((s) => attention.push(`${s.label} failed to generate.`));
  sections
    .filter((s) => s.truncated)
    .forEach((s) => attention.push(`${s.label} was cut off at the length limit.`));
  if (videoBreakdown.failed) {
    attention.push(
      `${videoBreakdown.failed} video${videoBreakdown.failed > 1 ? 's' : ''} failed to render.`
    );
  }

  sendSuccess(res, {
    campaign: {
      name: campaign.name,
      status: campaign.status,
      description: campaign.description || null,
      createdAt: (campaign as any).createdAt,
    },

    /* The strategy — what this campaign was arguing, and to whom. */
    brief: content
      ? {
          topic: content.topic || null,
          angle: spec.angle ? ANGLE_LABEL[spec.angle] || null : null,
          audience: spec.audience || null,
          outcome: spec.outcome ? OUTCOME_LABEL[spec.outcome] || null : null,
          writtenAt: (content as any).updatedAt,
        }
      : null,

    audience: icp
      ? {
          industry: d.industry || null,
          companySize: d.companySize || null,
          roles: d.roles || [],
          painPoints: d.painPoints || [],
          solution: d.solution || null,
          regions: d.regions || [],
        }
      : null,

    sections,
    totalWords: sections.reduce((sum, s) => sum + s.words, 0),

    videos: videoRows,
    videoBreakdown,
    attention,

    /* Kept for anything still reading the old shape. */
    icpCreated: !!icp,
    contentCount: content ? 1 : 0,
    videoCount: videoBreakdown.ready,
    flags: {
      icpCompleted: !!icp,
      contentGenerated: !!content,
      videoCreated: videoBreakdown.ready > 0,
    },
  });
};
