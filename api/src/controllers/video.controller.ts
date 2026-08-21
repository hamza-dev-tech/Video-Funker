import { Response, Request } from 'express';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import Video from '../models/Video';
import Campaign from '../models/Campaign';

import Content from '../models/Content';
import CustomAvatar from '../models/CustomAvatar';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError, AppError } from '../errors';
import { generateHeygenVideoService, getHeygenVideoByIdService } from './heygen.controller';
import { markVideoUsage } from '../services/usage.service';
import { deleteVideoService } from '../services/video.service';

const UPLOADS_ROOT = path.join(__dirname, '../..', 'uploads', 'campaigns');

export const generateVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId, script, heygenAvatarId, avatarType, voiceId, voiceName, voiceCloneId } = req.body;
  if (!campaignId || !script) throw new BadRequestError('campaignId and script are required');
  if (!heygenAvatarId) throw new BadRequestError('heygenAvatarId is required');
  if (!voiceId) throw new BadRequestError('voiceId is required');

  const campaign = await Campaign.findOne({ _id: campaignId, userId: req.user!._id });
  if (!campaign) throw new NotFoundError('Campaign not found');

  // Verify content exists
  const content = await Content.findOne({ campaignId, userId: req.user!._id });
  if (!content || !content.script) throw new BadRequestError('Content script must be generated first');

  const callbackUrl = `${process.env.HEYGEN_WEBHOOK_URL}`;

  /*
    Render in the shape the presenter was built for.

    Orientation used to be hard-coded to landscape in the HeyGen call. Custom
    presenters carry the shape they were generated for in presenterSpec, and
    most of our recipes are vertical — one is literally described as "the
    LinkedIn and Reels shape" — so following our own recommendation produced a
    presenter framed for a phone feed and a video cropped to 16:9.

    Stock HeyGen avatars have no spec of ours, so they keep the previous
    behaviour ('horizontal' is the valid spelling of the old 'landscape'). Only
    presenters we generated, whose intended shape we actually know, change.
  */
  const customAvatar = await CustomAvatar.findOne({
    avatar_id: heygenAvatarId,
    userId: req.user!._id,
  });
  const orientation =
    (customAvatar?.presenterSpec as any)?.orientation || 'horizontal';




  const video = await Video.create({
    userId: req.user!._id,
    campaignId,
    heygenAvatarId,
    avatarType: avatarType === 'custom' ? 'custom' : 'heygen',
    voiceId,
    voiceName: voiceName || null,
    voiceCloneId: voiceCloneId || null,
    script,
    status: 'thinking',
  });


  try {
    const heygenVideo = await generateHeygenVideoService({
      heygenAvatarId,
      voiceId,
      script,
      callback_id: video._id.toString(),
      callbackUrl,
      orientation,
    });

    video.videoId = heygenVideo.video_id;
    video.videoSessionId = heygenVideo.session_id;
    video.status = heygenVideo.status || "generating";
    video.brandKitId = heygenVideo.brand_kit_id || null;
    video.brandKit = heygenVideo.brand_kit || null;

    await video.save();

    // Record video/regeneration consumption on the campaign (never reset on delete).
    await markVideoUsage(req.user!._id.toString(), campaignId);

    sendSuccess(res, video, 201);

  } catch (error) {


    await deleteVideoService(video._id.toString(), req.user!._id.toString());

    throw error;
  }




};



export const syncVideoById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  // Scoped to the owner, like deleteVideo and downloadVideo below. Without the
  // userId any signed-in account could sync — and read back — another
  // customer's video, whose script names their prospect by name.
  const video = await Video.findOne({ _id: id, userId: req.user!._id });
  if (!video) {
    throw new NotFoundError('Video not found');
  }
  const response = await getHeygenVideoByIdService(
    video.videoId as string
  );

  if (!response) {
    throw new AppError(
      'Failed to fetch video from HeyGen',
      500
    );
  }

  video.status = response.status;

  // metadata
  video.duration = response.duration;
  video.title = response.title || '';
  // assets
  video.videoUrl = response.video_url || '';
  video.thumbnailUrl = response.thumbnail_url || '';


  await video.save();

  sendSuccess(res, video);


};


/** Statuses HeyGen can still move away from. */
const IN_FLIGHT_STATUSES = ['thinking', 'generating'];

/**
 * How stale an unfinished render must be before we re-ask HeyGen about it.
 *
 * The client polls, so without a floor every poll would fan out upstream once
 * per unfinished video. Fifteen seconds is below the client's own polling
 * interval, so it never delays a real update, and high enough that two open
 * tabs do not double the traffic.
 */
const RECONCILE_AFTER_MS = 15_000;

/**
 * Catches up on renders whose webhook never arrived.
 *
 * Only two HeyGen events were handled, and nothing reconciled if a callback was
 * lost — so a video sat on "Queued" or "Filming" forever, the elapsed clock
 * kept counting, and the credit stayed spent. There was no staleness rule and
 * no ceiling anywhere.
 *
 * A callback can go missing for ordinary reasons: HEYGEN_WEBHOOK_URL pointing
 * at a different environment than the one that created the video (which is
 * exactly what happens when a production URL is left in place while running
 * locally), a deploy landing mid-render, or a transient network failure. In
 * every one of those cases HeyGen has the finished video and simply could not
 * tell us. Asking is cheap; leaving a paid render stranded is not.
 *
 * Mirrors refreshPendingAvatars in customAvatar.service.
 */
const reconcileInFlightVideos = async (videos: any[]): Promise<void> => {
  const stale = videos.filter(
    (v) =>
      IN_FLIGHT_STATUSES.includes(v.status) &&
      v.videoId &&
      Date.now() - new Date(v.updatedAt || v.createdAt).getTime() > RECONCILE_AFTER_MS
  );
  if (!stale.length) return;

  await Promise.all(
    stale.map(async (video) => {
      try {
        const remote = await getHeygenVideoByIdService(video.videoId);
        if (!remote?.status || remote.status === video.status) return;

        const url = remote.video_url || '';

        // Same rule as the webhook: never write "completed" without a link, or
        // the card becomes a dead end with no way to recover the render.
        video.status = url ? remote.status : video.status;
        if (remote.duration) video.duration = remote.duration;
        if (remote.title) video.title = remote.title;
        if (url) video.videoUrl = url;
        if (remote.thumbnail_url) video.thumbnailUrl = remote.thumbnail_url;

        if (remote.status === 'failed') {
          video.status = 'failed';
          video.failureReason =
            (remote as any)?.error?.message || 'HeyGen reported this render as failed.';
        }

        await video.save();
      } catch {
        // Upstream unreachable or the id is unknown. Serve what we have — a
        // failed status check must never turn a working list into an error.
      }
    })
  );
};

export const getVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const videos = await Video.find({ campaignId, userId: req.user!._id, isDeleted: { $ne: true } })
    .sort('-createdAt');

  // Self-healing: a render whose callback never arrived catches up here rather
  // than waiting for someone to notice and press Sync.
  await reconcileInFlightVideos(videos);

  sendSuccess(res, videos);
};

export const getVideoById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  // Same as above: this returns the full record including the script.
  const video = await Video.findOne({ _id: id, userId: req.user!._id });
  if (!video) {
    throw new NotFoundError('Video not found');
  }

  sendSuccess(res, video);
};

export const deleteVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  const record = await Video.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!record) throw new NotFoundError('Video not found');

  // Soft delete: keep the record and file, just hide it. Usage credits are not restored.
  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();

  sendSuccess(res, { message: 'Deleted' });
};

export const downloadVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  const record = await Video.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!record) throw new NotFoundError('Video not found');

  if (!record) {
    throw new NotFoundError('Video not found');
  }

  if (!record.videoUrl) {
    throw new NotFoundError('Video URL not available');
  }

  sendSuccess(res, {
    downloadUrl: record.videoUrl,
  });
};
