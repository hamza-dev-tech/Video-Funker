import mongoose, { Document } from 'mongoose';

export interface IReconInsight extends Document {
  userId: mongoose.Types.ObjectId;
  icpId?: mongoose.Types.ObjectId | null;
  campaignId?: mongoose.Types.ObjectId | null;
  documentHash?: string | null;
  insights?: any;
  processedAt?: Date | null;
  regenerationCount: number;
  maxRegenerations: number;
  reportFilePath?: string | null;
  reportGeneratedAt?: Date | null;
}

const reconInsightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    icpId: { type: mongoose.Schema.Types.ObjectId, ref: 'ICPProfile', default: null },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
    documentHash: { type: String, default: null },
    insights: { type: mongoose.Schema.Types.Mixed, default: null },
    processedAt: { type: Date, default: null },
    regenerationCount: { type: Number, default: 0 },
    maxRegenerations: { type: Number, default: 5 },
    reportFilePath: { type: String, default: null },
    reportGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IReconInsight>('ReconInsight', reconInsightSchema);
