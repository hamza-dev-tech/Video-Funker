import Image from 'next/image';

import Reveal from '@/components/marketing/Reveal';
import { compareHeading, compareRows, deliverables, deliverablesHeading } from '@/config/content';
import { c, font } from '@/config/site';

const GRID = '1.5fr repeat(3, 1fr) 1fr';

export default function Deliverables() {
  return (
    <section
      id="deliverables"
      className="vf-pad"
      style={{
        background: c.panel,
        borderTop: `1px solid ${c.line}`,
        borderBottom: `1px solid ${c.line}`,
        padding: '100px 48px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal
          as="h2"
          style={{
            font: `600 clamp(34px, 3.4vw, 52px)/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            maxWidth: 700,
          }}
        >
          {deliverablesHeading.title}
        </Reveal>
        <Reveal
          as="p"
          delay={100}
          style={{ font: `400 19px/1.6 ${font.body}`, color: c.muted, maxWidth: 620, margin: '0 0 48px' }}
        >
          {deliverablesHeading.sub}
        </Reveal>

        <div className="vf-deliverables" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {deliverables.map((d, i) => (
            /* The reveal sits on a wrapper so the card keeps its own hover
               transform — a transition and a transform on one element are
               fine, but the grid span belongs to the outer box either way. */
            <Reveal
              key={d.title}
              variant="scale"
              delay={i * 80}
              className="vf-delcard-wrap"
              style={{ gridColumn: `span ${d.span}`, display: 'flex' }}
            >
              <div
                className={`vf-delcard${d.span === '2' ? ' vf-delcard-wide' : ''}`}
                style={{
                  background: c.white,
                  border: `1px solid ${c.line}`,
                  borderRadius: 18,
                  padding: 26,
                  display: 'flex',
                  gap: 10,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
                  <div
                    className="vf-glyph"
                    aria-hidden="true"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: d.chip,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: `600 19px ${font.display}`,
                      color: c.ink,
                      animation: `floaty 7s ${d.delay} ease-in-out infinite`,
                      flex: 'none',
                    }}
                  >
                    {d.glyph}
                  </div>
                  <h3 style={{ font: `600 21px ${font.display}`, letterSpacing: '-0.01em', margin: '4px 0 0' }}>
                    {d.title}
                  </h3>
                  <p style={{ font: `400 15px/1.6 ${font.body}`, color: c.muted, margin: 0 }}>{d.body}</p>
                </div>

                {/* Capped, never stretched. Left to scale with the card the
                    two-column card's accent would render twice the height of
                    its neighbours' and drag the whole grid row down with it. */}
                <div className="vf-accent">
                  <Image
                    src={d.art}
                    alt={d.artAlt}
                    width={528}
                    height={120}
                    sizes="380px"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ── Comparison ─────────────────────────────────────────── */}
        <div style={{ marginTop: 84 }}>
          <Reveal
            as="h3"
            style={{
              font: `600 clamp(26px, 2.4vw, 36px)/1.15 ${font.display}`,
              letterSpacing: '-0.02em',
              margin: '0 0 10px',
              maxWidth: 760,
            }}
          >
            {compareHeading.title}
          </Reveal>
          <Reveal
            as="p"
            delay={100}
            style={{ font: `400 17px/1.6 ${font.body}`, color: c.muted, maxWidth: 640, margin: '0 0 32px' }}
          >
            {compareHeading.sub}
          </Reveal>

          <Reveal
            variant="scale"
            delay={140}
            className="vf-compare-scroll"
            style={{
              border: `1px solid ${c.line}`,
              borderRadius: 18,
              overflow: 'hidden',
              maxWidth: 940,
              background: c.white,
              boxShadow: '0 18px 48px #0429520f',
            }}
          >
            <div className="vf-compare-grid">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  background: c.panelWarm,
                  borderBottom: `1px solid ${c.line}`,
                }}
              >
                <div style={{ padding: '18px 26px' }} />
                {compareHeading.columns.map((col) => (
                  <div
                    key={col}
                    style={{
                      padding: '18px 12px',
                      font: `500 14px ${font.body}`,
                      textAlign: 'center',
                      color: c.muted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </div>
                ))}
                <div
                  style={{
                    padding: '18px 12px',
                    font: `700 15px ${font.body}`,
                    textAlign: 'center',
                    color: c.orangeInk,
                    background: c.orange,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Video Funker
                </div>
              </div>

              {compareRows.map((row) => (
                <div
                  key={row.label}
                  className="vf-cmprow"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID,
                    borderBottom: `1px solid ${row.divider}`,
                  }}
                >
                  <div style={{ padding: '15px 26px', font: `500 15px ${font.body}`, whiteSpace: 'nowrap' }}>
                    {row.label}
                  </div>
                  {[
                    [row.c1, row.c1color],
                    [row.c2, row.c2color],
                    [row.c3, row.c3color],
                  ].map(([v, col], i) => (
                    <div
                      key={i}
                      style={{ padding: '15px 12px', textAlign: 'center', font: `500 16px ${font.body}`, color: col }}
                    >
                      {v}
                    </div>
                  ))}
                  <div
                    style={{
                      padding: '15px 12px',
                      textAlign: 'center',
                      font: `700 16px ${font.body}`,
                      color: c.orangeDark,
                      background: '#ff901b1f',
                    }}
                  >
                    {row.c4}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
