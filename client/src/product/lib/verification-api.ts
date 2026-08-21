import { apiPost, type ApiUser } from "@product/lib/api-client";

/** Sends (or resends) an email verification OTP to the logged-in user. */
export async function sendVerificationOtp() {
  try {
    await apiPost("/auth/send-verification");
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}

/** Verifies the logged-in user's email with the provided OTP. */
export async function verifyEmail(otp: string) {
  try {
    const data = await apiPost<{ user: ApiUser; emailVerified: boolean }>(
      "/auth/verify-email",
      { otp }
    );
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message } };
  }
}
