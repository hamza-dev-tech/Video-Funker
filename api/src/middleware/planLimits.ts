import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { BadRequestError } from '../errors';
import { assertCanCreateCampaign, assertCanGenerateVideo } from '../services/usage.service';

/**
 * Blocks campaign creation when the user has no remaining campaign credits.
 * Free: lifetime cap. Pro: per Stripe billing cycle. Use after `protect`:
 *   router.post('/', asyncHandler(enforceCampaignLimit), asyncHandler(ctrl.create))
 */
export const enforceCampaignLimit = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  await assertCanCreateCampaign(req.user!._id.toString());
  next();
};

/**
 * Blocks video generation/regeneration once a campaign's total video
 * generations (videos + regenerations) are used up, per the plan limits.
 * Reads campaignId from body or params.
 */
export const enforceVideoLimit = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const campaignId = req.body?.campaignId || req.params?.campaignId;
  if (!campaignId) throw new BadRequestError('campaignId is required');
  await assertCanGenerateVideo(req.user!._id.toString(), campaignId);
  next();
};
