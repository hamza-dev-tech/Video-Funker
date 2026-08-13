import Logo from '@/components/brand/Logo';
import Reveal from '@/components/marketing/Reveal';
import { c, font, footerNav, site } from '@/config/site';

export default function Footer() {
  return (
    <Reveal
      as="footer"
      className="vf-pad"
      style={{
        borderTop: `1px solid ${c.line}`,
        padding: '36px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <Logo height={30} />

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', font: `500 15px ${font.body}`, color: c.soft }}>
        {footerNav.map((n) => (
          <a key={n.href} href={n.href} className="vf-footlink">
            {n.label}
          </a>
        ))}
      </div>

      <div style={{ font: `400 14px ${font.body}`, color: c.soft }}>
        © {new Date().getFullYear()} {site.legalName}. All rights reserved.
      </div>
    </Reveal>
  );
}
