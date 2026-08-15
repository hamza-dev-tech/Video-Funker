'use client';

import { useEffect } from 'react';

import { EV, analyticsEnabled, track } from '@/lib/analytics';

/**
 * Click tracking for the whole site, from one delegated listener.
 *
 * The alternative was an onClick on every CTA. That reads as the obvious
 * approach and is worse in three specific ways:
 *
 *   1. Most of the links worth measuring live in SERVER components (CTA.js,
 *      the service pages, the blog cards). Attaching a handler means adding
 *      'use client' to each one, which ships their whole subtree to the
 *      browser to win a single click event.
 *   2. Every link added later starts untracked, and nothing fails — the number
 *      just quietly under-reports until somebody notices the totals do not
 *      match reality.
 *   3. Eleven call sites is eleven chances to pass a slightly different event
 *      name or forget the params.
 *
 * One listener on the document sees every click, including on markup that does
 * not exist yet. Components stay server-rendered and stay unaware of analytics.
 *
 * Capture phase on purpose: it fires before React's synthetic handlers, so a
 * link whose own handler closes a menu or calls preventDefault is still counted.
 */
export default function ClickTracker() {
  useEffect(() => {
    if (!analyticsEnabled()) return undefined;

    const onClick = (event) => {
      // `closest` rather than checking the target directly: the click almost
      // always lands on a <span> or an <svg> inside the anchor, never the
      // anchor itself.
      const link = event.target?.closest?.('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      // In-page anchors are navigation, not intent. Counting them puts every
      // "#how" click in the same report as a signup and makes the funnel lie.
      if (href.startsWith('#')) return;

      // An explicit data-track always wins, so a one-off can be labelled at the
      // markup without teaching this function about it.
      const explicit = link.dataset.track;
      if (explicit) {
        track(explicit, { link_text: text(link), link_url: href, ...dataParams(link) });
        return;
      }

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return; // mailto:, tel:, and anything malformed
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

      const internal = url.host === window.location.host;

      if (!internal) {
        // The app subdomain is not really "outbound" — it is the product, and
        // these are the two clicks that matter most on the site. Splitting them
        // out is the difference between a conversion metric and a pile of
        // undifferentiated exits.
        const isApp = url.host.startsWith('app.');
        if (isApp) {
          const isLogin = /login|signin/i.test(url.pathname);
          track(isLogin ? EV.ctaLogin : EV.ctaStartFree, {
            link_text: text(link),
            link_url: url.href,
            // Which block on the page produced the click. Without this every
            // signup click aggregates into one number and there is no way to
            // tell whether the hero or the footer is doing the work.
            location: sectionOf(link),
          });
          return;
        }
        track(EV.outboundClick, {
          link_text: text(link),
          link_url: url.href,
          outbound_domain: url.host,
        });
        return;
      }

      if (url.pathname.startsWith('/blog')) {
        // A bare /blog hit from the nav is a different intent from opening an
        // article, so they are different events.
        const isIndex = /^\/blog\/?$/.test(url.pathname);
        track(isIndex ? EV.navBlog : EV.blogPostOpen, {
          link_text: text(link),
          link_url: url.pathname,
          location: sectionOf(link),
        });
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

/**
 * A readable label for the link.
 *
 * textContent first, then the accessible name, then the alt text of an image
 * inside it. The fallbacks are not defensive padding: the blog cards and the
 * logo wrap an image with no text node at all, so textContent alone returns
 * empty string and those rows arrive in GA4 blank — the exact clicks worth
 * reading about, indistinguishable from each other in the report.
 *
 * Capped at 100 because GA4 silently drops string params longer than that.
 */
function text(el) {
  const raw =
    el.textContent?.trim() ||
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    el.querySelector('img[alt]')?.getAttribute('alt') ||
    '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, 100);
}

/** Any data-track-* attributes, passed through as event params. */
function dataParams(el) {
  const out = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key.startsWith('track') && key !== 'track') {
      out[key.slice(5).toLowerCase()] = value;
    }
  }
  return out;
}

/**
 * Which part of the page the click came from.
 *
 * Walks up for the nearest landmark with an id, which on this site is the
 * section ids the nav already scrollspies against, so the values line up with
 * the page structure rather than inventing a second vocabulary.
 */
function sectionOf(el) {
  const holder = el.closest('[id]');
  if (holder?.id) return holder.id;
  if (el.closest('footer')) return 'footer';
  if (el.closest('header, nav')) return 'nav';
  return 'body';
}
