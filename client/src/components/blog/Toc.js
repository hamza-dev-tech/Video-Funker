'use client';

import { useEffect, useState } from 'react';

import { c, font } from '@/config/site';

/**
 * Table of contents, with the current section highlighted.
 *
 * The ids come from the same pass that sanitised the HTML (see html.js), so
 * every entry here is guaranteed to have a matching anchor in the body. A TOC
 * built by re-slugging the headings afterwards desynchronises the moment two
 * headings share a title, and every link past the duplicate scrolls nowhere.
 *
 * Scroll-spy uses IntersectionObserver with a top-weighted rootMargin rather
 * than a scroll listener: a scroll handler runs on every frame of every scroll
 * on the longest page on the site, and the observer costs nothing when nothing
 * crosses.
 */
export default function Toc({ headings, variant = 'desktop' }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!headings || headings.length < 2) return undefined;

    const nodes = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!nodes.length) return undefined;

    /**
     * The band is the top ~25% of the viewport. Without the negative bottom
     * margin, the LAST heading on the page can never become active — there is
     * not enough content below it to scroll it up into a centred band — so the
     * final section of every article would highlight nothing.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -70% 0px', threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length < 2) return null;

  const list = (
    <ol className="vf-toc-list">
      {headings.map((h) => (
        <li key={h.id} className={h.level === 3 ? 'is-sub' : undefined}>
          <a
            href={`#${h.id}`}
            className={`vf-toc-link${activeId === h.id ? ' is-active' : ''}`}
            aria-current={activeId === h.id ? 'true' : undefined}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === 'mobile') {
    return (
      // <details> rather than a state toggle: it opens without JavaScript, and
      // it is the one disclosure widget screen readers already understand.
      <details className="vf-toc-mobile">
        <summary>
          <span style={{ font: `700 14px ${font.display}`, color: c.ink }}>On this page</span>
        </summary>
        {list}
      </details>
    );
  }

  return (
    <nav aria-labelledby="vf-toc-heading" className="vf-toc">
      <p id="vf-toc-heading" className="vf-toc-heading">
        On this page
      </p>
      {list}
    </nav>
  );
}
