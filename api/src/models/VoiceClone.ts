import mongoose, { Document } from 'mongoose';

export type VoiceCloneStatus = 'processing' | 'ready' | 'failed' | 'deleted';

export interface IVoiceClone extends Document {
  userId: mongoose.Types.ObjectId;
  voiceName: string;
  heygenVoiceId: string;
  language?: string;
  gender?: string;
  previewAudioUrl?: string;
  supportPause?: boolean;
  supportInteractiveAvatar?: boolean;
  status: VoiceCloneStatus;
  failureMessage?: string | null;
  audioFileUrl?: string;
  isDeleted?: boolean;
}

const voiceCloneSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    voiceName: { type: String, required: true },
    heygenVoiceId: { type: String, required: true, unique: true },
    language: { type: String, default: '' },
    gender: { type: String, default: '' },
    previewAudioUrl: { type: String, default: '' },
    supportPause: { type: Boolean, default: false },
    supportInteractiveAvatar: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed', 'deleted'],
      default: 'processing',
      index: true,
    },
    failureMessage: { type: String, default: null },
    audioFileUrl: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<IVoiceClone>('VoiceClone', voiceCloneSchema);
