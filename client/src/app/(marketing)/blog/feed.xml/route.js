import { getRecentPosts } from '@/lib/blog/queries';
import { SITE_URL, site } from '@/config/site';

/**
 * NOT prerendered, deliberately.
 *
 * `getRecentPosts` throws when the CMS is unreachable, and a throw inside a
 * prerendered route ABORTS THE WHOLE BUILD. With `revalidate` this route would
 * be build-time rendered, which means `npm run build` — and therefore every
 * deploy — hard-fails whenever WordPress happens to be down or slow. A CMS blip
 * must never block shipping the app.
 *
 * Making it dynamic costs nothing: the upstream fetch is still cached and still
 * invalidated by the publish webhook. Only the XML assembly moves to request
 * time.
 */
export const dynamic = 'force-dynamic';

/**
 * Escapes the five XML entities.
 *
 * `&` must be replaced FIRST. Doing it after the others would re-escape the
 * ampersands those replacements just introduced, producing `&amp;lt;` and a
 * feed that renders literal entity text to every subscriber.
 */
function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Control characters are illegal in XML 1.0 at any escaping level — a
    // single stray one makes the whole document unparseable, and they arrive
    // via copy-paste from Word more often than anyone expects.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

export async function GET() {
  /**
   * A thrown error here would return Next's HTML error page under an
   * `application/rss+xml` request. Feed readers and Google's feed fetcher get
   * garbage instead of a temporary-failure signal, and a repeated hard error is
   * precisely what makes an aggregator mark a feed permanently dead.
   *
   * So: serve a valid channel with no items, under 503 and Retry-After. That
   * reads as "come back", never as "these articles were unpublished".
   */
  let items = '';
  let degraded = false;
  try {
    items = renderItems(await getRecentPosts(20));
  } catch {
    degraded = true;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(`${site.name} blog`)}</title>
<link>${SITE_URL}/blog</link>
<atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
<description>${esc('How founder-led video actually gets made, distributed and measured.')}</description>
<language>en</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    status: degraded ? 503 : 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // An empty feed must never be cached: with the normal hour-long s-maxage
      // one CMS blip would pin "no articles" at the edge long after it
      // recovered.
      'Cache-Control': degraded ? 'no-store' : 'public, max-age=3600, s-maxage=3600',
      ...(degraded ? { 'Retry-After': '300' } : {}),
    },
  });
}

function renderItems(posts) {
  return posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.slug}`;
      // RFC 822, which is what RSS 2.0 requires — an ISO 8601 date is silently
      // ignored by strict readers and the item shows up undated.
      const pubDate = p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : '';
      const description = p.excerpt ? `<description>${esc(p.excerpt)}</description>` : '';
      const category = p.category ? `<category>${esc(p.category.name)}</category>` : '';
      return (
        `<item><title>${esc(p.title)}</title>` +
        `<link>${link}</link>` +
        // isPermaLink="true" says the guid IS the URL, so a reader that has
        // already shown this item will not show it again after a re-render.
        `<guid isPermaLink="true">${link}</guid>` +
        `${pubDate}${category}${description}</item>`
      );
    })
    .join('\n');
}
