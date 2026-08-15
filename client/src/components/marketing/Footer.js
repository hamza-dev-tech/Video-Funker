import Link from 'next/link';

import Logo from '@/components/brand/Logo';
import Reveal from '@/components/marketing/Reveal';
import { appLinks, c, font, footerNav, site } from '@/config/site';

/**
 * The site footer.
 *
 * What it replaced: a two-column row with the brand on the left and a single
 * list of four same-page anchors pushed to the far right, under the heading
 * "On this page". At 1900px that left roughly a thousand pixels of empty
 * white between them, the heading described a table of contents rather than a
 * footer, and the whole thing carried five links.
 *
 * A footer is not decoration on a site this size. It is the only element on
 * every page, which makes it the site's primary internal linking surface and
 * the main way a crawler reaches anything that is not linked from the
 * homepage body. It is also where a reader who scrolled the whole page and did
 * not convert goes next. Four anchors to sections they just scrolled past
 * served neither purpose.
 *
 * So: real columns, grouped by intent, each a labelled <nav> landmark.
 *
 * ─── ADDING LINKS ────────────────────────────────────────────────────────────
 * Every href here must resolve. The previous version carried a comment
 * explaining that privacy, terms and contact were deliberately absent because
 * they 404, and that reasoning still holds: a footer link to a dead page is
 * worse than no link, because it is on every page and a crawler will follow it
 * from all of them. Add a group entry in the same change that ships the route,
 * never before.
 */

const GROUPS = [
  {
    label: 'Services',
    links: [
      { label: 'Founder-led video', href: '/founder-led-video' },
      { label: 'B2B video agency', href: '/b2b-video-agency' },
      { label: 'LinkedIn video content', href: '/linkedin-video-content' },
    ],
  },
  {
    label: 'Compare',
    links: [
      { label: 'vs AI writing tools', href: '/vs/ai-writing-tools' },
      { label: 'vs video agencies', href: '/vs/video-agencies' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'All topics', href: '/blog/topics' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export default function Footer({ base = '' }) {
  /* Only same-page anchors are rebased. `footerNav` is all anchors; the groups
     above are real paths, and prefixing one would produce "//blog", which a
     browser reads as a protocol-relative URL pointing at a host named "blog". */
  const onThisPage = footerNav.map((n) =>
    n.href.startsWith('#') ? { ...n, href: `${base}${n.href}` } : n
  );

  return (
    <footer className="vf-footer2" style={{ background: c.panel, borderTop: `1px solid ${c.line}` }}>
      <div className="vf-footer2-inner">
        <Reveal className="vf-footer2-brand" variant="fade">
          <Link href="/" aria-label={`${site.name} home`} style={{ display: 'inline-flex' }}>
            <Logo height={30} />
          </Link>
          <p style={{ font: `400 15px/1.65 ${font.body}`, color: c.muted, marginTop: 16, maxWidth: 300 }}>
            {site.tagline}
          </p>
          <a
            href={appLinks.signup}
            className="vf-footer2-cta vf-press"
            style={{
              background: c.orange,
              color: c.orangeInk,
              font: `700 15px ${font.body}`,
            }}
          >
            Start free
            <span aria-hidden="true" className="vf-footer2-cta-arrow">
              →
            </span>
          </a>
        </Reveal>

        <div className="vf-footer2-cols">
          {GROUPS.map((group, i) => (
            <Reveal key={group.label} as="nav" variant="up" delay={i * 70} aria-label={group.label}>
              <p className="vf-footer2-heading">{group.label}</p>
              <ul>
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="vf-footer2-link">
                      <span>{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          {/* Kept as its own group because these are anchors, not pages. On any
              route other than the homepage they are rebased to /#section, so
              they still work rather than scrolling to nothing. */}
          <Reveal as="nav" variant="up" delay={140} aria-label="On this page">
            <p className="vf-footer2-heading">The pitch</p>
            <ul>
              {onThisPage.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="vf-footer2-link">
                    <span>{n.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>

      <div className="vf-footer2-base">
        {/* A hardcoded year, not new Date().getFullYear(). The server renders
            this at build time and the browser at hydration time; across a New
            Year boundary those disagree and React reports a hydration
            mismatch. One number to change once a year is the cheaper bug. */}
        <p style={{ font: `400 14px ${font.body}`, color: c.soft }}>
          © 2026 {site.legalName}. All rights reserved.
        </p>
        <p style={{ font: `400 14px ${font.body}`, color: c.soft }}>
          Built for B2B teams who would rather be recognised than remembered.
        </p>
      </div>
    </footer>
  );
}
