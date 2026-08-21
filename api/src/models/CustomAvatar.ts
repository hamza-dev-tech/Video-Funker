import mongoose, { Document } from 'mongoose';

export type AvatarSourceType = 'prompt' | 'image_upload';

export interface ICustomAvatar extends Document {

  /** The exact prompt sent upstream, kept for regeneration and for debugging
      why a particular avatar came out the way it did. */
  heygenPrompt?: string;
  /** The structured answers behind that prompt, so "make another like this but
      older" does not mean filling the form in again. */
  presenterSpec?: Record<string, any>;

  /*
    Supplied by `{ timestamps: true }` on the schema below. Declared here
    because the interface did not list them, so every call site that read
    avatar.updatedAt — including the staleness check in customAvatar.service —
    failed to compile even though the field is always present at runtime.
  */
  createdAt: Date;
  updatedAt: Date;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  avatar_id: string;
  filePath: string;
  previewImageUrl: string;

  group_id?: string;

  avatarSourceType: AvatarSourceType;

  // Voice metadata (HeyGen voice selected during creation)
  voiceId?: string;
  voiceName?: string;
  voiceLanguage?: string;
  voiceGender?: string;
  previewAudioUrl?: string;

  status?: 'processing' | 'completed' | 'failed';

  preview_image_url?: string;

  image_height?: number;

  image_width?: number;

  isDeleted?: boolean;

  heygenRaw?: any;
}

const customAvatarSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    avatar_id: { type: String, required: true },
    filePath: { type: String, default: '' },
    previewImageUrl: { type: String, default: '' },

    group_id: {
      type: String,
      default: '',
      index: true,
    },

    heygenPrompt: { type: String, default: '' },
    presenterSpec: { type: mongoose.Schema.Types.Mixed, default: null },
    avatarSourceType: {
      type: String,
      enum: ['prompt', 'image_upload'],
      default: 'prompt',
      index: true,
    },

    voiceId: { type: String, default: '' },
    voiceName: { type: String, default: '' },
    voiceLanguage: { type: String, default: '' },
    voiceGender: { type: String, default: '' },
    previewAudioUrl: { type: String, default: '' },

    status: {
      type: String,
      enum: [
        'processing',
        'completed',
        'failed',
      ],
      default: 'processing',
      index: true,
    },

    image_height: {
      type: Number,
      default: 0,
    },

    image_width: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    heygenRaw: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomAvatar>('CustomAvatar', customAvatarSchema);
