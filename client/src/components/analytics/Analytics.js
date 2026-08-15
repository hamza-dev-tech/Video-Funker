import Script from 'next/script';

import { GA_ID, GTM_ID, analyticsEnabled } from '@/lib/analytics';

/**
 * Google Tag Manager, GA4 and Consent Mode v2.
 *
 * Three things here are load-bearing and are the parts these integrations
 * usually get wrong.
 *
 * ─── 1. CONSENT DEFAULTS RUN FIRST, SYNCHRONOUSLY ───────────────────────────
 * Consent Mode has to be initialised BEFORE the container loads, or the tag
 * fires once under the wrong assumptions and that first hit is unrecoverable.
 * So the defaults are a plain inline <script> in the document rather than a
 * next/script: `beforeInteractive` still resolves after this markup, and
 * "before the container" is the only ordering that counts.
 *
 * Everything defaults to DENIED. That is the safe default in the EEA and it is
 * not a data loss: with Consent Mode v2 the tags still fire, they just send
 * cookieless pings that Google models into aggregate reporting. Defaulting to
 * granted and asking afterwards is the arrangement that is actually unlawful.
 *
 * ─── 2. GTM AND GA4 ARE MUTUALLY EXCLUSIVE ──────────────────────────────────
 * If a container is configured, GA4 is expected to live INSIDE it as a tag,
 * and loading gtag.js here as well would double-count every session: two
 * page_view hits per navigation, bounce rate halved, session count doubled,
 * and no obvious symptom other than numbers that look pleasingly good.
 * So GTM wins when both are set, and the direct GA4 loader is the fallback for
 * a setup with no container.
 *
 * ─── 3. NOTHING LOADS WITHOUT AN ID ─────────────────────────────────────────
 * No id, no script, no request. That keeps development and preview builds out
 * of production analytics without anybody having to remember to switch it off.
 */

const CONSENT_DEFAULTS = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
try {
  var stored = localStorage.getItem('vf-consent');
  if (stored) {
    var c = JSON.parse(stored);
    gtag('consent', 'update', {
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied',
      analytics_storage: c.analytics ? 'granted' : 'denied'
    });
  }
} catch (e) {}
`;

export default function Analytics() {
  if (!analyticsEnabled()) return null;

  return (
    <>
      {/*
        Not a next/script. This must be the first executable thing on the page,
        and it must be synchronous, so it is emitted as ordinary markup.
        eslint-disable-next-line react/no-danger -- a build-time constant
      */}
      <script id="vf-consent-default" dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULTS }} />

      {GTM_ID ? (
        <Script id="vf-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      ) : (
        <>
          <Script
            id="vf-ga-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="vf-ga-init" strategy="afterInteractive">
            {`gtag('js', new Date());
gtag('config', '${GA_ID}', {
  /* The App Router changes routes without a document load, so the automatic
     page_view would only ever fire once, on the first paint. PageViews.js
     sends them on navigation instead, and this stops the two duplicating. */
  send_page_view: false
});`}
          </Script>
        </>
      )}
    </>
  );
}

/**
 * The <noscript> half of GTM. It has to sit immediately inside <body>, which
 * is why it is a separate export rather than part of the component above.
 */
export function GoogleTagManagerNoScript() {
  if (!analyticsEnabled() || !GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
