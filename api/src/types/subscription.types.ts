export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type PlanId = 'free' | 'pro' | 'enterprise';

export type BillingInterval = 'month' | 'year';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void'
  | 'failed'
  | null;

/** Statuses that grant access to premium features. */
export const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

export interface PlanPrice {
  interval: BillingInterval;
  /** Null for free plans or plans not yet configured with a Stripe price. */
  priceId: string | null;
  /** Display amount in the smallest currency unit (e.g. cents). */
  amount: number;
  currency: string;
}

/** How a plan's campaign quota is counted. */
export type CampaignWindow = 'lifetime' | 'billing_cycle';

export interface PlanLimits {
  /** Max campaigns allowed within the counting window. */
  campaigns: number;
  /** Whether campaigns are counted lifetime or per Stripe billing cycle. */
  campaignWindow: CampaignWindow;
  /** Videos that can be generated per campaign (first generation). */
  videosPerCampaign: number;
  /** Regenerations allowed per generated video. */
  regenerationsPerVideo: number;
  /** Max voice clones a user can own. */
  voiceClones: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  includes?: string[];
  features: string[];
  highlight?: boolean;
  prices: PlanPrice[];
  limits: PlanLimits;
}

export interface SubscriptionView {
  status: SubscriptionStatus;
  planId: PlanId | null;
  planName: string | null;
  priceId: string | null;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceStatus: InvoiceStatus;
  latestPaymentAt: string | null;
  isActive: boolean;
}

export interface CreateCheckoutSessionInput {
  userId: string;
  email: string;
  displayName?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}
