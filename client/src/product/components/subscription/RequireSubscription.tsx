import { Loader2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@product/components/ui/button";
import { useSubscription } from "@product/hooks/useSubscription";

interface RequireSubscriptionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Wrap premium UI to gate it behind an active subscription. */
export function RequireSubscription({ children, fallback }: RequireSubscriptionProps) {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (subscription?.isActive) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Lock className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">Premium feature</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscribe to unlock this feature.
        </p>
      </div>
      <Button asChild>
        <Link to="/pricing">View plans</Link>
      </Button>
    </div>
  );
}
