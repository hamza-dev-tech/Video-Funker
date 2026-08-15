'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Search, as a plain GET form.
 *
 * No onSubmit handler, no router.push, no controlled state. A GET form
 * navigates to `/blog/search?q=…` on its own, which means it works before
 * hydration, works with JavaScript disabled, and produces a real shareable URL
 * — the same URL the search route reads on the server. Wiring this through
 * client state would add a dependency on hydration for no behaviour that the
 * platform does not already provide.
 *
 * `defaultValue` rather than `value` so the field keeps the query on the
 * results page without the component owning the input.
 */
export default function SearchBox() {
  const params = useSearchParams();
  const q = params.get('q') || '';

  return (
    <form action="/blog/search" method="get" role="search" className="vf-search">
      <label htmlFor="vf-blog-q" className="vf-visually-hidden">
        Search articles
      </label>
      <input
        id="vf-blog-q"
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search articles"
        // A search field should never be autocorrected into a different word.
        autoComplete="off"
        spellCheck="false"
        maxLength={120}
        className="vf-search-input"
      />
      <button type="submit" className="vf-search-btn">
        Search
      </button>
    </form>
  );
}
