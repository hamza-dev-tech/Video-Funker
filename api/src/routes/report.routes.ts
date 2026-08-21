import { Router } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as reportCtrl from '../controllers/report.controller';

const router = Router();

router.use(asyncHandler(protect));

router.get('/:campaignId', asyncHandler(reportCtrl.getCampaignReport));

export default router;
