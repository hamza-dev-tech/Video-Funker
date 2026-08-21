import mongoose, { Document } from 'mongoose';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  script: string;
  avatarId?: mongoose.Types.ObjectId;
  heygenAvatarId?: string | null;
  avatarType: 'custom' | 'heygen';
  videoPath: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  title: string | null;
  fileName: string | null;
  duration?: number;
  videoId?: string;
  videoSessionId?: string;
  status: 'thinking' | 'generating' | 'completed' | 'failed';
  /*
    Why a render failed, and the raw callback that said so.

    The webhook was already writing `heygenRaw` — into a field that did not
    exist on this schema, so Mongoose dropped it on every write. The only thing
    that survived a failure was the word "failed", which is why customers read
    "Video generation failed. Please try creating the video again." on an
    operation that had just cost them a credit. The voice-clone model twenty
    lines away does store its reason, and shows it correctly.
  */
  failureReason?: string | null;
  heygenRaw?: unknown;
  voiceId?: string | null;
  voiceName?: string | null;
  voiceCloneId?: mongoose.Types.ObjectId | null;
  brandKitId?: string | null;
  brandKit?: Record<string, unknown> | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

const videoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    script: { type: String, required: true },
    avatarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Avatar', default: null },
    heygenAvatarId: {
      type: String,
      default: null,
    },

    avatarType: {
      type: String,
      enum: ['custom', 'heygen'],
      required: true,
    },
    videoPath: { type: String, default: null },
    fileName: { type: String, default: null },
    status: { type: String, enum: ['thinking', 'generating', 'completed', 'failed'], default: 'thinking' },
    failureReason: { type: String, default: null },
    heygenRaw: { type: mongoose.Schema.Types.Mixed, default: null },
    videoId: {
      type: String,
      default: null,
      index: true,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },

    thumbnailUrl: {
      type: String,
      default: null,
    },

    videoSessionId: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    voiceId: {
      type: String,
      default: null,
    },
    voiceName: {
      type: String,
      default: null,
    },
    voiceCloneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceClone',
      default: null,
    },
    brandKitId: {
      type: String,
      default: null,
    },
    brandKit: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

videoSchema.index({ campaignId: 1, userId: 1 });

export default mongoose.model<IVideo>('Video', videoSchema);
