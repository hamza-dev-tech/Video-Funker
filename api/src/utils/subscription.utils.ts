import { ISubscription } from '../models/Subscription';
import {
  ACTIVE_STATUSES,
  SubscriptionStatus,
  SubscriptionView,
} from '../types/subscription.types';

type SubLike = Pick<
  ISubscription,
  | 'status'
  | 'planId'
  | 'planName'
  | 'priceId'
  | 'billingInterval'
  | 'currentPeriodEnd'
  | 'cancelAtPeriodEnd'
  | 'latestInvoiceStatus'
  | 'latestPaymentAt'
> | null;

const emptyView: SubscriptionView = {
  status: 'none',
  planId: null,
  planName: null,
  priceId: null,
  billingInterval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  latestInvoiceStatus: null,
  latestPaymentAt: null,
  isActive: false,
};

/** True when the status grants premium access and the period hasn't lapsed. */
export const computeIsActive = (
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null
): boolean => {
  const notExpired = !currentPeriodEnd || currentPeriodEnd.getTime() > Date.now();
  return ACTIVE_STATUSES.includes(status) && notExpired;
};

/** Map a persisted subscription document into the API view shape. */
export const toSubscriptionView = (sub: SubLike): SubscriptionView => {
  if (!sub) return { ...emptyView };
  return {
    status: sub.status,
    planId: sub.planId ?? null,
    planName: sub.planName ?? null,
    priceId: sub.priceId ?? null,
    billingInterval: sub.billingInterval ?? null,
    currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    latestInvoiceStatus: sub.latestInvoiceStatus ?? null,
    latestPaymentAt: sub.latestPaymentAt ? sub.latestPaymentAt.toISOString() : null,
    isActive: computeIsActive(sub.status, sub.currentPeriodEnd ?? null),
  };
};
