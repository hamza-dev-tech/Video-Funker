'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { GA_ID, GTM_ID, analyticsEnabled } from '@/lib/analytics';

/**
 * Page views for the App Router.
 *
 * This exists because App Router navigation does not reload the document. GA4's
 * automatic page_view fires once, on the first paint, and then never again, so
 * a visitor who reads four articles is recorded as a single-page session that
 * bounced. Every metric downstream of that is wrong: pages per session, bounce
 * rate, time on page, and the entire content report.
 *
 * The direct-GA4 path sets `send_page_view: false` in Analytics.js and lets
 * this send all of them, including the first, so there is exactly one per
 * navigation rather than a duplicate on load.
 *
 * With a container it pushes a `page_view` into dataLayer instead. Set the GTM
 * trigger to that custom event, NOT to History Change, or the two fire
 * together and every navigation is counted twice.
 */
export default function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The first effect run is the initial load, which still needs a page_view.
  // This ref only guards against React 18 StrictMode invoking effects twice in
  // development, which would otherwise double every local reading.
  const lastSent = useRef(null);

  useEffect(() => {
    if (!analyticsEnabled() || !pathname) return;

    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    if (lastSent.current === path) return;
    lastSent.current = path;

    const payload = {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    };

    if (GTM_ID) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'page_view', ...payload });
    } else if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { send_to: GA_ID, ...payload });
    }
  }, [pathname, searchParams]);

  return null;
}
