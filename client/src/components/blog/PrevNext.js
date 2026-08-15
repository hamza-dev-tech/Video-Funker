import Link from 'next/link';

import { c, font } from '@/config/site';

/**
 * Sequential siblings inside the same category.
 *
 * `rel="prev"` / `rel="next"` are for the reader's browser and for the shape of
 * the internal link graph, not for Google — it stopped using them as an
 * indexing signal in 2019. They stay because they are still correct and cost
 * nothing.
 */
export default function PrevNext({ prev, next }) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="More in this category" className="vf-prevnext">
      {prev ? (
        <Link href={`/blog/${prev.slug}`} rel="prev" className="vf-prevnext-card">
          <span style={{ font: `600 12px ${font.body}`, color: c.soft, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← Previous
          </span>
          <span style={{ font: `700 17px/1.35 ${font.display}`, color: c.ink, marginTop: 8, display: 'block' }}>
            {prev.title}
          </span>
        </Link>
      ) : (
        // Holds the column so a single neighbour does not stretch to full width
        // and read as the only option.
        <span aria-hidden="true" />
      )}

      {next ? (
        <Link href={`/blog/${next.slug}`} rel="next" className="vf-prevnext-card vf-prevnext-next">
          <span style={{ font: `600 12px ${font.body}`, color: c.soft, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Next →
          </span>
          <span style={{ font: `700 17px/1.35 ${font.display}`, color: c.ink, marginTop: 8, display: 'block' }}>
            {next.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
