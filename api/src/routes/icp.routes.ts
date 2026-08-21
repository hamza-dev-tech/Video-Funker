import { Router } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as icp from '../controllers/icp.controller';
import * as ai from '../controllers/ai.controller';

const router = Router();

router.use(asyncHandler(protect));

// AI endpoints
router.post('/chat', asyncHandler(ai.chat));
router.post('/generate-document', asyncHandler(ai.generateDocument));
router.get('/download/:campaignId', asyncHandler(ai.downloadDocument));
router.get('/questions/:campaignId', asyncHandler(ai.getAdaptiveQuestions));

// CRUD - campaign-scoped
router.get('/campaign/:campaignId', asyncHandler(icp.getByCampaign));
router.post('/campaign/:campaignId', asyncHandler(icp.createOrUpdate));
router.patch('/campaign/:campaignId/data', asyncHandler(icp.updateData));
router.delete('/campaign/:campaignId', asyncHandler(icp.remove));

export default router;
