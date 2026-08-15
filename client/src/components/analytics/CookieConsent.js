'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { analyticsEnabled, readConsent, updateConsent } from '@/lib/analytics';
import { c, font } from '@/config/site';

/**
 * The consent banner.
 *
 * It exists because Consent Mode v2 defaults everything to denied, and without
 * something to grant it the EEA share of traffic stays permanently modelled
 * rather than measured. It is also the lawful order of operations: ask, then
 * set cookies. A banner that appears after the tracking has already run is
 * decoration.
 *
 * Deliberately NOT a modal and NOT blocking. A consent wall on a marketing
 * site costs more visitors than the analytics are worth, and "reject" has to
 * be exactly as easy to click as "accept" under the EDPB guidance, so the two
 * buttons are the same size and weight. There is no dark pattern here on
 * purpose.
 *
 * Renders nothing at all when no analytics id is configured. Asking for
 * consent to cookies the site is not setting would be theatre.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled()) return;
    // Only ask if they have not already answered. Mounting hidden and then
    // showing avoids a flash of the banner for people who already decided.
    if (readConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (analytics, marketing) => {
    updateConsent({ analytics, marketing });
    setVisible(false);
  };

  return (
    <div
      className="vf-consent"
      role="dialog"
      aria-label="Cookie choices"
      aria-live="polite"
    >
      <p className="vf-consent-text">
        We use analytics cookies to see which pages are worth writing more of. Nothing is shared
        with advertisers.{' '}
        <Link href="/privacy" className="vf-consent-link">
          Privacy
        </Link>
      </p>
      <div className="vf-consent-actions">
        {/* Same size, same weight, same prominence. Making "reject" quieter
            than "accept" is the pattern regulators have started fining. */}
        <button type="button" onClick={() => decide(false, false)} className="vf-consent-btn">
          Reject
        </button>
        <button
          type="button"
          onClick={() => decide(true, false)}
          className="vf-consent-btn vf-consent-btn-accept"
          style={{ background: c.orange, color: c.orangeInk, font: `700 14px ${font.body}` }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
