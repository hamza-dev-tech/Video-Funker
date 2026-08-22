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
  /*
    HeyGen's own word for where this render is, kept alongside our four-state
    status.

    Measured on a real render: eleven minutes in, HeyGen reported "pending" —
    it had not started yet. Our card said "Filming" and "A few minutes", which
    is two different untruths at once. Their vocabulary is wider than ours and
    is not worth flattening away, because "waiting in a queue" and "actively
    rendering" are different things to be told.
  */
  upstreamStatus?: string | null;
  /*
    Which HeyGen pipeline produced this.

    'exact'  — POST /v2/video/generate. The script is spoken word for word.
    'agent'  — POST /v3/video-agents. HeyGen writes its own script from a prompt.

    Stored per video rather than read from config at poll time, because the two
    use different status endpoints and an old row must keep being polled the way
    it was created.
  */
  renderMode?: 'exact' | 'agent';
  /** Subtitles burned into the file. Only the exact-script path supports it. */
  captions?: boolean;
  /** Solid backdrop as #RRGGBB, or null for the avatar's own. */
  backdrop?: string | null;
  /*
    Which HeyGen rendering engine produced this.

    The largest quality lever HeyGen sells, and it was never being asked for:
    avatars in this account report support for avatar_v, avatar_iv and
    avatar_iii, while every render went out through the base pipeline. Stored
    per video so two renders of the same script can be compared honestly.
  */
  engine?: 'avatar_iii' | 'avatar_iv' | 'avatar_v';
  resolution?: '720p' | '1080p' | '4k';
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
    upstreamStatus: { type: String, default: null },
    renderMode: { type: String, enum: ['exact', 'agent'], default: 'agent' },
    captions: { type: Boolean, default: true },
    backdrop: { type: String, default: null },
    engine: { type: String, enum: ['avatar_iii', 'avatar_iv', 'avatar_v'], default: null },
    resolution: { type: String, enum: ['720p', '1080p', '4k'], default: null },
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
