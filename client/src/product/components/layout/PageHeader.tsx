import { ReactNode } from "react";

/**
 * The top of every screen in the workspace.
 *
 * Every page was rolling its own header — the same flex row, the same
 * `text-3xl font-bold`, the same `mb-8` — which is why the spacing above the
 * content differed by a few pixels from screen to screen and nobody could say
 * why. One component means the title, the sentence under it and the primary
 * action line up identically everywhere, and changing that rhythm is one edit.
 *
 * `eyebrow` is for screens that sit inside a campaign, where the campaign's
 * name is the context you need before the page title makes sense.
 */

interface PageHeaderProps {
  title: string;
  /** One sentence. What this screen is for, not what it is called again. */
  description?: string;
  eyebrow?: string;
  /** Primary action, and at most one secondary beside it. */
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions, children }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* flex-none: a long title should wrap rather than squeeze the action,
            which is the one control on the page that must stay clickable. */}
        {actions && <div className="flex flex-none items-center gap-2.5">{actions}</div>}
      </div>

      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}

export default PageHeader;
