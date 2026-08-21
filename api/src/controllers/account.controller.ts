import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Campaign from '../models/Campaign';
import Video from '../models/Video';
import CustomAvatar from '../models/CustomAvatar';
import ReconInsight from '../models/ReconInsight';
import Content from '../models/Content';
import ICPProfile from '../models/ICPProfile';
import Conversation from '../models/Conversation';
import UsageRecord from '../models/UsageRecord';
import Subscription from '../models/Subscription';
import VoiceClone from '../models/VoiceClone';
import LinkedInToken from '../models/LinkedInToken';
import { cancelSubscriptionImmediatelyForDeletion } from '../services/stripe.service';
import { deleteVoiceClonesOnHeygen } from '../services/voiceClone.service';
import DeletionAudit from '../models/DeletionAudit';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../errors';
import { sendAccountDeletionOtp } from '../services/email.service';

const hashOtp = (otp: string): string =>
  crypto.createHash('sha256').update(otp).digest('hex');

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');

const safeUnlink = (relPath?: string | null): void => {
  if (!relPath) return;
  try {
    const abs = path.resolve(__dirname, '..', '..', relPath.replace(/^\/+/, ''));
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      fs.unlinkSync(abs);
    }
  } catch (err) {
    console.error('Failed to delete file:', relPath, err);
  }
};

const safeRemoveDir = (absDir: string): void => {
  try {
    if (fs.existsSync(absDir)) {
      fs.rmSync(absDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Failed to remove directory:', absDir, err);
  }
};

export const sendDeleteOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id);
  if (!user) throw new BadRequestError('User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.deleteAccountOtp = hashOtp(otp);
  user.deleteAccountOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  try {
    await sendAccountDeletionOtp(user.email, otp);
  } catch (err) {
    console.error('Failed to send account deletion OTP email:', err);
    throw new BadRequestError('Failed to send verification code');
  }

  sendSuccess(res, { message: 'Verification code sent' });
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const { otp, reason, feedback } = req.body as {
    otp?: string;
    reason?: string;
    feedback?: string;
  };

  if (!reason || !reason.trim()) {
    throw new BadRequestError('A deletion reason is required');
  }
  if (reason === 'Other' && (!feedback || !feedback.trim())) {
    throw new BadRequestError('Please tell us more about your reason');
  }
  if (!otp) {
    throw new BadRequestError('Verification code is required');
  }

  const userId = req.user!._id;
  const user = await User.findById(userId).select(
    '+deleteAccountOtp +deleteAccountOtpExpire'
  );
  if (!user) throw new BadRequestError('User not found');

  if (
    !user.deleteAccountOtp ||
    !user.deleteAccountOtpExpire ||
    user.deleteAccountOtp !== hashOtp(otp) ||
    user.deleteAccountOtpExpire.getTime() < Date.now()
  ) {
    throw new BadRequestError('Invalid or expired verification code');
  }

  // 1. Aggregate analytics
  const [campaigns, videos, avatars, reconInsights, contents, subscription] =
    await Promise.all([
      Campaign.find({ userId }),
      Video.find({ userId }),
      CustomAvatar.find({ userId }),
      ReconInsight.find({ userId }),
      Content.find({ userId }),
      Subscription.findOne({ userId }),
    ]);

  const now = new Date();
  const accountAgeDays = user.get('createdAt')
    ? Math.floor(
        (now.getTime() - new Date(user.get('createdAt')).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const snapshot = {
    plan: subscription?.planId ?? null,
    subscription_status: subscription?.status ?? null,
    campaign_count: campaigns.length,
    video_count: videos.length,
    avatar_count: avatars.length,
    recon_insight_count: reconInsights.length,
    content_count: contents.length,
    account_age_days: accountAgeDays,
  };

  // 2. Create audit record first so analytics survive partial failures
  await DeletionAudit.create({
    userId,
    email: user.email,
    fullName: user.displayName ?? null,
    plan: subscription?.planId ?? null,
    subscriptionStatus: subscription?.status ?? null,
    campaignCount: campaigns.length,
    videoCount: videos.length,
    avatarCount: avatars.length,
    reconInsightCount: reconInsights.length,
    contentCount: contents.length,
    accountCreatedAt: user.get('createdAt') ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    accountAgeDays,
    reason,
    feedback: feedback?.trim() || null,
    deletedAt: now,
    snapshot,
  });

  /*
    Stop the billing before removing the account.

    Deleting an account used to remove the local Subscription row and never
    touch Stripe, so the card kept being charged, the customer could no longer
    sign in to cancel, and their only route out was a chargeback. Worse, the
    Stripe subscription still carried this userId in its metadata, so the next
    Stripe event recreated a subscription record for a user who no longer
    existed.

    Before the local rows go, so a failure here is recoverable rather than
    invisible.
  */
  if (subscription) {
    await cancelSubscriptionImmediatelyForDeletion(userId.toString());
  }

  // Ask HeyGen to forget the cloned voices before the local rows that name
  // them are removed. Best effort — see the service for why.
  await deleteVoiceClonesOnHeygen(userId.toString());

  // 3. Delete files from disk
  for (const campaign of campaigns) {
    safeRemoveDir(path.join(UPLOADS_ROOT, 'campaigns', campaign._id.toString()));
  }
  videos.forEach((v) => safeUnlink(v.videoPath));
  avatars.forEach((a) => safeUnlink(a.filePath));
  reconInsights.forEach((r) => safeUnlink(r.reportFilePath));
  contents.forEach((c) => {
    if (c.filePaths) {
      safeUnlink(c.filePaths.research);
      safeUnlink(c.filePaths.article);
      safeUnlink(c.filePaths.script);
      safeUnlink(c.filePaths.captions);
    }
  });

  // 4. Delete DB records
  await Promise.all([
    /*
      VoiceClone and LinkedInToken were both missed.

      A cloned voice is biometric data and the confirmation modal promises it is
      "permanently removed", so leaving it was a broken promise with a
      compliance edge. LinkedInToken is a live OAuth credential for a third
      party.
    */
    VoiceClone.deleteMany({ userId }),
    LinkedInToken.deleteMany({ userId }),
    Video.deleteMany({ userId }),
    CustomAvatar.deleteMany({ userId }),
    ReconInsight.deleteMany({ userId }),
    Content.deleteMany({ userId }),
    ICPProfile.deleteMany({ userId }),
    Conversation.deleteMany({ userId }),
    UsageRecord.deleteMany({ userId }),
    Subscription.deleteMany({ userId }),
    Campaign.deleteMany({ userId }),
  ]);

  // 5. Delete the user
  await User.deleteOne({ _id: userId });

  // 6. Respond
  sendSuccess(res, { message: 'Account permanently deleted' });
};
