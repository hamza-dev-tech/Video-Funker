import Image from 'next/image';

import Reveal from '@/components/marketing/Reveal';
import { proofHeading, proofs, wall } from '@/config/content';
import { c, font } from '@/config/site';

export default function Proof() {
  return (
    <section id="proof" className="vf-pad" style={{ background: c.blue, color: '#fff', padding: '140px 48px', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal
          as="h2"
          style={{
            font: `600 clamp(40px, 4.2vw, 64px)/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            margin: '0 0 64px',
            maxWidth: 700,
          }}
        >
          {proofHeading}
        </Reveal>

        <div
          className="vf-proofs"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 84 }}
        >
          {proofs.map((p, i) => (
            <Reveal
              key={p.title}
              variant="pop"
              delay={i * 110}
              style={{
                background: c.blueCard,
                border: `1px solid ${c.blueMid}`,
                borderRadius: 20,
                padding: 34,
              }}
            >
              <div
                style={{
                  font: `600 clamp(40px, 3.6vw, 52px) ${font.display}`,
                  letterSpacing: '-0.02em',
                  color: c.yellow,
                  marginBottom: 12,
                }}
              >
                {p.big}
              </div>
              <div style={{ font: `600 18px ${font.body}`, marginBottom: 8 }}>{p.title}</div>
              <div style={{ font: `400 15px/1.6 ${font.body}`, color: c.blueWash }}>{p.body}</div>
            </Reveal>
          ))}
        </div>

        {/* The receipts: post → reply → numbers → calendar, in that order. */}
        <div className="vf-wall-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {wall.map((w, i) => (
            <Reveal key={w.caption} variant="up" delay={i * 90}>
              <figure className="vf-tilt vf-wall" style={{ '--tilt': w.tilt, margin: 0 }}>
                {/* Same as the feed strip: the art rounds its own corners, so
                    the shadow rides the alpha rather than a box. */}
                <div style={{ lineHeight: 0, filter: 'drop-shadow(0 18px 40px rgba(4,41,82,0.34))' }}>
                  <Image
                    src={w.src}
                    alt={w.alt}
                    width={894}
                    height={574}
                    sizes="(max-width: 1080px) 45vw, 300px"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
                <figcaption
                  style={{
                    font: `500 13px ${font.body}`,
                    color: c.blueWash,
                    marginTop: 12,
                    textAlign: 'center',
                    letterSpacing: '0.01em',
                  }}
                >
                  {w.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
