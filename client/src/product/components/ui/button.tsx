import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@product/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
        /*
          The one orange button. Reserved for the single action a screen exists
          to get you to press — New campaign, Generate, Create — and never used
          twice on one view.

          It is the same orange as "Start free" on the marketing site and "Sign
          in" on the auth screen, which is the point: one colour means "this is
          the thing to do" across the whole product, and the navy `default`
          means "this is available". Before this variant existed every button in
          the workspace was navy, so nothing on a screen looked more important
          than anything else.
        */
        /*
          The disabled state is a real state, not the same button at half
          opacity. A 50%-alpha orange pill goes muddy while keeping its shadow,
          which reads as a rendering fault; a flat muted fill reads as "not
          yet". `disabled:opacity-100` is needed to beat the shared
          `disabled:opacity-50` in the base class above.
        */
        cta: "bg-[#ff901b] text-[#2a1a04] hover:bg-[#ffa03d] shadow-md shadow-[#d96b00]/30 hover:-translate-y-px active:translate-y-0 active:scale-[.985] disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-transparent hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg",
        glow: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/40 hover:shadow-primary/60",
        muted: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
