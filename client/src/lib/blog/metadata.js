import { SITE_URL, site } from '@/config/site';

/**
 * Build a blog route's `alternates` object.
 *
 * This exists because of a trap that is invisible until you curl the page.
 *
 * The blog layout declares the RSS feed as an alternate:
 *
 *   alternates: { types: { 'application/rss+xml': [...] } }
 *
 * and every route beneath it declares its own canonical:
 *
 *   alternates: { canonical: '/blog/whatever' }
 *
 * Next merges metadata SHALLOWLY. `alternates` is one key, so the child's
 * object replaces the parent's entirely rather than being merged into it, and
 * the `types` entry disappears. The result was zero `rel="alternate"` RSS
 * links across the whole blog: the feed existed, was linked from nowhere, and
 * nothing looked wrong on any page.
 *
 * This is the identical failure mode that put `canonical: '/'` on every route
 * from the root layout. Shallow merge is the rule, not the exception, so
 * anything a parent declares under a key a child also declares has to be
 * restated by the child. Restating it in six route files by hand is how it
 * drifts, so it is stated once here.
 *
 * @param {string} canonical Path for this route, e.g. '/blog/some-post'.
 */
export function blogAlternates(canonical) {
  return {
    canonical,
    types: {
      'application/rss+xml': [{ url: `${SITE_URL}/blog/feed.xml`, title: `${site.name} blog` }],
    },
  };
}
