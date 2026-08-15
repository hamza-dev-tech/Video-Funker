import { Suspense } from 'react';

import { Plus_Jakarta_Sans, Hanken_Grotesk } from 'next/font/google';

import { site, SITE_URL } from '@/config/site';
import { buildGraph, ldJson, siteGraph } from '@/lib/blog/schema';
import Analytics, { GoogleTagManagerNoScript } from '@/components/analytics/Analytics';
import PageViews from '@/components/analytics/PageViews';
import CookieConsent from '@/components/analytics/CookieConsent';
import './globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name}: AI video content that books meetings`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  /**
   * Search Console verification.
   *
   * Emitted only when the env var is set, so no stale token ships once the
   * property is verified. This covers the URL-prefix property; a Domain
   * property is verified by DNS TXT instead and needs nothing in the HTML.
   */
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
  /**
   * NO `alternates.canonical` here, and no `keywords`.
   *
   * The canonical is the important one. Next merges metadata SHALLOWLY, so any
   * route that does not declare its own `alternates` object inherits this one
   * verbatim. With `canonical: '/'` sitting on the root layout, every page
   * added to this site would ship
   * `<link rel="canonical" href="https://videofunker.ai/">` and tell Google it
   * is a duplicate of the homepage. A service page, a pricing page, an about
   * page: all of them would fold into the homepage and drop out of the index,
   * and nothing about the page would look wrong while it happened. The
   * homepage declares its own in app/page.js.
   *
   * `keywords` was deleted because Google has ignored the meta keywords tag
   * since 2009 and says so publicly. It cost nothing but it also did nothing,
   * and leaving it in invites somebody to spend an afternoon tuning it.
   */
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: site.name,
    title: `${site.name}: AI video content that books meetings`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name}: AI video content that books meetings`,
    description: site.description,
  },
  /**
   * No `robots` here.
   *
   * "index, follow" is what a crawler already assumes when no directive is
   * present, so emitting it site-wide buys nothing — and because metadata is
   * inherited, it CONFLICTS with the `noindex` Next emits on its own 404 page.
   * Two robots tags on one page is not fatal (the most restrictive wins), but
   * shipping a page that tells crawlers both "index this" and "do not index
   * this" is a defect waiting to be resolved the wrong way by some other
   * consumer. Routes that need a directive set their own.
   */
};

export const viewport = {
  themeColor: '#0560be',
  width: 'device-width',
  initialScale: 1,
};

/**
 * The product entity.
 *
 * The `@id` and the `publisher` reference are what stop this from colliding
 * with the Organization node the blog emits. Both nodes legitimately carry
 * `url: SITE_URL`, and without ids a consumer merging by URL sees one entity
 * claiming to be both a SoftwareApplication and an Organization — two
 * competing answers to "what is this". With ids they are what they actually
 * are: an application, published by a company.
 *
 * The Organization itself is described once, in the blog layout, so this
 * references it rather than repeating it. A reference to a node that no page
 * in the crawl emits would be a dangling id, which is why the reference is a
 * bare `@id` and never a half-populated copy.
 */
const appNode = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: site.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: site.description,
  publisher: { '@id': `${SITE_URL}/#organization` },
  /**
   * No `offers` node.
   *
   * It used to claim `price: '0'` with the description "First video free".
   * That is not what the offer is: this is a paid retainer service whose first
   * video is a sample. A price of zero in structured data is a machine-readable
   * assertion that the product costs nothing, and Google's structured data
   * policy treats markup that contradicts the visible page as spam. It also
   * risked a "Free" price annotation appearing on the result for a service
   * that is not free, which converts the wrong people and burns trust on the
   * first click.
   *
   * Put a real Offer back the day /pricing publishes real numbers, and make
   * the two agree.
   */
};

/**
 * One @graph for the whole site, on every page.
 *
 * `siteGraph` carries the Organization and WebSite nodes; this adds the product.
 * Merging them into a single graph rather than emitting the app on its own is
 * what makes the `publisher` reference above resolve — an `@id` pointing at a
 * node no page describes is a dangling reference, and no validator reports it.
 */
const jsonLd = buildGraph(...siteGraph['@graph'], appNode);

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Consent defaults must execute before the container loads, so this
            sits in <head> rather than beside the rest of the body scripts. */}
        <Analytics />
      </head>
      <body>
        {/* GTM's noscript has to be the first thing inside <body>. */}
        <GoogleTagManagerNoScript />
        {/* Reveals start hidden and are shown by an observer. Without JS that
            observer never runs, so hand those elements straight to visible. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1 !important;transform:none !important}'}</style>
        </noscript>
        {children}
        {/* Suspense: PageViews reads useSearchParams, which would otherwise
            opt every static page in the app into dynamic rendering. */}
        <Suspense fallback={null}>
          <PageViews />
        </Suspense>
        <CookieConsent />
        <script
          type="application/ld+json"
          // ldJson, not JSON.stringify: it escapes `</script>` and the two raw
          // line separators that are legal in JSON and fatal in a script block.
          // eslint-disable-next-line react/no-danger -- escaped by ldJson
          dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }}
        />
      </body>
    </html>
  );
}
