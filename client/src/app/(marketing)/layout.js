/**
 * The marketing route family.
 *
 * This layout exists for exactly one reason: to own `globals.css`.
 *
 * The product app now lives in this same Next application, under /app, and it
 * is a Tailwind + shadcn/ui build that assumes Tailwind's preflight is the only
 * reset on the page. `globals.css` is not that reset — it zeroes every margin
 * and padding with `*`, fades every anchor on hover, and deliberately leaves
 * `box-sizing` at `content-box`. Load both sheets on one document and the
 * product's dialogs, dropdowns and form controls come apart.
 *
 * Route groups are what keep them apart: `(marketing)` and `(product)` are
 * siblings, so Next only ships this stylesheet on the routes below it. The
 * group name is in parentheses, so it contributes nothing to the URL — every
 * page under here keeps the exact path it had before the group existed.
 */
import CookieConsent from '@/components/analytics/CookieConsent';

import '../globals.css';

export default function MarketingLayout({ children }) {
  return (
    <>
      {children}
      {/* Rendered here rather than on the root layout, beside the stylesheet
          that styles it. Its markup is entirely class-driven (.vf-consent and
          friends, globals.css:1593 onward), and those rules only exist in this
          group's CSS chunk. The product app behind /app sets no third-party
          marketing cookies of its own and is behind a login wall, so it has
          nothing to ask about. */}
      <CookieConsent />
    </>
  );
}
