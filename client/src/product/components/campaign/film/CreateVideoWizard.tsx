import { Button } from "@product/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Stepper, type StepperStep } from "@product/components/campaign/film/Stepper";

interface CreateVideoWizardProps {
  steps: StepperStep[];
  current: number;
  maxReachable: number;
  canContinue: boolean;
  onStepClick: (index: number) => void;
  onBack: () => void;
  onContinue: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function CreateVideoWizard({
  steps,
  current,
  maxReachable,
  canContinue,
  onStepClick,
  onBack,
  onContinue,
  onCancel,
  children,
}: CreateVideoWizardProps) {
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-foreground">
          New video
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onCancel}>
          <X className="w-4 h-4" /> Cancel
        </Button>
      </div>

      <div className="rounded-[14px] border border-border/70 bg-secondary/40 px-4 py-4 sm:px-6">
        <Stepper
          steps={steps}
          current={current}
          maxReachable={maxReachable}
          onStepClick={onStepClick}
        />
      </div>

      <div className="rounded-[14px] border border-border/70 bg-card p-5 sm:p-7">
        {children}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={isFirst ? onCancel : onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          {isFirst ? "Back to library" : "Back"}
        </Button>

        {!isLast && (
          <Button
            variant="cta"
            className="gap-1.5"
            onClick={onContinue}
            disabled={!canContinue}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
