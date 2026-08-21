import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  getStoredUser,
  setStoredUser,
  apiGet,
  type ApiUser,
} from "@product/lib/api-client";
import { VerifyEmailModal } from "@product/components/auth/VerifyEmailModal";

type PendingAction = (() => void | Promise<void>) | null;

interface VerificationContextValue {
  user: ApiUser | null;
  isVerified: boolean;
  /** Runs `action` if verified, otherwise opens the verification modal and continues after success. */
  requireVerifiedEmail: (action: () => void | Promise<void>) => void;
  /** Opens the verification modal, optionally continuing `onSuccess` after verification. */
  openVerificationModal: (onSuccess?: () => void | Promise<void>) => void;
  /** Re-syncs the current user from the backend. */
  refreshUser: () => Promise<void>;
  /** Updates local + stored user after verification. */
  applyVerifiedUser: (user: ApiUser) => void;
}

const VerificationContext = createContext<VerificationContextValue | null>(null);

export function VerificationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser());
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isVerified = !!user?.emailVerified;

  const refreshUser = useCallback(async () => {
    try {
      const { user: fresh } = await apiGet<{ user: ApiUser }>("/auth/me");
      setUser(fresh);
      setStoredUser(fresh);
    } catch {
      /* ignore — keep current state */
    }
  }, []);

  // Sync on mount so emailVerified is current even if stored user is stale.
  useEffect(() => {
    if (getStoredUser()) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyVerifiedUser = useCallback((fresh: ApiUser) => {
    setUser(fresh);
    setStoredUser(fresh);
  }, []);

  const openVerificationModal = useCallback(
    (onSuccess?: () => void | Promise<void>) => {
      setPendingAction(() => onSuccess ?? null);
      setModalOpen(true);
    },
    []
  );

  const requireVerifiedEmail = useCallback(
    (action: () => void | Promise<void>) => {
      if (user?.emailVerified) {
        action();
        return;
      }
      openVerificationModal(action);
    },
    [user, openVerificationModal]
  );

  const handleSuccess = useCallback(
    (fresh: ApiUser) => {
      applyVerifiedUser(fresh);
      setModalOpen(false);
      const action = pendingAction;
      setPendingAction(null);
      if (action) {
        // Defer so the modal closes before the action runs.
        setTimeout(() => action(), 50);
      }
    },
    [applyVerifiedUser, pendingAction]
  );

  return (
    <VerificationContext.Provider
      value={{
        user,
        isVerified,
        requireVerifiedEmail,
        openVerificationModal,
        refreshUser,
        applyVerifiedUser,
      }}
    >
      {children}
      <VerifyEmailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        email={user?.email ?? ""}
        onVerified={handleSuccess}
      />
    </VerificationContext.Provider>
  );
}

export function useVerification(): VerificationContextValue {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error("useVerification must be used within a VerificationProvider");
  }
  return ctx;
}
