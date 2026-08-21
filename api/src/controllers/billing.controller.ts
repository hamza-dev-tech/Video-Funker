import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../errors';
import * as stripeService from '../services/stripe.service';
import * as usageService from '../services/usage.service';
import { getPlanLimits } from '../config/plans';

/**
 * Where Stripe sends the user back to, INCLUDING the path the SPA is mounted at.
 *
 * This used to be `CLIENT_URL`, which was also the CORS origin, and the two
 * cannot be the same value any more: a CORS origin must be scheme://host:port
 * with no path, and the product app now lives under /app on the marketing
 * origin. Sharing one variable meant either CORS rejected every request or
 * Stripe returned the customer to https://videofunker.ai/pricing — a marketing
 * URL that does not exist — where the `?checkout=success` toast never fires and
 * a successful payment looks like a failed one. The redirect is a full page
 * navigation out of Stripe, so there is no client-side recovery from it.
 *
 * Set APP_URL to the origin plus base path (http://localhost:3000/app), or to
 * the bare origin if the SPA is ever served at the root of its own hostname.
 * The trailing slash is stripped so both forms concatenate cleanly below.
 */
const appUrl = (): string =>
  (process.env.APP_URL || 'http://localhost:3000/app').replace(/\/+$/, '');

/** GET /billing/plans — public plan catalog rendered dynamically by the frontend. */
export const getPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  sendSuccess(res, { plans: stripeService.listPlans() });
};

/** GET /billing/status — current user's subscription details. */
export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const view = await stripeService.getSubscriptionView(req.user!._id.toString());
  sendSuccess(res, view);
};

/** POST /billing/checkout — start a Stripe Checkout session. */
export const createCheckout = async (req: AuthRequest, res: Response): Promise<void> => {
  const priceId = req.body.priceId || stripeService.getDefaultPriceId();
  if (!priceId) throw new BadRequestError('A priceId is required to start checkout');

  /*
    Checkout creates a NEW subscription. It does not replace an existing one.

    So "Upgrade to Enterprise" on an account already paying for Pro produced a
    second live Stripe subscription. The customer was charged for both every
    month, and because we store one Subscription row per user the duplicate was
    invisible in our product while being perfectly visible on their card
    statement — and Cancel could only ever stop one of the two.

    Plan changes belong in the billing portal, which handles the swap with
    proration. That route already exists, one endpoint below.
  */
  const alreadySubscribed = await stripeService.hasActiveSubscription(req.user!._id.toString());
  if (alreadySubscribed) {
    throw new BadRequestError(
      'You already have an active subscription. Use "Manage billing" to change your plan — starting a new checkout would charge you twice.'
    );
  }

  const url = await stripeService.createCheckoutSession({
    userId: req.user!._id.toString(),
    email: req.user!.email,
    displayName: req.user!.displayName,
    priceId,
    successUrl: `${appUrl()}/pricing?checkout=success`,
    cancelUrl: `${appUrl()}/pricing?checkout=cancel`,
  });

  sendSuccess(res, { url });
};

/** POST /billing/portal — open the Stripe billing portal. */
export const createPortal = async (req: AuthRequest, res: Response): Promise<void> => {
  const url = await stripeService.createPortalSession(
    req.user!._id.toString(),
    `${appUrl()}/subscription`
  );
  sendSuccess(res, { url });
};

/** POST /billing/cancel — schedule cancellation at period end. */
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  const view = await stripeService.cancelSubscription(req.user!._id.toString());
  sendSuccess(res, view);
};

/** POST /billing/resume — undo a scheduled cancellation. */
export const resumeSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  const view = await stripeService.resumeSubscription(req.user!._id.toString());
  sendSuccess(res, view);
};

/** GET /billing/usage — current plan, campaign-count usage and limits. */
export const getUsage = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const campaigns = await usageService.getCampaignUsage(userId);
  const limits = getPlanLimits(campaigns.planId);

  sendSuccess(res, {
    planId: campaigns.planId,
    campaigns: {
      used: campaigns.used,
      limit: campaigns.limit,
      remaining: campaigns.remaining,
      window: campaigns.window,
    },
    cycle: {
      start: campaigns.cycle.start ? campaigns.cycle.start.toISOString() : null,
      end: campaigns.cycle.end ? campaigns.cycle.end.toISOString() : null,
    },
    limits: {
      videosPerCampaign: limits.videosPerCampaign,
      regenerationsPerVideo: limits.regenerationsPerVideo,
    },
    upgradeRequired: campaigns.upgradeRequired,
  });
};

/** GET /billing/usage/campaigns — every campaign annotated with its video usage. */
export const getCampaignsUsage = async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await usageService.getCampaignsWithUsage(req.user!._id.toString());
  sendSuccess(res, {
    campaigns: items.map(({ campaign, usage }) => ({
      id: campaign._id.toString(),
      name: campaign.name,
      ...usage,
    })),
  });
};

/** GET /billing/usage/:campaignId — per-campaign video usage. */
export const getCampaignUsage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { campaignId } = req.params;

  if (!campaignId || Array.isArray(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const usage = await usageService.getVideoUsageForCampaign(
    req.user!._id.toString(),
    campaignId
  );

  sendSuccess(res, usage);
};