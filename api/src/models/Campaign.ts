import mongoose, { Document } from 'mongoose';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  progress: number;
  /** True once a video has been generated for this campaign. Never cleared. (legacy) */
  videoGenerated: boolean;
  /** True once the single allowed regeneration has been used. Never cleared. (legacy) */
  regenerationUsed: boolean;
  /** Count of initial videos generated for this campaign. Never decremented. */
  videosUsed: number;
  /** Count of regenerations used for this campaign. Never decremented. */
  regenerationsUsed: number;
}

const campaignSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    videoGenerated: { type: Boolean, default: false },
    regenerationUsed: { type: Boolean, default: false },
    videosUsed: { type: Number, default: 0, min: 0 },
    regenerationsUsed: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>('Campaign', campaignSchema);
