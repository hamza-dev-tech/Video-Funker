import { Router } from 'express';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as content from '../controllers/content.controller';

const router = Router();

router.use(asyncHandler(protect));

router.post('/generate', requireVerifiedEmail, asyncHandler(content.generateContent));
router.get('/:campaignId', asyncHandler(content.getByCampaign));
router.patch('/:campaignId/script', requireVerifiedEmail, asyncHandler(content.updateScript));
router.post('/:campaignId/section/:section', requireVerifiedEmail, asyncHandler(content.regenerateSection));


export default router;
