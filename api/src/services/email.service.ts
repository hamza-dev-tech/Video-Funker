import { createOtpTemplate } from '../utils/emailTemplate';
import sgMail from '@sendgrid/mail';

const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME, EMAIL_TRANSPORT } =
  process.env;

/**
 * Local development without a working mail provider — no key, an exhausted
 * account, no outbound network. Set EMAIL_TRANSPORT=console in api/.env and
 * every message is printed to the API log instead of being sent, so signup
 * verification, password reset and account deletion can each be walked end to
 * end offline: copy the code out of the terminal and paste it into the form.
 *
 * Opt-in, and inert in production. A one-time code sitting in a log is a
 * credential, and a fallback that engaged by itself would turn a dead provider
 * into an outage nobody notices — so a real deployment still fails loudly.
 */
const useConsoleTransport =
  EMAIL_TRANSPORT === 'console' && process.env.NODE_ENV !== 'production';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;

  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid configuration is missing (SENDGRID_API_KEY)');
  }

  sgMail.setApiKey(SENDGRID_API_KEY);
  initialized = true;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: {
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }[];
}

async function sendEmail({ to, subject, html, text, attachments }: SendEmailOptions): Promise<void> {
  if (useConsoleTransport) {
    const body = text.split('\n').map((line) => `   ${line}`).join('\n');
    console.log(`\n[email:console] to ${to}\n   ${subject}\n${body}\n`);
    return;
  }

  ensureInitialized();

  const from = {
    email: SENDGRID_FROM_EMAIL || 'no-reply@videofunker.ai',
    name: SENDGRID_FROM_NAME || 'Video Funker',
  }

  try {
    await sgMail.send({
      to,
      from,
      subject,
      text,
      html,
      ...(attachments ? { attachments } : {}),
    });
  } catch (err) {
    console.error('Failed to send email via SendGrid:', err);
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetOtp(email: string, otp: string): Promise<void> {
  const html = createOtpTemplate({
    title: 'Reset Password',
    message: 'Use the verification code below to reset your password.',
    otp,
    expiryMinutes: 10,
  });

  await sendEmail({
    to: email,
    subject: 'Password Reset OTP',
    text: `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
    html,
  });
}

export async function sendEmailVerificationOtp(email: string, otp: string): Promise<void> {


  const html = createOtpTemplate({
    title: 'Verify Your Email',
    message: 'Use the verification code below to verify your email address.',
    otp,
  });
  console.log(html)
  await sendEmail({
    to: email,
    subject: 'Verify Your Email',
    text: `Your email verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
    html,
  });
}

export async function sendAccountDeletionOtp(email: string, otp: string): Promise<void> {
  const html = createOtpTemplate({
    title: 'Confirm Account Deletion',
    message:
      'Use the verification code below to permanently delete your account. If you did not request this, please ignore this email and change your password.',
    otp,
    expiryMinutes: 10,
  });

  await sendEmail({
    to: email,
    subject: 'Confirm Account Deletion',
    text: `Your account deletion code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, ignore this email.`,
    html,
  });
}
