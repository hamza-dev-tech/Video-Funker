import { Check } from "lucide-react";
import { cn } from "@product/lib/utils";

export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  current: number;
  /** highest step index the user is allowed to jump to */
  maxReachable: number;
  onStepClick: (index: number) => void;
}

export function Stepper({ steps, current, maxReachable, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isComplete = index < current;
          const isActive = index === current;
          const reachable = index <= maxReachable;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.label}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepClick(index)}
                className={cn(
                  "flex items-center gap-2 shrink-0 rounded-full transition-colors",
                  reachable ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors",
                    // A halo on the current step, so which one you are on reads
                    // before you have parsed the numbers.
                    isActive &&
                      "border-primary bg-primary text-primary-foreground ring-4 ring-primary/12",
                    isComplete &&
                      "border-primary/30 bg-primary/10 text-primary",
                    !isActive &&
                      !isComplete &&
                      "border-border bg-card text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-[13.5px]",
                    isActive
                      ? "font-semibold text-foreground"
                      : "hidden font-medium text-muted-foreground sm:inline",
                  )}
                >
                  {step.label}
                </span>
              </button>

              {!isLast && (
                <span
                  className={cn(
                    "mx-2 sm:mx-3 h-px flex-1 transition-colors",
                    index < current ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
