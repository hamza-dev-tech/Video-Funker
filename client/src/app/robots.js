import { SITE_URL } from '@/config/site';

/**
 * robots.txt has NO INHERITANCE.
 *
 * The moment an agent matches its own User-agent block it ignores the `*`
 * block entirely. So every disallow has to be repeated in every block, or the
 * rules silently stop applying to precisely the crawlers you wrote a block for.
 * This is the single most common robots.txt bug and it is invisible in review,
 * which is why the lists below are constants that get spread into each block
 * rather than typed out per agent.
 */
const PRIVATE = ['/api/'];

/**
 * Crawl-safe facet policy, adopted BEFORE any filter UI ships. Retrofitting it
 * after a facet space has been crawled is far more expensive than writing it
 * now.
 *
 * Note the shape of the pattern. `/blog/*?*sort=` requires the path to begin
 * literally `/blog/`, which MISSES `/blog?sort=recent` — the single most likely
 * facet URL on this site. `/blog*sort=` matches both the index and every
 * archive beneath it.
 *
 * These are CRAWL directives, not index directives: a disallowed URL is never
 * fetched, so it can still be indexed URL-only from an inbound link. That is
 * the right trade for facets, which have no inbound links and whose only real
 * cost is crawl budget burned on an unbounded parameter space.
 */
const FACETS = ['/blog*sort=', '/blog*filter=', '/blog*orderby='];

/**
 * Search results are disallowed rather than merely noindexed.
 *
 * The page itself already sends `noindex, follow`, which handles anything the
 * crawler fetches. Disallowing on top of that stops it spending crawl budget
 * discovering an unbounded `?q=` space in the first place.
 */
const SEARCH = ['/blog/search'];

/**
 * AI crawler policy: allow nearly everything.
 *
 * The vendors split their fleets into training, search-index and live-fetch
 * bots, and blocking the wrong one removes the site from CITATIONS rather than
 * just from training. For a marketing site with no paywall and no content
 * licensing to protect, being the answer when someone asks an assistant about
 * founder-led video is worth more than withholding already-public articles.
 */
const AI_ALLOWED = [
  // Retrieval and citation. Never block these — this is the path by which an
  // assistant names you as a source.
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  // Training. Allowed deliberately.
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  // Gemini training ONLY. It has zero effect on Google Search ranking, which
  // is the confusion that makes people block it and lose nothing but reach.
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
];

export default function robots() {
  const disallow = [...PRIVATE, ...FACETS, ...SEARCH];

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Repeated per agent because of the no-inheritance rule above.
      ...AI_ALLOWED.map((userAgent) => ({ userAgent, allow: '/', disallow })),
      // No citation upside, documented robots non-compliance, bandwidth hog.
      { userAgent: 'Bytespider', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // `host` is deliberately absent: a Yandex extension that is no longer
    // honoured by anything, and it invites a second opinion about the canonical
    // hostname that the canonical tags already settle.
  };
}
