import { Suspense } from 'react';
import Link from 'next/link';

import SearchBox from './SearchBox';

/**
 * Category chips plus search.
 *
 * The chips are ordinary links, so they are crawlable paths into the archives
 * rather than a filter UI that only exists after hydration. That is the whole
 * reason the blog has category ROUTES instead of query parameters — see
 * robots.js, which disallows the parameter space precisely so that this stays
 * the only crawlable way to slice the archive.
 */
export default function BlogToolbar({ categories, active }) {
  return (
    <div className="vf-toolbar">
      <nav aria-label="Categories" className="vf-toolbar-chips">
        <Link href="/blog" className={`vf-chip${!active ? ' is-active' : ''}`} aria-current={!active ? 'page' : undefined}>
          All
        </Link>
        {(categories || []).map((cat) => (
          <Link
            key={cat.slug}
            href={`/blog/category/${cat.slug}`}
            className={`vf-chip${active === cat.slug ? ' is-active' : ''}`}
            aria-current={active === cat.slug ? 'page' : undefined}
          >
            {cat.name}
          </Link>
        ))}
        <Link href="/blog/topics" className="vf-chip vf-chip-quiet">
          All topics
        </Link>
      </nav>
      {/* SearchBox reads useSearchParams, which opts its subtree into client-
          side rendering. Without a Suspense boundary that de-opts this whole
          STATIC page into dynamic rendering — and in a production build it is a
          hard error, not a warning. The boundary keeps the archive static and
          streams the one input that needs the URL. */}
      <Suspense fallback={<div className="vf-search" style={{ height: 52 }} />}>
        <SearchBox />
      </Suspense>
    </div>
  );
}
