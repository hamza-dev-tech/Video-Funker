import mongoose, { Document } from 'mongoose';

export interface ILinkedInToken extends Document {
  userId: mongoose.Types.ObjectId;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expiry_date?: number;
  linkedinId?: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
}

const linkedInTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String },
    expires_in: { type: Number },
    expiry_date: { type: Number },
    linkedinId: { type: String },
    displayName: { type: String },
    profileUrl: { type: String },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILinkedInToken>('LinkedInToken', linkedInTokenSchema);
