import { useState, useEffect, useCallback } from "react";
import {
  apiPost,
  apiGet,
  apiPut,
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
  type ApiUser,
} from "@product/lib/api-client";
import { useCampaignStore } from "@product/store/campaignStore";

export const useAuth = () => {
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const { clearActiveCampaign } = useCampaignStore()

  // On mount, verify token is still valid
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiGet<{ user: ApiUser }>("/auth/me")
      .then(({ user }) => {
        setUser(user);
        setStoredUser(user);
      })
      .catch((err) => {
        /*
          Only a rejected token signs you out.

          This used to clear the session on ANY failure. The API restarting for
          ten seconds, a flaky connection, a 502 from a proxy — each of them
          deleted the stored token and bounced the person to the sign-in screen
          mid-task, with a session that was perfectly valid. The server is the
          only thing that can say a token is bad, and it says so with 401 or
          403; everything else is a transport problem, and the right response to
          a transport problem is to keep the cached user and carry on.
        */
        const rejected = err?.status === 401 || err?.status === 403;
        if (rejected) {
          clearAuth();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { user, token } = await apiPost<{ user: ApiUser; token: string }>(
        "/auth/signup",
        { email, password }
      );
      setToken(token);
      setStoredUser(user);
      setUser(user);
      return { data: { user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user, token } = await apiPost<{ user: ApiUser; token: string }>(
        "/auth/login",
        { email, password }
      );
      setToken(token);
      setStoredUser(user);
      setUser(user);
      return { data: { user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }, []);

  /**
   * The return type is written out rather than inferred.
   *
   * Inferred, `error` is `null` — literally the type `null` — so the
   * `if (error)` branch in UserMenu.tsx narrows it to `never` and reading
   * `error.message` there is a type error. It compiles today only because the
   * client tsconfig has `strict` and `strictNullChecks` off, and it is the one
   * thing standing between this app and turning them on. Annotating the
   * signature says what the caller is actually allowed to expect, and leaves
   * room for a sign-out that can fail.
   */
  const signOut = useCallback(async (): Promise<{ error: { message: string } | null }> => {
    clearAuth();
    clearActiveCampaign()
    /**
     * Scoped removal, NOT localStorage.clear().
     *
     * The app used to own its origin, so wiping localStorage only ever
     * destroyed its own keys. It shares videofunker.ai with the marketing site
     * now, and that site keeps the visitor's GDPR cookie choice in localStorage
     * under `vf-consent` (lib/analytics.js). A blanket clear() meant signing out
     * of the workspace silently revoked a consent the visitor had already given:
     * the banner reappears on the marketing site and Consent Mode drops back to
     * denied, so analytics stop recording them, with nothing to connect the two.
     *
     * clearAuth() above already removes the token and the cached user; this
     * takes the one remaining key the product owns — zustand's persist entry.
     */
    localStorage.removeItem('saleslights-active-campaign');
    setUser(null);
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await apiPut("/auth/password", { currentPassword, newPassword });
      return { data: true, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
  };
};
