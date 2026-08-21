import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName?: string;
  avatarPath?: string | null;
  role: 'user' | 'admin' | 'consultant';
  stripeCustomerId?: string | null;
  lifetimeCampaignsCreated: number;
  resetPasswordOtp?: string | null;
  resetPasswordOtpExpire?: Date | null;
  emailVerified: boolean;
  emailVerifyOtp?: string | null;
  emailVerifyOtpExpire?: Date | null;
  deleteAccountOtp?: string | null;
  deleteAccountOtpExpire?: Date | null;
  lastLoginAt?: Date | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    displayName: { type: String, trim: true },
    avatarPath: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin', 'consultant'], default: 'user' },
    stripeCustomerId: { type: String, default: null, index: true },
    lifetimeCampaignsCreated: { type: Number, default: 0, min: 0 },
    resetPasswordOtp: { type: String, default: null, select: false },
    resetPasswordOtpExpire: { type: Date, default: null, select: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifyOtp: { type: String, default: null, select: false },
    emailVerifyOtpExpire: { type: Date, default: null, select: false },
    deleteAccountOtp: { type: String, default: null, select: false },
    deleteAccountOtpExpire: { type: Date, default: null, select: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model<IUser>('User', userSchema);
