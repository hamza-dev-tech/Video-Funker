import * as React from "react";

import { cn } from "@product/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          /*
            Matched to the sign-in screen: 44px tall, 12px corners, and a soft
            ring on focus instead of an offset outline. The offset ring the
            default shipped with drew a second rectangle a pixel outside the
            field, which on a form of six inputs looked like a rendering fault.
          */
          "flex h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-[15px] transition-[border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/75 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
