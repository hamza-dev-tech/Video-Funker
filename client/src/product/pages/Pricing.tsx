import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { XCircle, Loader2, CheckCircle2 } from "lucide-react";
import { MainLayout } from "@product/components/layout/MainLayout";
import { Button } from "@product/components/ui/button";
import { useToast } from "@product/hooks/use-toast";
import { useSubscription, usePlans } from "@product/hooks/useSubscription";
import { PlanCard } from "@product/components/subscription/PlanCard";
import { useVerification } from "@product/context/VerificationProvider";

export default function Pricing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { requireVerifiedEmail } = useVerification();

  const { plans, isLoading: plansLoading, isError: plansError } = usePlans();
  const { subscription, isLoading, isError, refetch, startCheckout, isCheckingOut } =
    useSubscription();

  /*
    Waiting for Stripe to tell us the payment landed.

    Stripe redirects back the instant the card clears, but the webhook that
    records it usually has not arrived yet. The page read the database once and
    rendered whatever it found, so a customer who had just paid saw the Free
    card marked "Your plan" next to a working "Upgrade to Pro" button on the
    plan they had bought a second earlier — and with checkout no longer allowed
    while subscribed, that button now returns an error instead. Only leaving the
    tab and coming back fixed it.

    So: poll until the subscription actually reflects the purchase, say plainly
    that we are waiting, and count the seconds so the wait is visibly finite.
  */
  const [confirming, setConfirming] = useState(false);
  const [waited, setWaited] = useState(0);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopConfirming = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setConfirming(false);
  };

  useEffect(() => {
    if (!confirming) return;
    // One timer drives both the counter and the refetch, so the number on
    // screen and the request that might end the wait stay in step.
    pollRef.current = setInterval(() => {
      setWaited((s) => {
        const next = s + 1;
        if (next % 2 === 0) void refetch();
        // Roughly a minute. Beyond that a webhook is genuinely late and telling
        // someone to come back is more honest than spinning forever.
        if (next >= 60) {
          setConfirmTimedOut(true);
          stopConfirming();
        }
        return next;
      });
    }, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming]);

  // The wait ends the moment the plan is really active.
  useEffect(() => {
    if (confirming && subscription?.isActive) {
      stopConfirming();
      toast({
        title: "You're all set",
        description: "Your subscription is active.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming, subscription?.isActive]);

  // Handle Stripe redirect states
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;

    if (checkout === "success") {
      setConfirming(true);
      setWaited(0);
      void refetch();
    } else if (checkout === "cancel") {
      toast({
        variant: "destructive",
        title: "Checkout canceled",
        description: "No charges were made.",
      });
    }
    searchParams.delete("checkout");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = plansLoading || isLoading;
  const hasError = plansError || isError;
  // Only show plans that have at least one configured price (or a free tier).
  const visiblePlans = plans.filter((p) =>
    p.prices.some((price) => price.priceId || price.amount === 0)
  );

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Centred, unlike every other screen. A pricing page is a decision
            rather than a workspace, and centring the question puts the answers
            below it on equal footing. */}
        <div className="mx-auto max-w-[46ch] space-y-3 text-center">
          <h1 className="font-display text-[34px] font-bold leading-tight tracking-[-0.022em] text-foreground">
            Choose your plan
          </h1>
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            Every plan includes the whole workflow, from research to reporting.
            Change or cancel whenever you like.
          </p>
        </div>

        {confirming && (
          <div className="flex items-center justify-center gap-3 rounded-[14px] border border-primary/25 bg-primary/[0.06] p-4">
            <Loader2 className="h-4 w-4 flex-none animate-spin text-primary" />
            <p className="text-[14.5px] text-foreground">
              Confirming your payment with Stripe&hellip;
              <span className="ml-2 tabular-nums text-muted-foreground">{waited}s</span>
            </p>
          </div>
        )}

        {confirmTimedOut && !subscription?.isActive && (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-[14px] border border-border bg-secondary/50 p-4 text-center">
            <p className="text-[14.5px] text-foreground">
              Your payment went through, but Stripe hasn't confirmed it here yet.
              Nothing is lost — it usually lands within a minute.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setConfirmTimedOut(false); setConfirming(true); setWaited(0); }}>
              Check again
            </Button>
          </div>
        )}

        {!confirming && subscription?.isActive && searchParams.get("checkout") === null && waited > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-[14px] border border-emerald-600/30 bg-emerald-600/[0.07] p-4 text-[14.5px] text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Payment confirmed. Your plan is active.
          </div>
        )}

        {hasError && (
          <div className="flex items-center justify-center gap-2 rounded-[14px] border border-destructive/30 bg-destructive/[0.06] p-4 text-[14px] text-destructive">
            <XCircle className="h-4 w-4" />
            Could not load plans or subscription status.
            <Button variant="ghost" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlanId={subscription?.planId}
                isActiveSubscription={subscription?.isActive ?? false}
                /* Buttons stay inert while we are still confirming, so the
                   most tempting next click cannot start a second checkout. */
                isLoading={isCheckingOut || confirming}
                onSelect={(priceId) => requireVerifiedEmail(() => startCheckout(priceId))}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
