import * as React from "react";

import { cn } from "@product/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Same treatment as Input, so a form of mixed fields reads as one set.
        "flex min-h-[96px] w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] leading-relaxed transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/75 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
