/**
 * One-time backfill for record-independent usage tracking.
 *
 * Run with: ts-node src/scripts/backfillUsage.ts  (or via your build pipeline)
 *
 * - Seeds a Free lifetime UsageRecord from User.lifetimeCampaignsCreated.
 * - Seeds Pro current-cycle UsageRecord from campaigns in the active window.
 * - Sets Campaign.videoGenerated / regenerationUsed from existing video counts.
 *
 * Idempotent: re-running will not double-count (uses upsert + flag checks).
 */
import '../config/env';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Campaign from '../models/Campaign';
import Video from '../models/Video';
import Subscription from '../models/Subscription';
import UsageRecord from '../models/UsageRecord';
import { computeIsActive } from '../utils/subscription.utils';

const getProWindow = (end: Date): { start: Date; end: Date } => {
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  return { start, end };
};

const run = async (): Promise<void> => {
  await connectDB();
  console.log('Connected. Starting usage backfill...');

  const users = await User.find().select('_id lifetimeCampaignsCreated');
  for (const user of users) {
    const userId = user._id;
    const sub = await Subscription.findOne({ userId });
    const isPaid =
      !!sub &&
      !!sub.planId &&
      sub.planId !== 'free' &&
      computeIsActive(sub.status, sub.currentPeriodEnd ?? null);

    if (isPaid && sub!.currentPeriodEnd) {
      const { start, end } = getProWindow(sub!.currentPeriodEnd);
      const used = await Campaign.countDocuments({
        userId,
        createdAt: { $gte: start, $lt: end },
      });
      await UsageRecord.findOneAndUpdate(
        { userId, billingPeriodEnd: end },
        { $setOnInsert: { billingPeriodStart: start, campaignsUsed: used } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      // Free lifetime record seeded from the existing counter.
      const used = user.lifetimeCampaignsCreated ?? 0;
      await UsageRecord.findOneAndUpdate(
        { userId, billingPeriodEnd: null },
        { $setOnInsert: { billingPeriodStart: null, campaignsUsed: used } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }
  console.log(`Backfilled usage records for ${users.length} users.`);

  // Reconstruct per-campaign video counters from existing video counts.
  const campaigns = await Campaign.find().select(
    '_id videoGenerated regenerationUsed videosUsed regenerationsUsed'
  );
  let updated = 0;
  for (const campaign of campaigns) {
    const videoCount = await Video.countDocuments({ campaignId: campaign._id });
    // Treat the first generation as a video, any extras as regenerations.
    const seedVideos = Math.min(videoCount, 1);
    const seedRegens = Math.max(videoCount - 1, 0);
    const videosUsed = Math.max(campaign.videosUsed ?? (campaign.videoGenerated ? 1 : 0), seedVideos);
    const regenerationsUsed = Math.max(
      campaign.regenerationsUsed ?? (campaign.regenerationUsed ? 1 : 0),
      seedRegens
    );
    const videoGenerated = videosUsed >= 1;
    const regenerationUsed = regenerationsUsed >= 1;
    if (
      videosUsed !== campaign.videosUsed ||
      regenerationsUsed !== campaign.regenerationsUsed ||
      videoGenerated !== campaign.videoGenerated ||
      regenerationUsed !== campaign.regenerationUsed
    ) {
      campaign.videosUsed = videosUsed;
      campaign.regenerationsUsed = regenerationsUsed;
      campaign.videoGenerated = videoGenerated;
      campaign.regenerationUsed = regenerationUsed;
      await campaign.save();
      updated += 1;
    }
  }
  console.log(`Updated video counters on ${updated} campaigns.`);

  await mongoose.disconnect();
  console.log('Backfill complete.');
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
