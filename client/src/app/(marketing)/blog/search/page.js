import { Suspense } from 'react';

import Breadcrumbs from '@/components/blog/Breadcrumbs';
import Pagination from '@/components/blog/Pagination';
import PostGrid from '@/components/blog/PostGrid';
import SearchBox from '@/components/blog/SearchBox';
import { POSTS_PER_PAGE, searchPosts } from '@/lib/blog/queries';
import { blogAlternates } from '@/lib/blog/metadata';
import { c, font, type } from '@/config/site';

/**
 * Dynamic, and deliberately not cached by route.
 *
 * The query string is unbounded user input. A cached-by-URL search route lets
 * anyone mint unlimited cache entries by walking random queries; the data layer
 * handles the upstream caching with a short TTL instead.
 */
export const dynamic = 'force-dynamic';

/**
 * noindex, follow.
 *
 * Search result pages are the canonical example of a crawlable infinite space:
 * every distinct `?q=` is a URL, none of them has inbound links, and Google's
 * own guidance is to keep them out of the index. `follow` stays on so the
 * crawler can still reach the articles listed here.
 */
export const metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
  /**
   * Self-canonical, to the parameter-free path.
   *
   * Never a canonical to /blog. `noindex` plus a canonical pointing somewhere
   * else is a contradictory pair of signals, and the documented risk is that
   * the noindex follows the canonical to its target — which would be the blog
   * index. Pointing at /blog/search says "these result pages are all one page",
   * which is true and harmless.
   */
  alternates: blogAlternates('/blog/search'),
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof (params && params.q) === 'string' ? params.q.slice(0, 120) : '';
  const page = Math.max(1, Number(params && params.page) || 1);

  const { posts, total } = query ? await searchPosts(query, page) : { posts: [], total: 0 };

  const trail = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: 'Search' }];

  return (
    <div className="vf-shell">
      <header className="vf-blog-hero">
        <Breadcrumbs trail={trail} />
        <h1 style={{ font: `800 ${type.h2}/1.06 ${font.display}`, color: c.ink, marginTop: 16 }}>
          Search
        </h1>
        <div style={{ marginTop: 20, maxWidth: 520 }}>
          {/* Same reason as BlogToolbar: useSearchParams needs a boundary. */}
          <Suspense fallback={<div className="vf-search" style={{ height: 52 }} />}>
            <SearchBox />
          </Suspense>
        </div>
        {query && (
          // aria-live so the count is announced after a search rather than
          // silently replacing the previous result set.
          <p role="status" style={{ font: `500 15px ${font.body}`, color: c.muted, marginTop: 20 }}>
            {total} {total === 1 ? 'result' : 'results'} for “{query}”
          </p>
        )}
      </header>

      <div style={{ marginTop: 32 }}>
        <PostGrid
          posts={posts}
          emptyTitle={query ? `Nothing matched “${query}”` : 'What are you looking for?'}
          emptyBody={
            query
              ? 'Try a broader term, or browse by topic instead.'
              : 'Type a term above, or start from the topic hub.'
          }
        >
          <a href="/blog/topics" className="vf-chip is-active" style={{ marginTop: 20 }}>
            Browse all topics
          </a>
        </PostGrid>
      </div>

      <Pagination
        page={page}
        total={total}
        perPage={POSTS_PER_PAGE}
        basePath={`/blog/search?q=${encodeURIComponent(query)}`}
      />

      <div style={{ height: 88 }} />
    </div>
  );
}
