import mongoose, { Document } from 'mongoose';

export interface IDeletionAudit extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  fullName?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
  campaignCount: number;
  videoCount: number;
  avatarCount: number;
  reconInsightCount: number;
  contentCount: number;
  accountCreatedAt?: Date | null;
  lastLoginAt?: Date | null;
  accountAgeDays?: number | null;
  reason: string;
  feedback?: string | null;
  deletedAt: Date;
  /** Flexible JSON snapshot of all analytics for future use. */
  snapshot?: any;
}

const deletionAuditSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    email: { type: String, required: true, index: true },
    fullName: { type: String, default: null },
    plan: { type: String, default: null },
    subscriptionStatus: { type: String, default: null },
    campaignCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    avatarCount: { type: Number, default: 0 },
    reconInsightCount: { type: Number, default: 0 },
    contentCount: { type: Number, default: 0 },
    accountCreatedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    accountAgeDays: { type: Number, default: null },
    reason: { type: String, required: true },
    feedback: { type: String, default: null },
    deletedAt: { type: Date, default: Date.now },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<IDeletionAudit>('DeletionAudit', deletionAuditSchema);
