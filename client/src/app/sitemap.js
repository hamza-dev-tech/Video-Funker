import { getSitemapEntries, getTags, MIN_INDEXABLE_TAG_POSTS } from '@/lib/blog/queries';
import { SITE_URL } from '@/config/site';

// Freshness comes from the publish webhook (revalidateTag), not from polling.
export const revalidate = 86400;

/**
 * The sitemap.
 *
 * Two omissions are deliberate and both are the opposite of what most guides
 * say:
 *
 *  · No `priority`. Google has stated plainly that it ignores the field. A
 *    hand-assigned priority scale communicates nothing to any crawler and
 *    creates an argument in every code review about whether a post is a 0.7 or
 *    a 0.8.
 *
 *  · No `changeFrequency`. Same reason, plus it actively competes with
 *    `lastModified`, which IS used. A page claiming "daily" that has not
 *    changed in a year teaches the crawler to distrust the file.
 */
export default async function sitemap() {
  const [{ posts, categories }, tags] = await Promise.all([getSitemapEntries(), getTags()]);

  /**
   * Every indexable non-blog route. Add a page here in the same change that
   * creates it: a route missing from the sitemap is discoverable only through
   * internal links, which for a new page on a new domain can mean weeks.
   */
  const staticRoutes = [
    '',
    '/founder-led-video',
    '/b2b-video-agency',
    '/linkedin-video-content',
    '/vs/ai-writing-tools',
    '/vs/video-agencies',
    /* NOT /results or /results/[slug]. Those ship noindex because every factual
       field in them is still a placeholder, and listing a noindex URL here is a
       direct self-contradiction: it asks Google to crawl a page whose own meta
       tag then tells it to drop the result. Add them in the same change that
       replaces the placeholders with real client data. */
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/blog',
    '/blog/topics',
  ].map((path) => ({ url: `${SITE_URL}${path}` }));

  const postRoutes = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.lastModified,
    // The image sitemap extension. Cover art is otherwise only reachable
    // through the optimizer, which Google Images does not crawl.
    ...(p.images.length
      ? { images: p.images.map((src) => (src.startsWith('http') ? src : `${SITE_URL}${src}`)) }
      : {}),
  }));

  const categoryRoutes = categories.map((cat) => ({
    url: `${SITE_URL}/blog/category/${cat.slug}`,
    ...(cat.lastModified ? { lastModified: cat.lastModified } : {}),
  }));

  /**
   * Only tags that clear the SAME threshold /blog/tag applies as its noindex
   * cut-off. Listing a noindex URL in the sitemap is a direct contradiction: it
   * asks Google to crawl a page whose own meta tag then tells it to drop the
   * result, and Search Console reports that as an error rather than ignoring
   * it. The constant is imported so the two can never drift apart.
   */
  const tagRoutes = tags
    .filter((t) => t.count >= MIN_INDEXABLE_TAG_POSTS)
    .map((t) => ({ url: `${SITE_URL}/blog/tag/${t.slug}` }));

  /**
   * The last line is an invariant, enforced rather than assumed: a sitemap is a
   * list of canonical, parameter-free URLs. Slugs come from a CMS and a term
   * slug is not guaranteed parameter-free forever, so anything carrying a query
   * string or a fragment is dropped here rather than trusted upstream. A facet
   * URL reaching this array would ask Google to crawl exactly the space
   * robots.js simultaneously disallows.
   */
  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes].filter(
    (entry) => !entry.url.includes('?') && !entry.url.includes('#')
  );
}
