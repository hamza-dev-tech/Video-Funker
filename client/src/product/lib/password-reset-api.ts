import { apiPost } from "@product/lib/api-client";

export async function requestPasswordResetOtp(email: string) {
  try {
    await apiPost("/auth/forgot-password", { email });
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}

export async function verifyResetOtp(email: string, otp: string) {
  try {
    await apiPost("/auth/verify-reset-otp", { email, otp });
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string
) {
  try {
    await apiPost("/auth/reset-password", { email, otp, newPassword });
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}
