import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Campaign from '../models/Campaign';
import ICPProfile from '../models/ICPProfile';
import Content from '../models/Content';
import Video from '../models/Video';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';

export const getCampaignReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const userId = req.user!._id;

  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  if (!campaign) throw new NotFoundError('Campaign not found');

  /*
    Counted in the database rather than in Node.

    This used to load every Content row in full — complete articles, complete
    video scripts, complete research — over the wire and into memory, purely to
    produce six integers. countDocuments does the same job without moving the
    bodies. Videos still come back as rows because the status of each one is
    needed below, but only the status field is selected.
  */
  const nonEmpty = (field: string) => ({
    campaignId,
    userId,
    [field]: { $exists: true, $nin: [null, ''] },
  });

  const [icp, contentCount, articleCount, scriptCount, researchCount, videos] =
    await Promise.all([
      ICPProfile.findOne({ campaignId, userId }).select('_id'),
      Content.countDocuments({ campaignId, userId }),
      Content.countDocuments(nonEmpty('article')),
      Content.countDocuments(nonEmpty('script')),
      Content.countDocuments(nonEmpty('research')),
      Video.find({ campaignId, userId, isDeleted: { $ne: true } }).select('status'),
    ]);

  /*
    Failed renders are not videos.

    The count ignored status entirely, so a campaign whose three renders all
    failed reported "Videos Created: 3", turned the funnel step green and ticked
    "Video Created". This is the screen a founder shows their team: it was
    reporting work that did not exist while hiding the failures that cost money.
  */
  const videoBreakdown = {
    ready: videos.filter((v: any) => v.status === 'completed').length,
    rendering: videos.filter((v: any) => v.status === 'generating' || v.status === 'thinking').length,
    failed: videos.filter((v: any) => v.status === 'failed').length,
  };

  sendSuccess(res, {
    icpCreated: !!icp,
    contentCount,
    articleCount,
    scriptCount,
    researchCount,
    /** Finished videos only. `videoBreakdown` carries the rest. */
    videoCount: videoBreakdown.ready,
    videoBreakdown,
    flags: {
      icpCompleted: !!icp,
      contentGenerated: contentCount > 0,
      videoCreated: videoBreakdown.ready > 0,
    },
    campaign: {
      name: campaign.name,
      status: campaign.status,
      createdAt: (campaign as any).createdAt,
    },
  });
};
