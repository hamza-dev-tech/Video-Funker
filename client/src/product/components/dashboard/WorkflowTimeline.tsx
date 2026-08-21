import { cn } from "@product/lib/utils";
import { Check, Clock, Circle } from "lucide-react";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
}

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">
        Workflow Pipeline
      </h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  step.status === "completed" && "bg-success text-success-foreground",
                  step.status === "current" && "bg-primary text-primary-foreground animate-pulse",
                  step.status === "upcoming" && "bg-muted text-muted-foreground"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : step.status === "current" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-12 mt-2",
                    step.status === "completed" ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <h4
                className={cn(
                  "font-medium mb-1",
                  step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step.title}
              </h4>
              <p className="text-[14px] text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
