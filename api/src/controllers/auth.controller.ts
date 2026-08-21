import crypto from 'crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import { sendSuccess } from '../utils/response';
import { BadRequestError, UnauthorizedError } from '../errors';
import { sendPasswordResetOtp, sendEmailVerificationOtp } from '../services/email.service';

const hashOtp = (otp: string): string =>
  crypto.createHash('sha256').update(otp).digest('hex');

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, displayName } = req.body;

  if (await User.findOne({ email })) {
    throw new BadRequestError('Email already registered');
  }

  const user = await User.create({ email, password, displayName });
  const token = generateToken(user._id.toString() as string);

  sendSuccess(res, { user, token }, 201);
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id.toString() as string);
  sendSuccess(res, { user, token });
};


export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  sendSuccess(res, { user: req.user });
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new BadRequestError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  sendSuccess(res, { message: 'Password updated' });
};

const GENERIC_FORGOT_MESSAGE =
  'If an account exists for that email, a password reset OTP has been sent.';

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('Email is required');
  }

  const user = await User.findOne({ email });

  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = hashOtp(otp);
    user.resetPasswordOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    try {
      await sendPasswordResetOtp(user.email, otp);
    } catch (err) {
      console.error('Failed to send password reset OTP email:', err);
      throw new BadRequestError('Failed to send password reset OTP email');
    }
  }

  // Always return a generic response to prevent email enumeration
  sendSuccess(res, { message: GENERIC_FORGOT_MESSAGE });
};

const getValidResetUser = async (email: string, otp: string) => {
  if (!email || !otp) {
    throw new BadRequestError('Email and OTP are required');
  }

  const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordOtpExpire');

  if (
    !user ||
    !user.resetPasswordOtp ||
    !user.resetPasswordOtpExpire ||
    user.resetPasswordOtp !== hashOtp(otp) ||
    user.resetPasswordOtpExpire.getTime() < Date.now()
  ) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  return user;
};

export const verifyResetOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  await getValidResetUser(email, otp);
  sendSuccess(res, { message: 'OTP verified' });
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  if (!newPassword) {
    throw new BadRequestError('New password is required');
  }

  const user = await getValidResetUser(email, otp);

  user.password = newPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpire = null;
  await user.save();

  sendSuccess(res, { message: 'Password reset successfully' });
};

// ===== Email verification (logged-in users) =====

export const sendVerificationOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id);
  if (!user) throw new BadRequestError('User not found');

  if (user.emailVerified) {
    sendSuccess(res, { message: 'Email already verified', emailVerified: true });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerifyOtp = hashOtp(otp);
  user.emailVerifyOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  try {
    await sendEmailVerificationOtp(user.email, otp);
  } catch (err) {
    console.error('Failed to send verification OTP email:', err);
    throw new BadRequestError('Failed to send verification email');
  }

  sendSuccess(res, { message: 'Verification code sent' });
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { otp } = req.body;

  if (!otp) {
    throw new BadRequestError('Verification code is required');
  }

  const user = await User.findById(req.user!._id).select(
    '+emailVerifyOtp +emailVerifyOtpExpire'
  );

  if (!user) throw new BadRequestError('User not found');

  if (user.emailVerified) {
    sendSuccess(res, { user, emailVerified: true });
    return;
  }

  if (
    !user.emailVerifyOtp ||
    !user.emailVerifyOtpExpire ||
    user.emailVerifyOtp !== hashOtp(otp) ||
    user.emailVerifyOtpExpire.getTime() < Date.now()
  ) {
    throw new BadRequestError('Invalid or expired verification code');
  }

  user.emailVerified = true;
  user.emailVerifyOtp = null;
  user.emailVerifyOtpExpire = null;
  await user.save();

  sendSuccess(res, { user, emailVerified: true });
};
