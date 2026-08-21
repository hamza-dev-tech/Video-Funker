import { apiGet, apiPost } from "@product/lib/api-client";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type PlanId = "free" | "pro" | "enterprise";
export type BillingInterval = "month" | "year";

export interface PlanPrice {
  interval: BillingInterval;
  priceId: string | null;
  amount: number;
  currency: string;
}

export interface PlanLimits {
  campaigns: number;
  campaignWindow: "lifetime" | "billing_cycle";
  videosPerCampaign: number;
  regenerationsPerVideo: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  includes?: string[],
  features: string[];
  highlight?: boolean;
  prices: PlanPrice[];
  limits?: PlanLimits;
}

export interface SubscriptionView {
  status: SubscriptionStatus;
  planId: PlanId | null;
  planName: string | null;
  priceId: string | null;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceStatus: string | null;
  latestPaymentAt: string | null;
  isActive: boolean;
}

export type CampaignWindow = "lifetime" | "billing_cycle";

export interface UsageView {
  planId: PlanId;
  campaigns: {
    used: number;
    limit: number;
    remaining: number;
    window: CampaignWindow;
  };
  cycle: {
    start: string | null;
    end: string | null;
  };
  limits: {
    videosPerCampaign: number;
    regenerationsPerVideo: number;
  };
  upgradeRequired: boolean;
}

export interface CampaignVideoUsage {
  campaignId: string;
  used: number;
  limit: number;
  remaining: number;
  reachedLimit: boolean;
  canGenerate: boolean;
  canRegenerate: boolean;
}

export async function fetchPlans(): Promise<PlanDefinition[]> {
  const { plans } = await apiGet<{ plans: PlanDefinition[] }>("/billing/plans");
  return plans;
}

export async function fetchUsage(): Promise<UsageView> {
  return apiGet<UsageView>("/billing/usage");
}

export async function fetchCampaignUsage(campaignId: string): Promise<CampaignVideoUsage> {
  return apiGet<CampaignVideoUsage>(`/billing/usage/${campaignId}`);
}

export async function fetchSubscription(): Promise<SubscriptionView> {
  return apiGet<SubscriptionView>("/billing/status");
}

export async function startCheckout(priceId?: string): Promise<string> {
  const { url } = await apiPost<{ url: string }>("/billing/checkout", { priceId });
  return url;
}

export async function openBillingPortal(): Promise<string> {
  const { url } = await apiPost<{ url: string }>("/billing/portal");
  return url;
}

export async function cancelSubscription(): Promise<SubscriptionView> {
  return apiPost<SubscriptionView>("/billing/cancel");
}

export async function resumeSubscription(): Promise<SubscriptionView> {
  return apiPost<SubscriptionView>("/billing/resume");
}

/** Format a price amount (smallest currency unit) for display. */
export function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}
