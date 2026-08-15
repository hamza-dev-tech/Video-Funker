import ProofArt from '@/components/marketing/ProofArt';
import Reveal from '@/components/marketing/Reveal';
import { proofHeading, proofs, wall } from '@/config/content';
import { c, font, space, type } from '@/config/site';

/**
 * Legacy shim. The wall used to be four PNGs and each item was identified by
 * its `src`; the artefacts are markup now and are picked by `kind`. This map
 * keeps the section rendering until content.js drops `src` and `alt` for
 * `kind`, and can be deleted the moment it does.
 */
const KIND_BY_SRC = {
  '/art/wall-video-still.png': 'post',
  '/art/wall-dm.png': 'reply',
  '/art/wall-analytics.png': 'numbers',
  '/art/wall-calendar.png': 'calendar',
};

export default function Proof() {
  return (
    <section
      id="proof"
      className="vf-pad"
      style={{ background: c.blue, color: '#fff', padding: `${space.section}px 48px`, overflow: 'hidden' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal
          as="h2"
          style={{
            font: `600 ${type.h2}/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            margin: '0 0 64px',
            maxWidth: 700,
          }}
        >
          {proofHeading.title}
          <span className="vf-h2-lead">{proofHeading.lead}</span>
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
                  font: `600 ${type.stat} ${font.display}`,
                  letterSpacing: '-0.02em',
                  color: c.yellow,
                  marginBottom: 12,
                }}
              >
                {p.big}
              </div>
              <div style={{ font: `600 18px ${font.body}`, marginBottom: 8 }}>{p.title}</div>
              <div style={{ font: `400 ${type.body}/1.6 ${font.body}`, color: c.blueWash }}>{p.body}</div>
            </Reveal>
          ))}
        </div>

        {/* The receipts: post → reply → numbers → calendar, in that order.

            These four were PNG exports until the copy inside them was found to
            be pixels: brand names, message text and view counts drawn at
            1788px wide and shown at roughly 300, next to a live 13px caption.
            They are markup now, so every word is real text at the real font and
            the four unverifiable counts they asserted are gone. See ProofArt. */}
        <div
          className="vf-wall-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, alignItems: 'stretch' }}
        >
          {wall.map((w, i) => (
            <Reveal key={w.caption} variant="up" delay={i * 90}>
              <figure
                className="vf-tilt vf-wall"
                style={{
                  '--tilt': w.tilt,
                  margin: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ProofArt kind={w.kind || KIND_BY_SRC[w.src]} />
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
