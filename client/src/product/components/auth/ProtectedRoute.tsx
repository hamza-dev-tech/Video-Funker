import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@product/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  /*
    Only block when there is genuinely nobody to show.

    `loading` is true until /auth/me answers, but useAuth seeds `user` from
    localStorage synchronously on the very first render — so for a returning
    visitor the app already knows who they are and could paint immediately.
    Blocking on `loading` regardless meant every hard refresh and every deep
    link opened on a white screen with a spinner and the word "Loading…", for
    the entire round trip, before showing a workspace it could have rendered
    instantly. Render optimistically; the token check still runs, and if the
    server rejects it the effect above redirects.
  */
  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
