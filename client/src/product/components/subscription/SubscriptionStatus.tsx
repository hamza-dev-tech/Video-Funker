import { Badge } from "@product/components/ui/badge";
import { cn } from "@product/lib/utils";
import type { SubscriptionView } from "@product/lib/subscription-api";

interface SubscriptionStatusProps {
  subscription?: SubscriptionView;
  className?: string;
}

const LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  unpaid: "Unpaid",
  none: "No subscription",
};

export function SubscriptionStatusBadge({ subscription, className }: SubscriptionStatusProps) {
  const status = subscription?.status ?? "none";
  const isActive = subscription?.isActive ?? false;

  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(!isActive && status !== "none" && "bg-destructive/20 text-destructive", className)}
    >
      {LABELS[status] ?? status}
    </Badge>
  );
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusProps) {
  if (!subscription) return null;

  const renewLabel = subscription.cancelAtPeriodEnd ? "Ends on" : "Renews on";
  const date = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Your subscription</h3>
        <SubscriptionStatusBadge subscription={subscription} />
      </div>
      {subscription.planName && (
        <p className="text-sm text-muted-foreground">
          {subscription.planName}
          {subscription.billingInterval ? ` · billed ${subscription.billingInterval}ly` : ""}
        </p>
      )}
      {date && (
        <p className="text-sm text-muted-foreground">
          {renewLabel} <span className="text-foreground font-medium">{date}</span>
        </p>
      )}
    </div>
  );
}
