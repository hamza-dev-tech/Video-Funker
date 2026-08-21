import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import { c, font, type } from '@/config/site';

/**
 * The site-wide 404.
 *
 * Without this file Next serves its own bare default: black Helvetica on
 * white, no nav, no footer, no way back into the site. It still returns the
 * correct 404 status, so it is not an indexing bug, but it is a dead end for
 * anyone who mistypes a URL or follows a stale link, and it looks like the
 * site is broken rather than like the address was wrong.
 *
 * Next marks this route `noindex` on its own, which is why there is no robots
 * export here. Adding one would duplicate the directive.
 */
export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <>
      <Nav base="/" />
      <main
        style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '160px 24px 96px',
        }}
      >
        <p
          style={{
            font: `700 12px ${font.display}`,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: c.orangeDark,
          }}
        >
          404
        </p>
        <h1
          style={{
            font: `700 ${type.h3}/1.1 ${font.display}`,
            letterSpacing: '-0.02em',
            color: c.ink,
            margin: '14px 0 0',
          }}
        >
          That page is not here.
        </h1>
        <p
          style={{
            font: `400 17px/1.6 ${font.body}`,
            color: c.muted,
            margin: '14px 0 0',
            maxWidth: 460,
          }}
        >
          The link may be out of date, or the address may have a typo in it. Everything we have
          published is one click away.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/"
            className="vf-btn-sm vf-press"
            style={{
              background: c.orange,
              color: c.orangeInk,
              font: `700 15px ${font.body}`,
              padding: '13px 26px',
              borderRadius: 100,
            }}
          >
            Back to the homepage
          </Link>
          <Link
            href="/blog"
            className="vf-btn-ghost vf-press"
            style={{
              border: `1px solid ${c.lineStrong}`,
              color: c.ink,
              font: `600 15px ${font.body}`,
              padding: '12px 26px',
              borderRadius: 100,
            }}
          >
            Read the blog
          </Link>
        </div>
      </main>
      <Footer base="/" />
    </>
  );
}
