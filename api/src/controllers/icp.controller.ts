import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ICPProfile from '../models/ICPProfile';
import Campaign from '../models/Campaign';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../errors';

export const getByCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found for this campaign');
  sendSuccess(res, profile);
};

export const createOrUpdate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;

  // Verify campaign exists and belongs to user
  const campaign = await Campaign.findOne({ _id: campaignId, userId: req.user!._id });
  if (!campaign) throw new NotFoundError('Campaign not found');

  const profile = await ICPProfile.findOneAndUpdate(
    { campaignId, userId: req.user!._id },
    {
      campaignId,
      userId: req.user!._id,
      name: req.body.name || campaign.name + ' ICP',
      data: req.body.data,
      status: req.body.status || 'draft',
    },
    { upsert: true, new: true, runValidators: true }
  );

  sendSuccess(res, profile, 201);
};

export const updateData = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const profile = await ICPProfile.findOne({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found for this campaign');

  profile.data = { ...(profile.data as any) || {}, ...req.body };
  await profile.save();
  sendSuccess(res, profile);
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const profile = await ICPProfile.findOneAndDelete({ campaignId, userId: req.user!._id });
  if (!profile) throw new NotFoundError('ICP profile not found');
  sendSuccess(res, { message: 'ICP deleted' });
};
