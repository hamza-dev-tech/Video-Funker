import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@product/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tracking-[0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        outline: "border-border text-muted-foreground",
        /*
          Status badges are tinted, not solid. A row of solid green, amber and
          red pills reads as three alarms; a tint carries the same meaning at
          the weight a status deserves, and keeps the solid fills for the rare
          badge that genuinely needs to shout.
        */
        success: "border-transparent bg-success/12 text-success",
        warning: "border-transparent bg-warning/15 text-[#a85800]",
        info: "border-transparent bg-primary/10 text-primary",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
