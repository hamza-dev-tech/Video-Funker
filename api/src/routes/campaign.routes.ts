import { Router } from 'express';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { enforceCampaignLimit } from '../middleware/planLimits';
import * as ctrl from '../controllers/campaign.controller';

const router = Router();

router.use(asyncHandler(protect));

router.get('/', asyncHandler(ctrl.getAll));
router.get('/:id', asyncHandler(ctrl.getOne));
router.post('/', requireVerifiedEmail, asyncHandler(enforceCampaignLimit), asyncHandler(ctrl.create));
router.put('/:id', requireVerifiedEmail, asyncHandler(ctrl.update));
router.delete('/:id', requireVerifiedEmail, asyncHandler(ctrl.remove));

export default router;
