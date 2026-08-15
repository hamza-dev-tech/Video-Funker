'use client';

import { useEffect } from 'react';

import { c, font, type } from '@/config/site';

/**
 * The blog's error boundary.
 *
 * It exists because the data layer THROWS when the CMS is unreachable rather
 * than returning empty — which is the correct choice (an empty render gets
 * cached by Next as a valid 200, so one outage turns the blog into a blank page
 * that Google then crawls). Throwing means Next serves the previously cached
 * page instead. This boundary only ever appears on the paths where there is no
 * cached entry to fall back to.
 *
 * It offers `reset` rather than a reload link because the failure is usually
 * transient: a restarting php-fpm recovers in a couple of hundred milliseconds,
 * and reset re-runs the render without a full navigation.
 */
export default function BlogError({ error, reset }) {
  useEffect(() => {
    // The message reaches the server logs via the digest; this is what makes it
    // visible in a browser console during development.
    console.error('[blog] render failed', error);
  }, [error]);

  return (
    <div className="vf-shell" style={{ paddingTop: 40, paddingBottom: 120 }}>
      <div className="vf-empty">
        <p style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink }}>
          The articles are not loading
        </p>
        <p style={{ font: `400 16px/1.65 ${font.body}`, color: c.muted, marginTop: 12, maxWidth: 460 }}>
          Something upstream is not answering. This is usually over in a moment.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={reset} className="vf-search-btn">
            Try again
          </button>
          <a href="/" className="vf-chip">
            Back to the site
          </a>
        </div>
        {error && error.digest && (
          // The digest is the only handle support has on a specific failure.
          <p style={{ font: `400 12px ${font.body}`, color: c.soft, marginTop: 20 }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
