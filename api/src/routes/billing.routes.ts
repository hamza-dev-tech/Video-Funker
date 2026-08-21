import { Router } from 'express';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as billing from '../controllers/billing.controller';

const router = Router();

router.use(asyncHandler(protect));

// Plans catalog (dynamic, backend-driven)
router.get('/plans', asyncHandler(billing.getPlans));

// Subscription status & details
router.get('/status', asyncHandler(billing.getStatus));

// Checkout & portal
router.post('/checkout', requireVerifiedEmail, asyncHandler(billing.createCheckout));
router.post('/portal', requireVerifiedEmail, asyncHandler(billing.createPortal));

// Lifecycle management
router.post('/cancel', asyncHandler(billing.cancelSubscription));
router.post('/resume', requireVerifiedEmail, asyncHandler(billing.resumeSubscription));

// Usage & plan limits (specific routes before the param route)
router.get('/usage', asyncHandler(billing.getUsage));
router.get('/usage/campaigns', asyncHandler(billing.getCampaignsUsage));
router.get('/usage/:campaignId', asyncHandler(billing.getCampaignUsage));

export default router;
