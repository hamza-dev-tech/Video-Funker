import { BillingInterval, PlanDefinition, PlanId, PlanLimits } from '../types/subscription.types';

/**
 * Central plan catalog — the single source of truth for subscription plans.
 *
 * Currently we offer a single monthly Pro plan (plus an implicit Free tier).
 * The catalog is intentionally array-based so additional plans / intervals can
 * be added later without touching the frontend: the /billing/plans API renders
 * whatever lives here.
 *
 * Price IDs come from env so the same code works across test/live.
 * Backwards compatible: STRIPE_PRICE_MONTHLY still powers the Pro monthly price.
 */
const env = (key: string): string | null => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : null;
};

const PRO_MONTHLY = env('STRIPE_PRICE_MONTHLY');
const ENTERPRISE_MONTHLY = env('STRIPE_ENTERPRISE_MONTHLY');

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the essentials.',
    highlight: false,

    features: [
      'Unlimited avatar generation',
      '1 campaign (lifetime)',
      '1 video per campaign',
      // Regenerations are a per-CAMPAIGN pool in usage.service, not per video.
      // The old wording read as videos x regenerations and is a billing dispute.
      '1 regeneration per campaign',
      'Community support',
    ],
    prices: [{ interval: 'month', priceId: null, amount: 0, currency: 'usd' }],
    limits: {
      campaigns: 1,
      campaignWindow: 'lifetime',
      videosPerCampaign: 1,
      regenerationsPerVideo: 1,
      voiceClones: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Everything you need to run revenue campaigns.',
    highlight: true,
    includes: ['1 handcrafted campaign built by Video Funker',
      '1 long-form article',
      '1 executive LinkedIn post',
      '1-month LinkedIn content calendar',
      '1 professionally edited video (you film it, we edit it)',
      'LinkedIn outreach script',
      'Email outreach script',
      '400 highly enriched ICP leads',],
    features: [
      'Unlimited avatar generation',
      '3 campaigns per billing cycle',
      '2 videos per campaign',
      '2 regenerations per campaign',
      'Recon market insights',
      'Priority processing',
      'Email support',
    ],
    prices: [{ interval: 'month', priceId: PRO_MONTHLY, amount: 1500, currency: 'usd' }],
    limits: {
      campaigns: 3,
      campaignWindow: 'billing_cycle',
      videosPerCampaign: 2,
      regenerationsPerVideo: 2,
      voiceClones: 2,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Select',
    description: 'Co-Created with the Video Funker GTM Team.',
    highlight: false,
    includes: ['3 handcrafted campaigns built by Video Funker',
      '1 long-form article',
      '1 executive LinkedIn post',
      '1-month LinkedIn content calendar',
      '1 professionally edited video (you film it, we edit it)',
      'LinkedIn outreach script',
      'LinkedIn outreach automation',
      'Email outreach script',
      '400 highly enriched ICP leads',],
    features: [
      'Unlimited avatar generation',
      '5 campaigns per billing cycle',
      '3 videos per campaign',
      '2 regenerations per campaign',
      'Recon market insights',
      '48-hour response time',
      'Dedicated customer success manager',
      'GTM team support',
    ],
    prices: [{ interval: 'month', priceId: ENTERPRISE_MONTHLY, amount: 4900, currency: 'usd' }],
    limits: {
      campaigns: 5,
      campaignWindow: 'billing_cycle',
      videosPerCampaign: 3,
      regenerationsPerVideo: 2,
      voiceClones: 20,
    },
  },
];

/** Public catalog (all plans, including ones without configured price ids). */
export const getPlanCatalog = (): PlanDefinition[] => PLAN_CATALOG;

/** Resolve a plan + interval from a Stripe price id. */
export const findPlanByPriceId = (
  priceId: string | null | undefined
): { plan: PlanDefinition; interval: BillingInterval } | null => {
  if (!priceId) return null;
  for (const plan of PLAN_CATALOG) {
    const match = plan.prices.find((p) => p.priceId === priceId);
    if (match) return { plan, interval: match.interval };
  }
  return null;
};

/** Look up a plan definition by id. */
export const findPlanById = (planId: PlanId): PlanDefinition | undefined =>
  PLAN_CATALOG.find((p) => p.id === planId);

/** Resolve a configured Stripe price id for a plan/interval pair. */
export const resolvePriceId = (
  planId: PlanId,
  interval: BillingInterval = 'month'
): string | null => {
  const plan = findPlanById(planId);
  if (!plan) return null;
  return plan.prices.find((p) => p.interval === interval)?.priceId ?? null;
};

/** Resolve the default (monthly) Pro price id used as a checkout fallback. */
export const getDefaultPriceId = (): string | null => resolvePriceId('pro', 'month');

/** Free-plan fallback limits used when a plan can't be resolved. */
const FREE_LIMITS: PlanLimits = {
  campaigns: 1,
  campaignWindow: 'lifetime',
  videosPerCampaign: 1,
  regenerationsPerVideo: 1,
  voiceClones: 1,
};

/** Resolve the limits for a plan id, defaulting to the Free tier. */
export const getPlanLimits = (planId: PlanId): PlanLimits =>
  findPlanById(planId)?.limits ?? FREE_LIMITS;
