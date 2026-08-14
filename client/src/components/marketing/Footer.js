import Logo from '@/components/brand/Logo';
import Reveal from '@/components/marketing/Reveal';
import { c, font, footerNav, site } from '@/config/site';

/**
 * The footer used to be the top nav again — the same four anchors, a logo and
 * a copyright line, on one row. It now leads with the brand and its one-line
 * argument, and the links sit under a real label rather than floating.
 *
 * Still missing, and deliberately not faked here: privacy, terms and a contact
 * route. All three currently 404, and a footer link to a dead page is worse
 * than no link. They need pages before they need markup.
 */
export default function Footer() {
  return (
    <Reveal
      as="footer"
      className="vf-pad vf-footer"
      style={{ borderTop: `1px solid ${c.line}`, padding: '56px 48px 40px' }}
    >
      <div className="vf-footer-inner">
        <div className="vf-footer-brand">
          <Logo height={30} />
          <p style={{ font: `400 15px/1.6 ${font.body}`, color: c.muted, marginTop: 14, maxWidth: 320 }}>
            {site.tagline}
          </p>
        </div>

        {/* The nav carries its own accessible name, so this stays a paragraph.
            As a heading it was a 13px `h2` sitting at the same outline level as
            the section titles. */}
        <nav aria-label="Footer">
          <p className="vf-footer-heading">On this page</p>
          <ul style={{ listStyle: 'none', font: `500 15px ${font.body}`, color: c.soft }}>
            {footerNav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="vf-footlink">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div
        className="vf-footer-base"
        style={{ font: `400 14px ${font.body}`, color: c.soft, borderTop: `1px solid ${c.line}` }}
      >
        © {new Date().getFullYear()} {site.legalName}. All rights reserved.
      </div>
    </Reveal>
  );
}
