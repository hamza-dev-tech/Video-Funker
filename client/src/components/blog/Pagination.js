import Link from 'next/link';

/**
 * Page navigation for the archives.
 *
 * Two things here are crawl decisions rather than UI decisions:
 *
 *  · Page 1 is linked as the BARE path, never `?page=1`. `/blog` and
 *    `/blog?page=1` are the same page at two URLs, and linking the second one
 *    from inside the site is how a duplicate gets discovered and crawled.
 *
 *  · The links are real <a href> elements, not buttons that push state. A
 *    crawler follows hrefs; it does not click. Paginated archives are one of
 *    the main discovery paths into older articles, so a JS-only pager quietly
 *    orphans everything past page one.
 */
export default function Pagination({ page, total, perPage, basePath }) {
  const pages = Math.ceil((total || 0) / (perPage || 1));
  if (pages <= 1) return null;

  // basePath may already carry a query string — /blog/search?q=… does — so the
  // separator has to be chosen rather than assumed. Assuming "?" produces
  // "/blog/search?q=video?page=2", where the page number silently becomes part
  // of the search term.
  const join = basePath.includes('?') ? '&' : '?';
  const href = (n) => (n <= 1 ? basePath : `${basePath}${join}page=${n}`);

  // A window around the current page, always including the first and last so
  // the ends of a long archive stay one click away.
  const window = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => window.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => window.add(n));
  const shown = [...window].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="vf-pager">
      {page > 1 ? (
        <Link href={href(page - 1)} className="vf-pager-step" rel="prev">
          <span aria-hidden="true">←</span> Previous
        </Link>
      ) : (
        <span className="vf-pager-step is-disabled" aria-hidden="true">
          <span>←</span> Previous
        </span>
      )}

      <ol className="vf-pager-list">
        {shown.map((n, i) => {
          const gap = i > 0 && n - shown[i - 1] > 1;
          return (
            <li key={n} style={{ display: 'contents' }}>
              {gap && (
                <span className="vf-pager-gap" aria-hidden="true">
                  …
                </span>
              )}
              {n === page ? (
                <span className="vf-pager-num is-current" aria-current="page">
                  {n}
                </span>
              ) : (
                <Link href={href(n)} className="vf-pager-num" aria-label={`Page ${n}`}>
                  {n}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {page < pages ? (
        <Link href={href(page + 1)} className="vf-pager-step" rel="next">
          Next <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span className="vf-pager-step is-disabled" aria-hidden="true">
          Next <span>→</span>
        </span>
      )}
    </nav>
  );
}
