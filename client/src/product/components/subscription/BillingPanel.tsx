import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  XCircle,
  Settings,
  RotateCcw,
  Ban,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@product/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@product/components/ui/dialog";
import { useSubscription, useUsage } from "@product/hooks/useSubscription";
import { SubscriptionStatusBadge } from "@product/components/subscription/SubscriptionStatus";
import { useVerification } from "@product/context/VerificationProvider";

/** Compact campaign-credit summary, reused across billing states. */
function CampaignUsageCard() {
  const { usage } = useUsage();
  if (!usage) return null;

  const { used, limit, remaining, window } = usage.campaigns;
  const windowLabel = window === "lifetime" ? "lifetime" : "this billing cycle";

  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-6 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Campaign credits ({windowLabel})
        </p>
        <p className="font-display text-lg font-bold text-foreground">
          {used}/{limit}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {remaining > 0
          ? `${remaining} campaign${remaining === 1 ? "" : "s"} remaining.`
          : "No campaigns remaining."}
      </p>
      {usage.upgradeRequired && (
        <Button asChild size="sm" className="mt-2">
          <Link to="/pricing">
            Upgrade to Pro <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

interface BillingPanelProps {
  /** When false, hides the "Change plan" link (e.g. when already on Pricing). */
  showChangePlan?: boolean;
}

/**
 * Self-contained subscription management panel.
 * Reused on the Subscription page and the Settings page so billing UI stays DRY.
 */
export function BillingPanel({ showChangePlan = true }: BillingPanelProps) {
  const {
    subscription,
    isLoading,
    isError,
    refetch,
    openPortal,
    isOpeningPortal,
    cancelSubscription,
    isCanceling,
    resumeSubscription,
    isResuming,
  } = useSubscription();
  const { requireVerifiedEmail } = useVerification();

  const renewDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isActive = subscription?.isActive ?? false;
  const willCancel = subscription?.cancelAtPeriodEnd ?? false;

  const [confirmCancel, setConfirmCancel] = useState(false);

  const lastPaid = subscription?.latestPaymentAt
    ? new Date(subscription.latestPaymentAt).toLocaleDateString(undefined, {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  /*
    A declined card used to be completely silent.

    The customer simply dropped to free-tier limits — one campaign, one video —
    with no explanation anywhere in the product, even though this exact status
    was already being fetched and held right here. They were pointed at the
    pricing page, which is now the wrong place: it refuses a second checkout
    while a subscription exists. The billing portal is where a card gets fixed.
  */
  const paymentFailed = subscription?.latestInvoiceStatus === "failed";

  if (isError) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[14px] border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive">
        <XCircle className="h-4 w-4" />
        Could not load your subscription.
        <Button variant="ghost" size="sm" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-[14px] border border-border/70 bg-card p-10 text-center">
          <h3 className="font-display text-lg font-semibold text-foreground">
            No active plan
          </h3>
          <p className="text-sm text-muted-foreground">
            Subscribe to unlock the full Video Funker experience.
          </p>
          <Button asChild>
            <Link to="/pricing">
              View plans <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CampaignUsageCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CampaignUsageCard />
      <div className="rounded-[14px] border border-border/70 bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="font-display text-xl font-bold text-foreground">
              {subscription?.planName ?? "—"}
            </p>
          </div>
          <SubscriptionStatusBadge subscription={subscription} />
        </div>

        {renewDate && (
          <p className="text-sm text-muted-foreground">
            {willCancel ? "Access ends on" : "Renews on"}{" "}
            <span className="font-medium text-foreground">{renewDate}</span>
          </p>
        )}

        {/* Everything below was already being fetched and never shown. The
            page's own subtitle promises "when it renews". */}
        <dl className="grid gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-sm sm:grid-cols-2">
          {subscription?.billingInterval && (
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Billed</dt>
              <dd className="font-medium text-foreground">
                {subscription.billingInterval === "year" ? "Yearly" : "Monthly"}
              </dd>
            </div>
          )}
          {lastPaid && (
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Last payment</dt>
              <dd className="font-medium text-foreground">{lastPaid}</dd>
            </div>
          )}
        </dl>

        {paymentFailed && (
          <div className="flex gap-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-3.5">
            <AlertTriangle className="mt-px h-4 w-4 flex-none text-destructive" strokeWidth={2} />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-destructive">Your last payment failed</p>
              <p className="text-foreground/80">
                Update your card to keep your plan. Your access continues
                {renewDate ? ` until ${renewDate}` : " for now"}.
              </p>
              <Button size="sm" variant="outline" onClick={() => requireVerifiedEmail(() => openPortal())}>
                Update payment method
              </Button>
            </div>
          </div>
        )}

        {willCancel && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.06] p-3 text-sm text-destructive">
            Your subscription is scheduled to cancel at the end of the period.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => requireVerifiedEmail(() => openPortal())}
          disabled={isOpeningPortal}
        >
          {isOpeningPortal ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          Billing portal
        </Button>

        {/*
          Changing plan goes through the billing portal, not the pricing page.

          Checkout creates a NEW subscription rather than replacing one, so
          "Change plan" leading to /pricing produced a second live subscription
          and two charges a month. The server now refuses that, which would turn
          this button into an error message. The portal does the swap properly,
          with proration.
        */}
        {showChangePlan && (
          <Button
            variant="outline"
            onClick={() => requireVerifiedEmail(() => openPortal())}
            disabled={isOpeningPortal}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" /> Change plan
          </Button>
        )}

        {willCancel ? (
          <Button onClick={() => requireVerifiedEmail(() => resumeSubscription())} disabled={isResuming}>
            {isResuming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Resume subscription
          </Button>
        ) : (
          <Button
            variant="destructive"
            /* Confirmed first. Cancelling a paid plan was one click with no
               dialog, while deleting an entire account takes five steps — and
               the reassuring part ("you keep access until the period ends")
               only appeared in a toast after it had already happened. */
            onClick={() => setConfirmCancel(true)}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            Cancel subscription
          </Button>
        )}
      </div>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription>
              {renewDate
                ? `You keep full access until ${renewDate}. Nothing is deleted, and you can resume any time before then.`
                : "You keep full access until the end of the current period. Nothing is deleted, and you can resume before then."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep my plan
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmCancel(false);
                requireVerifiedEmail(() => cancelSubscription());
              }}
              disabled={isCanceling}
            >
              {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
