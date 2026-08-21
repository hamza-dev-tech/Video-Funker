import mongoose, { Document } from 'mongoose';

/**
 * Tracks campaign consumption per user, independent of any content records.
 *
 * - Free plan: a single lifetime record (billingPeriodStart/End = null).
 * - Pro plan: one record per Stripe billing cycle, keyed by billingPeriodEnd.
 *
 * `campaignsUsed` is write-only (incremented on successful campaign creation)
 * and is NEVER decremented — deleting campaigns can never restore credits.
 */
export interface IUsageRecord extends Document {
  userId: mongoose.Types.ObjectId;
  billingPeriodStart: Date | null;
  billingPeriodEnd: Date | null;
  campaignsUsed: number;
}

const usageRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billingPeriodStart: { type: Date, default: null },
    billingPeriodEnd: { type: Date, default: null },
    campaignsUsed: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One usage record per user per billing window (null window = Free lifetime).
usageRecordSchema.index({ userId: 1, billingPeriodEnd: 1 }, { unique: true });

export default mongoose.model<IUsageRecord>('UsageRecord', usageRecordSchema);
