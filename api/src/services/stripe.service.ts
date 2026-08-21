import Stripe from 'stripe';
import User from '../models/User';
import Subscription from '../models/Subscription';
import {
  CreateCheckoutSessionInput,
  InvoiceStatus,
  PlanDefinition,
  SubscriptionStatus,
  SubscriptionView,
} from '../types/subscription.types';
import { BadRequestError, NotFoundError } from '../errors';
import { findPlanByPriceId, getPlanCatalog, getDefaultPriceId as resolveDefaultPriceId } from '../config/plans';
import { computeIsActive, toSubscriptionView } from '../utils/subscription.utils';

let stripeClient: Stripe | null = null;

/** Lazy singleton Stripe client so the app boots even if the key is missing. */
export const getStripe = (): Stripe => {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new BadRequestError('Stripe is not configured (missing STRIPE_SECRET_KEY)');
    stripeClient = new Stripe(key);
  }
  return stripeClient;
};

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

/** Available plans for the frontend to render dynamically. */
export const listPlans = (): PlanDefinition[] => getPlanCatalog();

/** Default monthly Pro price id, used as a checkout fallback. */
export const getDefaultPriceId = (): string | null => resolveDefaultPriceId();

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

/** Ensure the user has a Stripe customer; persist the id on User + Subscription. */
export const getOrCreateCustomer = async (
  userId: string,
  email: string,
  displayName?: string
): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email,
    name: displayName,
    metadata: { userId },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  await Subscription.findOneAndUpdate(
    { userId },
    { userId, customerId: customer.id },
    { upsert: true, new: true }
  );

  return customer.id;
};

/* ------------------------------------------------------------------ */
/* Checkout & Portal                                                   */
/* ------------------------------------------------------------------ */

/** Create a subscription Checkout Session and return its URL. */
export const createCheckoutSession = async (
  input: CreateCheckoutSessionInput
): Promise<string> => {
  const customerId = await getOrCreateCustomer(input.userId, input.email, input.displayName);

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    metadata: { userId: input.userId },
    subscription_data: { metadata: { userId: input.userId } },
  });

  if (!session.url) throw new BadRequestError('Failed to create Stripe checkout session');
  return session.url;
};

/** Create a Billing Portal session so users can manage/cancel their plan. */
export const createPortalSession = async (
  userId: string,
  returnUrl: string
): Promise<string> => {
  const user = await User.findById(userId);
  if (!user?.stripeCustomerId) throw new BadRequestError('No Stripe customer for this user');

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
};

/* ------------------------------------------------------------------ */
/* Cancel / Resume                                                     */
/* ------------------------------------------------------------------ */

const getActiveSubscriptionId = async (userId: string): Promise<string> => {
  const sub = await Subscription.findOne({ userId });
  if (!sub?.subscriptionId) throw new BadRequestError('No active subscription to manage');
  return sub.subscriptionId;
};

/** Schedule cancellation at the end of the current billing period. */
export const cancelSubscription = async (userId: string): Promise<SubscriptionView> => {
  const subscriptionId = await getActiveSubscriptionId(userId);
  const updated = await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  await syncSubscriptionFromStripe(updated);
  return getSubscriptionView(userId);
};

/**
 * End the subscription now, for account deletion.
 *
 * cancelSubscription above schedules cancellation at the period end, which is
 * right when someone chooses to stop paying but keeps their account. It is
 * wrong when the account is being erased: the customer can no longer sign in,
 * so they cannot cancel later, and the card keeps being charged. Their only
 * remaining option is a chargeback.
 *
 * Best-effort and never throws. A Stripe outage must not block a deletion the
 * customer has already confirmed through five steps and an emailed code — the
 * failure is logged loudly instead, so it can be finished by hand.
 */
export const cancelSubscriptionImmediatelyForDeletion = async (
  userId: string
): Promise<{ cancelled: boolean; reason?: string }> => {
  try {
    const subscriptionId = await getActiveSubscriptionId(userId);
    await getStripe().subscriptions.cancel(subscriptionId);
    return { cancelled: true };
  } catch (err: any) {
    const reason = err?.message || 'unknown error';
    // Loud on purpose: a customer is being deleted while still billable.
    console.error(
      `[billing] could not cancel Stripe subscription for deleted user ${userId}: ${reason}`
    );
    return { cancelled: false, reason };
  }
};

/** Undo a scheduled cancellation. */
export const resumeSubscription = async (userId: string): Promise<SubscriptionView> => {
  const subscriptionId = await getActiveSubscriptionId(userId);
  const updated = await getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  await syncSubscriptionFromStripe(updated);
  return getSubscriptionView(userId);
};

/* ------------------------------------------------------------------ */
/* Sync from Stripe                                                    */
/* ------------------------------------------------------------------ */

/** Upsert local subscription state from a Stripe Subscription object. */
export const syncSubscriptionFromStripe = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const userId =
    subscription.metadata?.userId ||
    (await User.findOne({ stripeCustomerId: customerId }))?._id?.toString();

  if (!userId) {
    console.warn('syncSubscriptionFromStripe: no userId for customer', customerId);
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const resolved = findPlanByPriceId(priceId);
  const periodEnd = (item as any)?.current_period_end ?? (subscription as any).current_period_end;

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      customerId,
      subscriptionId: subscription.id,
      status: subscription.status as SubscriptionStatus,
      planId: resolved?.plan.id ?? null,
      planName: resolved?.plan.name ?? null,
      billingInterval: resolved?.interval ?? null,
      priceId,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      metadata: {
        lastStripeSnapshot: subscription,
        syncedAt: new Date(),
      }
    },
    { upsert: true, new: true }
  );
};

/** Record the outcome of an invoice (payment succeeded / failed). */
export const recordInvoiceStatus = async (
  customerId: string,
  status: InvoiceStatus,
  paidAt?: number | null
): Promise<void> => {
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;
  await Subscription.findOneAndUpdate(
    { userId: user._id.toString() },
    {
      latestInvoiceStatus: status,
      ...(paidAt ? { latestPaymentAt: new Date(paidAt * 1000) } : {}),
    }
  );
};

/* ------------------------------------------------------------------ */
/* Views & guards                                                      */
/* ------------------------------------------------------------------ */

export const getSubscriptionView = async (userId: string): Promise<SubscriptionView> => {
  const sub = await Subscription.findOne({ userId });
  return toSubscriptionView(sub);
};

export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const sub = await Subscription.findOne({ userId });
  if (!sub) return false;
  return computeIsActive(sub.status, sub.currentPeriodEnd ?? null);
};

/** True when the user's active plan matches one of the allowed plan ids. */
export const hasPlanAccess = async (
  userId: string,
  allowedPlanIds: string[]
): Promise<boolean> => {
  const sub = await Subscription.findOne({ userId });
  if (!sub || !computeIsActive(sub.status, sub.currentPeriodEnd ?? null)) return false;
  return !!sub.planId && allowedPlanIds.includes(sub.planId);
};

/** Verify a webhook payload signature and return the event. */
export const constructWebhookEvent = (rawBody: Buffer, signature: string): Stripe.Event => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new BadRequestError('Missing STRIPE_WEBHOOK_SECRET');
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
};
