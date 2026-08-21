import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import Campaign from '../models/Campaign';
import Content from '../models/Content';
import ICPProfile from '../models/ICPProfile';
import ReconInsight from '../models/ReconInsight';
import Video from '../models/Video';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../errors';
import { incrementCampaignUsage } from '../services/usage.service';

const UPLOADS_ROOT = path.join(__dirname, '../..', 'uploads', 'campaigns');

const SUBFOLDERS = ['icp', 'data', 'content', 'videos', 'avatars', 'reports'];

function initCampaignFolders(campaignId: string) {
  const campaignDir = path.join(UPLOADS_ROOT, campaignId);
  for (const sub of SUBFOLDERS) {
    const dir = path.join(campaignDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  /*
    Archived campaigns are hidden unless asked for.

    The delete dialog offers Archive as the safe alternative and says "the
    campaign disappears from your list" — but nothing filtered, so it stayed
    exactly where it was with a grey badge. A customer archiving to tidy up saw
    no change and reached for Delete instead, which on the free plan destroyed
    their only campaign and their only lifetime campaign credit.

    ?status=archived returns just those, ?status=all returns everything, so the
    client can offer a real "Show archived" toggle.
  */
  const requested = String(req.query.status || '');
  const filter: Record<string, unknown> = { userId: req.user!._id };

  if (requested === 'all') {
    // no status constraint
  } else if (requested) {
    filter.status = requested;
  } else {
    filter.status = { $ne: 'archived' };
  }

  const campaigns = await Campaign.find(filter).sort('-createdAt');

  /*
    What state is each campaign actually in?

    The card showed name, status, description and a date — none of which answer
    the only question worth asking on the first screen after login: where was I?
    Whether a campaign has an ICP, has generated content, or has a finished
    video was known to the server and never sent.

    Three grouped counts rather than three queries per campaign: this is the
    landing page, and an N+1 here would be felt on every sign-in.
  */
  const ids = campaigns.map((c) => c._id);
  const [icps, contents, videos] = await Promise.all([
    ICPProfile.find({ campaignId: { $in: ids }, userId: req.user!._id }).select('campaignId'),
    Content.find({ campaignId: { $in: ids }, userId: req.user!._id }).select('campaignId'),
    Video.find({
      campaignId: { $in: ids },
      userId: req.user!._id,
      isDeleted: { $ne: true },
      status: 'completed',
    }).select('campaignId'),
  ]);

  const icpFor = new Set(icps.map((i) => String(i.campaignId)));
  const contentFor = new Set(contents.map((c) => String(c.campaignId)));
  const videoCounts = videos.reduce<Record<string, number>>((acc, v) => {
    const key = String(v.campaignId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const enriched = campaigns.map((c) => {
    const key = String(c._id);
    return {
      ...c.toObject(),
      hasIcp: icpFor.has(key),
      hasContent: contentFor.has(key),
      videoCount: videoCounts[key] || 0,
    };
  });

  sendSuccess(res, enriched);
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!campaign) throw new NotFoundError('Campaign not found');
  sendSuccess(res, campaign);
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name?.trim()) throw new BadRequestError('Campaign name is required');

  const campaign = await Campaign.create({
    userId: req.user!._id,
    name: name.trim(),
    description: description || '',
  });

  // Track campaign consumption explicitly (independent of content records).
  await incrementCampaignUsage(req.user!._id.toString());

  // Initialize folder structure
  initCampaignFolders(campaign._id.toString());

  sendSuccess(res, campaign, 201);
};

/*
  What a customer is allowed to change about their own campaign.

  This endpoint used to pass `req.body` straight into findOneAndUpdate, which
  meant the request body could set ANY field on the schema. Two of those fields,
  videosUsed and regenerationsUsed, are the only thing standing between a
  customer and unlimited paid HeyGen renders on our bill — one request from the
  browser console reset them to zero. `userId` was writable too, which handed
  the campaign to another account.

  An allowlist rather than a denylist: a field added to the schema later is
  server-controlled by default, instead of silently becoming customer-writable.
*/
const CUSTOMER_EDITABLE = ['name', 'description', 'status'] as const;

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  const updates: Record<string, unknown> = {};
  for (const key of CUSTOMER_EDITABLE) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError(
      `Nothing to update. You can change: ${CUSTOMER_EDITABLE.join(', ')}.`
    );
  }

  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!campaign) throw new NotFoundError('Campaign not found');
  sendSuccess(res, campaign);
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
  if (!campaign) throw new NotFoundError('Campaign not found');

  const campaignId = campaign._id;
  const userId = req.user!._id;

  /*
    Actually delete everything in the campaign.

    Only this row and one uploads folder were removed. Every Content record —
    holding complete generated articles and video scripts — plus every Video,
    ICP and Recon record survived, orphaned and invisible, while the
    confirmation dialog told the customer "Everything in it goes: the ICP, the
    generated content, and every video filmed for it."

    That is a broken promise about data retention, not untidiness. The account
    deletion path already knew the full list of collections; this is that list
    scoped to a single campaign.
  */
  await Promise.all([
    Content.deleteMany({ campaignId, userId }),
    ICPProfile.deleteMany({ campaignId, userId }),
    ReconInsight.deleteMany({ campaignId, userId }),
    Video.deleteMany({ campaignId, userId }),
  ]);

  // Clean up campaign files
  const campaignDir = path.join(UPLOADS_ROOT, campaign._id.toString());
  if (fs.existsSync(campaignDir)) {
    fs.rmSync(campaignDir, { recursive: true, force: true });
  }

  sendSuccess(res, { message: 'Campaign deleted' });
};
