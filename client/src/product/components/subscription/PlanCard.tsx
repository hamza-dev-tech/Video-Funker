import { Check, Loader2 } from "lucide-react";
import { Button } from "@product/components/ui/button";
import { cn } from "@product/lib/utils";
import {
  formatPrice,
  type BillingInterval,
  type PlanDefinition,
  type PlanId,
} from "@product/lib/subscription-api";

interface PlanCardProps {
  plan: PlanDefinition;
  interval?: BillingInterval;
  currentPlanId?: PlanId | null;
  isActiveSubscription?: boolean;
  isLoading?: boolean;
  onSelect: (priceId: string) => void;
}

const PLAN_ORDER: PlanId[] = ["free", "pro", "enterprise"];

function getButtonLabel(
  isCurrent: boolean,
  isFree: boolean,
  currentPlanId: PlanId,
  planId: PlanId,
  planName: string,
): string {
  if (isCurrent) return "Current Plan";
  if (isFree) return "Included";

  const currentIndex = PLAN_ORDER.indexOf(currentPlanId);
  const planIndex = PLAN_ORDER.indexOf(planId);

  if (planIndex > currentIndex) {
    return `Upgrade to ${planName}`;
  }
  if (planIndex < currentIndex) {
    return `Downgrade to ${planName}`;
  }
  return "Subscribe";
}

export function PlanCard({
  plan,
  interval = "month",
  currentPlanId,
  isActiveSubscription = false,
  isLoading = false,
  onSelect,
}: PlanCardProps) {
  const price =
    plan.prices.find((p) => p.interval === interval) ?? plan.prices[0];
  const isFree = !price || price.amount === 0 || !price.priceId;

  const effectiveCurrentPlanId: PlanId = isActiveSubscription
    ? (currentPlanId ?? "free")
    : "free";
  const isCurrent = plan.id === effectiveCurrentPlanId;

  const isHighlighted =
    isCurrent || (effectiveCurrentPlanId === "free" && plan.id === "pro");

  const showCurrentBadge = isCurrent;
  const showMostPopular =
    !isCurrent && plan.id === "pro" && effectiveCurrentPlanId === "free";

  const buttonLabel = getButtonLabel(
    isCurrent,
    isFree,
    effectiveCurrentPlanId,
    plan.id,
    plan.name,
  );

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-7 transition-[border-color,box-shadow] duration-200",
        // 2px on the recommended plan, and no coloured glow. A shadow tinted
        // with the brand colour reads as a selected state rather than a
        // recommendation, which is confusing on the plan you are already on.
        isHighlighted
          ? "border-2 border-primary p-[27px] shadow-[0_12px_32px_-16px_rgba(12,43,74,.3)]"
          : "border-border/70",
      )}
    >
      {showCurrentBadge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11.5px] font-semibold text-primary-foreground">
          Your plan
        </span>
      )}
      {/* Orange, because this is a recommendation the page is making — the same
          colour every other "do this" in the product uses. Navy here was
          indistinguishable from the "Your plan" badge two lines above. */}
      {showMostPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff901b] px-3 py-1 text-[11.5px] font-semibold text-[#2a1a04]">
          Most popular
        </span>
      )}
      <h3 className="font-display text-[19px] font-bold tracking-[-0.01em] text-foreground">
        {plan.name}
      </h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{plan.description}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
          {/*
            formatPrice, not a template string. Stripe stores amounts in the
            smallest currency unit, so printing `price.amount` raw advertised
            the $15 plan as $1500 and the $49 plan as $4900. The helper was
            already imported at the top of this file and never called.
          */}
          {formatPrice(price?.amount ?? 0, price?.currency ?? "usd")}
        </span>
        {!isFree && <span className="text-[15px] text-muted-foreground">/{interval}</span>}
      </div>

      <ul className="mt-7 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-foreground">
            <Check className="mt-[3px] h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.includes && (
        <>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Includes
          </p>
          <ul className="mt-3 flex-1 space-y-2.5">
            {plan.includes.map((include) => (
              <li key={include} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-foreground">
                <Check className="mt-[3px] h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
                <span>{include}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Button
        className="mt-8 w-full"
        size="lg"
        variant={showMostPopular ? "cta" : isHighlighted ? "default" : "outline"}
        disabled={isCurrent || isLoading || isFree}
        onClick={() => price?.priceId && onSelect(price.priceId)}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonLabel}
      </Button>
    </div>
  );
}
