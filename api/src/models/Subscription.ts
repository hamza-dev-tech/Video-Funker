import mongoose, { Document } from 'mongoose';
import {
  BillingInterval,
  InvoiceStatus,
  PlanId,
  SubscriptionStatus,
} from '../types/subscription.types';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  customerId: string;
  subscriptionId: string | null;
  status: SubscriptionStatus;
  planId: PlanId | null;
  planName: string | null;
  priceId: string | null;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  latestInvoiceStatus: InvoiceStatus;
  latestPaymentAt: Date | null;
  metadata?: any
}

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    customerId: { type: String, required: true, index: true },
    subscriptionId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: [
        'none',
        'active',
        'trialing',
        'past_due',
        'canceled',
        'incomplete',
        'incomplete_expired',
        'unpaid',
      ],
      default: 'none',
    },
    planId: { type: String, enum: ['free', 'pro', 'enterprise', null], default: null },
    planName: { type: String, default: null },
    priceId: { type: String, default: null },
    billingInterval: { type: String, enum: ['month', 'year', null], default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    latestInvoiceStatus: { type: String, default: null },
    latestPaymentAt: { type: Date, default: null },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
