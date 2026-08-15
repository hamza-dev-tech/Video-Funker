/**
 * Analytics configuration and the event helper.
 *
 * Every id is read from the environment rather than hardcoded, so the same
 * build runs with no analytics locally, a debug container on staging, and the
 * real one in production, without a code change or an `if (isProd)` branch
 * anybody can forget to flip.
 *
 * NEXT_PUBLIC_* is inlined at BUILD time, not read at runtime. Changing one of
 * these on the server means a rebuild, which on this project means a deploy.
 * That is a property of Next, not a choice made here, and it is worth knowing
 * before wondering why an id edit did nothing.
 */

import { GA4_ID } from '@/config/site';

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

/**
 * The env var wins if it is set, so a staging box can point at a throwaway
 * property without a code change. Otherwise the committed id applies, but ONLY
 * in a production build.
 *
 * That NODE_ENV guard is the important half. Next replaces `process.env.NODE_ENV`
 * statically at build time — 'development' under `next dev`, 'production' under
 * `next build` — so this is a compile-time branch, not a runtime check, and the
 * id is not even present in the development bundle. Without it, every page
 * opened while working on the site would send real hits: the property would
 * fill with sessions from one machine in one city hammering the same routes,
 * and the traffic reports would be describing the developer rather than the
 * market.
 */
export const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID || (process.env.NODE_ENV === 'production' ? GA4_ID : '');

/** No id, no scripts, no third-party requests. */
export function analyticsEnabled() {
  return Boolean(GTM_ID || GA_ID);
}

/**
 * Push an event.
 *
 * One function for both setups. With a container the event lands in
 * `dataLayer` and GTM decides what to do with it; without one it goes straight
 * to gtag. Call sites should never care which is configured, because the whole
 * point of the switch in Analytics.js is that it can change later without
 * touching anything that measures.
 *
 * Fails silently and deliberately. An analytics call is never worth throwing
 * inside a click handler and breaking the thing the visitor was doing.
 *
 * @param {string} name  snake_case, GA4's convention. `book_call`, not `Book Call`.
 * @param {Record<string, unknown>} [params]
 */
export function track(name, params = {}) {
  if (typeof window === 'undefined' || !name) return;
  try {
    if (GTM_ID) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name, ...params });
    } else if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {
    /* never let measurement break the page */
  }
}

/**
 * The events this site sends.
 *
 * A named catalogue rather than string literals at call sites, because GA4
 * treats `start_free_click` and `start_free_clicked` as two unrelated events
 * and silently reports half your conversions under each. One typo in a
 * component is a metric that quietly splits in two.
 */
export const EV = {
  ctaStartFree: 'start_free_click',
  ctaLogin: 'login_click',
  navBlog: 'nav_blog_click',
  blogPostOpen: 'blog_post_open',
  blogShare: 'blog_share',
  blogCopyLink: 'blog_copy_link',
  servicePageView: 'service_page_view',
  comparisonView: 'comparison_view',
  outboundClick: 'outbound_click',
  consentGranted: 'consent_granted',
  consentDenied: 'consent_denied',
};

/**
 * Update Consent Mode after the visitor chooses.
 *
 * `gtag('consent', 'update', …)` rather than reloading the tag: Google buffers
 * the cookieless pings sent while consent was denied and backfills them once
 * it is granted, so a visitor who accepts is not counted as arriving from
 * nowhere.
 *
 * @param {{analytics: boolean, marketing: boolean}} choice
 */
export function updateConsent(choice) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('vf-consent', JSON.stringify(choice));
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: choice.analytics ? 'granted' : 'denied',
        ad_storage: choice.marketing ? 'granted' : 'denied',
        ad_user_data: choice.marketing ? 'granted' : 'denied',
        ad_personalization: choice.marketing ? 'granted' : 'denied',
      });
    }
    track(choice.analytics ? EV.consentGranted : EV.consentDenied, {
      analytics: choice.analytics,
      marketing: choice.marketing,
    });
  } catch {
    /* a blocked localStorage must not break the banner */
  }
}

/** What the visitor previously chose, or null if they have not been asked. */
export function readConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vf-consent');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
