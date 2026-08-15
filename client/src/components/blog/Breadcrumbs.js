import Link from 'next/link';

import { c, font } from '@/config/site';

/**
 * Visual breadcrumbs only.
 *
 * The machine-readable BreadcrumbList is emitted by the page's @graph (see
 * lib/blog/schema.js), NOT here. Splitting them this way is deliberate: if the
 * component emitted its own BreadcrumbList it would be a second, competing
 * node, and the page's WebPage node references the graph's `@id` — a reference
 * that would then point at whichever one happened to win. One breadcrumb node
 * per page, minted in one place.
 *
 * The last crumb is not a link, because it is the page you are already on.
 */
export default function Breadcrumbs({ trail }) {
  if (!trail || trail.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="vf-crumbs">
      <ol style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={`${crumb.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isLast || !crumb.href ? (
                // aria-current tells a screen reader which crumb is "here".
                // Without it the trail reads as a list of equal links.
                <span aria-current="page" style={{ color: c.muted, font: `500 13px ${font.body}` }}>
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.href} className="vf-crumb">
                  {crumb.name}
                </Link>
              )}
              {!isLast && (
                <span aria-hidden="true" style={{ color: c.lineStrong, font: `400 13px ${font.body}` }}>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
