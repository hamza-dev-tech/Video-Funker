import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { protect } from '../middleware/auth';
import * as linkedinCtrl from '../controllers/linkedin.controller';

const router = Router();

router.get('/auth/url', asyncHandler(protect), linkedinCtrl.getAuthUrl);
router.get('/auth/callback', asyncHandler(linkedinCtrl.authCallback)); // no protect — OAuth redirect
router.get('/auth/status', asyncHandler(protect), asyncHandler(linkedinCtrl.getAuthStatus));
router.post('/auth/disconnect', asyncHandler(protect), asyncHandler(linkedinCtrl.disconnect));

export default router;
