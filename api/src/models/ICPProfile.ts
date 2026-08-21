import mongoose, { Document } from 'mongoose';

export interface IICPProfile extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  name: string;
  status: 'draft' | 'active' | 'archived';
  data?: {
    industry?: string;
    companySize?: string;
    roles?: string[];
    painPoints?: string[];
    buyingTriggers?: string[];
    regions?: string[];
    messagingAngles?: string[];
    solution?: string;
    contentTone?: string;
    additionalNotes?: string;
  };
  generatedFilePath?: string | null;
  /** The generated document itself, so a page reload does not lose it. */
  generatedDocument?: string | null;
  generatedAt?: Date | null;
  /*
    Document generations are metered like Content and Recon.

    This was the only paid AI endpoint in the product with no cap of any kind
    and no counters on the model, while three separate buttons pointed at it.
  */
  documentGenerationCount: number;
  maxDocumentGenerations: number;
}

const icpProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    name: { type: String, default: 'Untitled ICP' },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    data: {
      industry: String,
      companySize: String,
      roles: [String],
      painPoints: [String],
      buyingTriggers: [String],
      regions: [String],
      messagingAngles: [String],
      solution: String,
      contentTone: String,
      additionalNotes: String,
    },
    generatedFilePath: { type: String, default: null },
    generatedDocument: { type: String, default: null },
    generatedAt: { type: Date, default: null },
    documentGenerationCount: { type: Number, default: 0, min: 0 },
    maxDocumentGenerations: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true }
);

// Ensure one ICP per campaign
icpProfileSchema.index({ campaignId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IICPProfile>('ICPProfile', icpProfileSchema);
