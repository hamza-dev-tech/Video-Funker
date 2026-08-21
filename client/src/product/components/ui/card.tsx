import * as React from "react";

import { cn } from "@product/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  /*
    14px corners, a hairline border and a shadow you have to look for.
    The default was an 8px box with a hard 1px border, which reads as a table
    cell rather than a surface — at this radius a card sits on the page instead
    of being cut out of it, and it matches the sign-in card and the rounded
    controls around it.
  */
  <div
    ref={ref}
    className={cn(
      "rounded-[14px] border border-border/70 bg-card text-card-foreground shadow-[0_1px_2px_rgba(18,32,46,.04)]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    /*
      17px, not 24px. shadcn ships text-2xl here, which is the size of a page
      title — inside a card it competed with the actual page heading and made
      every panel shout. Display face, so card titles and page titles are the
      same voice at different volumes.
    */
    <h3
      ref={ref}
      className={cn("font-display text-[17px] font-bold leading-tight tracking-[-0.01em]", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
