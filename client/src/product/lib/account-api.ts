import { apiPost, apiDelete } from "@product/lib/api-client";

/** Sends an account-deletion OTP to the logged-in user's email. */
export async function sendDeleteAccountOtp() {
  try {
    await apiPost("/auth/send-delete-otp");
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}

interface DeleteAccountPayload {
  otp: string;
  reason: string;
  feedback?: string;
}

/** Permanently deletes the logged-in user's account after OTP verification. */
export async function deleteAccount(payload: DeleteAccountPayload) {
  try {
    await apiDelete("/auth/account", payload);
    return { data: true, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message } };
  }
}
