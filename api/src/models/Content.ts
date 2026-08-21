import mongoose, { Document } from 'mongoose';

export type SectionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type SectionKey =
  | 'research'
  | 'article'
  | 'videoScript'
  | 'captions'
  | 'linkedinPosts'
  | 'outboundScripts'
  | 'linkedinImage'
  | 'longForm';

export interface ISectionState {
  status: SectionStatus;
  error?: string;
  /*
    Set when the model hit its token ceiling mid-sentence. Nothing checked
    finish_reason, so a LinkedIn plan asked for eight posts and cut off after
    five was stored as "completed" with a green tick and no warning.
  */
  truncated?: boolean;
}

export interface IContent extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  topic: string;
  /*
    The server-composed brief the prompts actually consume.

    `topic` stays exactly what the customer typed, because that is what the
    screen shows them. This is topic + angle + audience + intended outcome +
    the standing requirements, built in campaignBrief.ts. Keeping them apart
    means the UI never has to display a 900-character instruction block as if
    it were the campaign's name.
  */
  brief?: string;
  briefSpec?: Record<string, any>;
  research: string;
  article: string;
  script: string;
  captions: Record<string, any>;
  // New prose fields (contentPrompts.ts output)
  captionsText: string;
  linkedinPosts: string;
  outboundScripts: string;
  linkedinImagePrompt: string;
  longFormPost: string;
  sections: Record<SectionKey, ISectionState>;
  regenerationCount: number;
  maxRegenerations: number;
  filePaths: {
    research?: string;
    article?: string;
    script?: string;
    captions?: string;
  };
}

const sectionStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    error: { type: String, default: '' },
    truncated: { type: Boolean, default: false },
  },
  { _id: false }
);

const defaultSectionState = () => ({ status: 'pending' as SectionStatus, error: '' });

const contentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    topic: { type: String, required: true },
    brief: { type: String, default: '' },
    briefSpec: { type: mongoose.Schema.Types.Mixed, default: null },
    research: { type: String, default: '' },
    article: { type: String, default: '' },
    script: { type: String, default: '' },
    captions: { type: mongoose.Schema.Types.Mixed, default: {} },
    captionsText: { type: String, default: '' },
    linkedinPosts: { type: String, default: '' },
    outboundScripts: { type: String, default: '' },
    linkedinImagePrompt: { type: String, default: '' },
    longFormPost: { type: String, default: '' },
    sections: {
      type: {
        research: sectionStateSchema,
        article: sectionStateSchema,
        videoScript: sectionStateSchema,
        captions: sectionStateSchema,
        linkedinPosts: sectionStateSchema,
        outboundScripts: sectionStateSchema,
        linkedinImage: sectionStateSchema,
        longForm: sectionStateSchema,
      },
      default: () => ({
        research: defaultSectionState(),
        article: defaultSectionState(),
        videoScript: defaultSectionState(),
        captions: defaultSectionState(),
        linkedinPosts: defaultSectionState(),
        outboundScripts: defaultSectionState(),
        linkedinImage: defaultSectionState(),
        longForm: defaultSectionState(),
      }),
    },
    regenerationCount: { type: Number, default: 0 },
    maxRegenerations: { type: Number, default: 5 },
    filePaths: {
      research: String,
      article: String,
      script: String,
      captions: String,
    },
  },
  { timestamps: true }
);

contentSchema.index({ campaignId: 1, userId: 1 });

export default mongoose.model<IContent>('Content', contentSchema);

