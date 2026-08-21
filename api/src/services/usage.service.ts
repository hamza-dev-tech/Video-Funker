import Campaign, { ICampaign } from '../models/Campaign';
import Subscription from '../models/Subscription';
import UsageRecord from '../models/UsageRecord';
import VoiceClone from '../models/VoiceClone';
import { getPlanLimits, findPlanById } from '../config/plans';
import { computeIsActive } from '../utils/subscription.utils';
import { ForbiddenError, NotFoundError } from '../errors';
import { CampaignWindow, PlanId, PlanLimits } from '../types/subscription.types';

export interface CycleWindow {
  start: Date | null;
  end: Date | null;
}

export interface CampaignUsage {
  planId: PlanId;
  window: CampaignWindow;
  used: number;
  limit: number;
  remaining: number;
  cycle: CycleWindow;
  upgradeRequired: boolean;
}

export interface CampaignVideoUsage {
  campaignId: string;
  used: number;
  limit: number;
  remaining: number;
  reachedLimit: boolean;
  canGenerate: boolean;
  canRegenerate: boolean;
}

/** Resolve the active plan id for a user: the subscribed paid plan, else 'free'. */
export const getActivePlanId = async (userId: string): Promise<PlanId> => {
  const sub = await Subscription.findOne({ userId });
  if (
    sub &&
    computeIsActive(sub.status, sub.currentPeriodEnd ?? null) &&
    sub.planId &&
    sub.planId !== 'free' &&
    findPlanById(sub.planId as PlanId)
  ) {
    return sub.planId as PlanId;
  }
  return 'free';
};

/**
 * Derive the current Stripe billing-cycle window for a user.
 * Period end comes from the stored subscription; start is one month before.
 */
export const getBillingCycleWindow = async (userId: string): Promise<CycleWindow> => {
  const sub = await Subscription.findOne({ userId });
  const end = sub?.currentPeriodEnd ?? null;
  if (!end) return { start: null, end: null };
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  return { start, end };
};

/**
 * Resolve (find or create) the usage record for the user's active window.
 * Free/lifetime uses a null window; Pro uses the current billing-cycle end.
 */
const resolveUsageRecord = async (
  userId: string,
  planId: PlanId,
  cycle: CycleWindow
) => {
  const usesBillingCycle = getPlanLimits(planId).campaignWindow === 'billing_cycle';
  const windowEnd = usesBillingCycle ? cycle.end : null;
  const windowStart = usesBillingCycle ? cycle.start : null;

  const record = await UsageRecord.findOneAndUpdate(
    { userId, billingPeriodEnd: windowEnd },
    { $setOnInsert: { billingPeriodStart: windowStart, campaignsUsed: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return record;
};

/** Compute campaign-count usage for a user from the explicit usage record. */
export const getCampaignUsage = async (userId: string): Promise<CampaignUsage> => {
  const planId = await getActivePlanId(userId);
  const limits: PlanLimits = getPlanLimits(planId);

  let cycle: CycleWindow = { start: null, end: null };
  if (limits.campaignWindow === 'billing_cycle') {
    cycle = await getBillingCycleWindow(userId);
  }

  const record = await resolveUsageRecord(userId, planId, cycle);
  const used = record.campaignsUsed;
  const remaining = Math.max(limits.campaigns - used, 0);

  return {
    planId,
    window: limits.campaignWindow,
    used,
    limit: limits.campaigns,
    remaining,
    cycle,
    upgradeRequired: planId === 'free' && remaining <= 0,
  };
};

/** Throws when the user has no remaining campaign credits. */
export const assertCanCreateCampaign = async (userId: string): Promise<void> => {
  const usage = await getCampaignUsage(userId);
  if (usage.remaining > 0) return;

  if (usage.planId === 'free') {
    throw new ForbiddenError(
      "You've used your free campaign. Upgrade to Pro to create more campaigns."
    );
  }
  throw new ForbiddenError(
    `You've reached your ${usage.limit} campaigns for this billing cycle. Try again next cycle.`
  );
};

/**
 * Atomically record that a user created a campaign.
 * Increments campaignsUsed on the active window's usage record. Write-only.
 */
export const incrementCampaignUsage = async (userId: string): Promise<void> => {
  const planId = await getActivePlanId(userId);
  const usesBillingCycle = getPlanLimits(planId).campaignWindow === 'billing_cycle';
  const cycle =
    usesBillingCycle ? await getBillingCycleWindow(userId) : { start: null, end: null };
  const windowEnd = usesBillingCycle ? cycle.end : null;
  const windowStart = usesBillingCycle ? cycle.start : null;

  await UsageRecord.findOneAndUpdate(
    { userId, billingPeriodEnd: windowEnd },
    {
      $inc: { campaignsUsed: 1 },
      $setOnInsert: { billingPeriodStart: windowStart },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/** Read effective counters, falling back to legacy boolean flags. */
const readVideoCounters = (campaign: ICampaign): { videosUsed: number; regenerationsUsed: number } => {
  const videosUsed = campaign.videosUsed ?? (campaign.videoGenerated ? 1 : 0);
  const regenerationsUsed = campaign.regenerationsUsed ?? (campaign.regenerationUsed ? 1 : 0);
  return { videosUsed, regenerationsUsed };
};

const computeVideoUsage = (campaign: ICampaign, limits: PlanLimits): CampaignVideoUsage => {
  const firstGenCap = limits.videosPerCampaign;
  const regenCap = limits.regenerationsPerVideo;
  const totalCap = firstGenCap + regenCap;
  const { videosUsed, regenerationsUsed } = readVideoCounters(campaign);
  const used = videosUsed + regenerationsUsed;
  const canGenerate = videosUsed < firstGenCap;
  return {
    campaignId: campaign._id.toString(),
    used,
    limit: totalCap,
    remaining: Math.max(totalCap - used, 0),
    reachedLimit: used >= totalCap,
    canGenerate,
    canRegenerate: !canGenerate && regenerationsUsed < regenCap,
  };
};

/** Per-campaign video usage derived from explicit flags on the Campaign. */
export const getVideoUsageForCampaign = async (
  userId: string,
  campaignId: string
): Promise<CampaignVideoUsage> => {
  const planId = await getActivePlanId(userId);
  const limits = getPlanLimits(planId);
  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');
  return computeVideoUsage(campaign, limits);
};

/** Throws when the per-campaign video generation cap is reached. */
export const assertCanGenerateVideo = async (
  userId: string,
  campaignId: string
): Promise<void> => {
  const usage = await getVideoUsageForCampaign(userId, campaignId);
  if (!usage.reachedLimit) return;
  throw new ForbiddenError(
    `This campaign has reached its video limit (${usage.limit} total generations).`
  );
};

/**
 * Mark a campaign's video usage after a successful generation.
 * Fills initial video slots first, then regeneration slots.
 * Counters are never decremented, so deleting videos cannot restore credits.
 */
export const markVideoUsage = async (userId: string, campaignId: string): Promise<void> => {
  const planId = await getActivePlanId(userId);
  const limits = getPlanLimits(planId);

  /*
    Counted with an atomic conditional update, not read-modify-save.

    The old version loaded the campaign, worked out the new numbers in Node, and
    saved. Two generate requests arriving together both read the same counters
    and both wrote the same value, so the count rose by one while two videos
    rendered — one free, on our HeyGen bill. Two tabs was all it took.

    Worse, when both allowances were already spent NEITHER branch ran and the
    function saved nothing and threw nothing, so any caller that reached it past
    the limit rendered a free video and was told everything was fine.

    The $lt lives in the query, so MongoDB decides. A second request racing the
    first finds the condition no longer true and matches nothing.
  */

  // Legacy rows predate these fields; treat a missing counter as zero.
  const under = (field: string, cap: number) => ({
    $or: [{ [field]: { $lt: cap } }, { [field]: { $exists: false } }],
  });

  const asInitial = await Campaign.findOneAndUpdate(
    { _id: campaignId, userId, ...under('videosUsed', limits.videosPerCampaign) },
    { $inc: { videosUsed: 1 }, $set: { videoGenerated: true } },
    { new: true }
  );
  if (asInitial) return;

  const asRegeneration = await Campaign.findOneAndUpdate(
    { _id: campaignId, userId, ...under('regenerationsUsed', limits.regenerationsPerVideo) },
    { $inc: { regenerationsUsed: 1 }, $set: { regenerationUsed: true } },
    { new: true }
  );
  if (asRegeneration) return;

  // Nothing matched: the campaign is gone, or every allowance is spent. Both
  // are errors. Silence here is what produced free renders.
  const exists = await Campaign.exists({ _id: campaignId, userId });
  if (!exists) throw new NotFoundError('Campaign not found');
  throw new ForbiddenError(
    `This campaign has used all ${limits.videosPerCampaign} video${limits.videosPerCampaign === 1 ? '' : 's'} and all ${limits.regenerationsPerVideo} regeneration${limits.regenerationsPerVideo === 1 ? '' : 's'} on your plan.`
  );
};

/**
 * Give back a video allowance after a render we already charged for failed.
 *
 * The credit is taken the moment HeyGen accepts the job, not when it delivers,
 * and counters were never reduced. On the free plan two upstream failures could
 * consume a customer's entire allowance with nothing to show for it.
 *
 * Regenerations are refunded before initial videos: the regeneration is the
 * allowance most recently spent, so returning it leaves the counters in the
 * state they were in before the failed attempt.
 *
 * Never throws — it runs from a webhook, where a failure to refund must not
 * stop the rest of the failure handling.
 */
export const refundVideoUsage = async (userId: string, campaignId: string): Promise<void> => {
  try {
    const asRegeneration = await Campaign.findOneAndUpdate(
      { _id: campaignId, userId, regenerationsUsed: { $gt: 0 } },
      { $inc: { regenerationsUsed: -1 } }
    );
    if (asRegeneration) return;

    await Campaign.findOneAndUpdate(
      { _id: campaignId, userId, videosUsed: { $gt: 0 } },
      { $inc: { videosUsed: -1 } }
    );
  } catch (err: any) {
    console.error(`[usage] could not refund video credit on ${campaignId}: ${err?.message}`);
  }
};

/** Throws when the user has reached their plan's voice-clone limit. */
export const assertCanCreateVoiceClone = async (userId: string): Promise<void> => {
  const planId = await getActivePlanId(userId);
  const limit = getPlanLimits(planId).voiceClones;
  const used = await VoiceClone.countDocuments({
    userId,
    status: { $ne: 'deleted' },
    isDeleted: { $ne: true },
  });
  if (used < limit) return;

  if (planId === 'free') {
    throw new ForbiddenError(
      `You've reached your ${limit} voice clone limit on the Free plan. Upgrade to create more.`
    );
  }
  throw new ForbiddenError(
    `You've reached your ${limit} voice clones for the ${planId} plan. Upgrade for more.`
  );
};

/** Return every campaign for the user annotated with its per-campaign video usage. */
export const getCampaignsWithUsage = async (userId: string) => {
  const planId = await getActivePlanId(userId);
  const limits = getPlanLimits(planId);
  const campaigns = await Campaign.find({ userId }).sort('-createdAt');
  return campaigns.map((campaign) => ({
    campaign,
    usage: computeVideoUsage(campaign, limits),
  }));
};
