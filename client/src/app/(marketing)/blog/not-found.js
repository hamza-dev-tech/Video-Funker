import Link from 'next/link';

import { c, font, type } from '@/config/site';

/**
 * The blog's 404.
 *
 * It sends people somewhere rather than apologising. Most arrivals here are
 * either a mistyped URL or a link to a post that was renamed without an entry
 * in the old-slug index — and in both cases the topic hub is a better next step
 * than the back button.
 *
 * Next serves this with a real 404 status, which matters: a "not found" page
 * returned as 200 is a soft 404, and Google indexes it as a real page.
 */
export default function BlogNotFound() {
  return (
    <div className="vf-shell" style={{ paddingTop: 40, paddingBottom: 120 }}>
      <div className="vf-empty">
        <p style={{ font: `700 12px ${font.display}`, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.orangeDark }}>
          404
        </p>
        <p style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink, marginTop: 12 }}>
          That article is not here
        </p>
        <p style={{ font: `400 16px/1.65 ${font.body}`, color: c.muted, marginTop: 12, maxWidth: 440 }}>
          It may have moved, or the link may have been mistyped. Everything we have published is one
          click away.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/blog" className="vf-chip is-active">
            All articles
          </Link>
          <Link href="/blog/topics" className="vf-chip">
            Browse topics
          </Link>
        </div>
      </div>
    </div>
  );
}
