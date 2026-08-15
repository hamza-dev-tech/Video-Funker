import DeliverableArt from '@/components/marketing/DeliverableArt';
import Icon, { COMPARE_LABELS } from '@/components/marketing/icons';
import Reveal from '@/components/marketing/Reveal';
import { compareHeading, compareRows, deliverables, deliverablesHeading } from '@/config/content';
import { c, font, space, type } from '@/config/site';

/**
 * Column widths.
 *
 * The last track is the widest of the value columns on purpose. It used to be
 * `1fr`, identical to the three it is being compared against, and measured out
 * at 166px against their 170.9px: the column the whole table exists to
 * highlight was rendering NARROWER than its competitors. The label column is
 * widest because its content is words rather than a single glyph.
 */
const GRID = '1.6fr repeat(3, 1fr) 1.3fr';

export default function Deliverables() {
  return (
    <section
      id="deliverables"
      className="vf-pad"
      style={{
        background: c.panel,
        borderTop: `1px solid ${c.line}`,
        borderBottom: `1px solid ${c.line}`,
        padding: `${space.section}px 48px`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal
          as="h2"
          style={{
            font: `600 ${type.h2}/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            maxWidth: 700,
          }}
        >
          {deliverablesHeading.title}
          <span className="vf-h2-lead">{deliverablesHeading.lead}</span>
        </Reveal>
        <Reveal
          as="p"
          delay={100}
          style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, maxWidth: 620, margin: '0 0 48px' }}
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
                      color: c.ink,
                      animation: `floaty 7s ${d.delay} ease-in-out infinite`,
                      flex: 'none',
                    }}
                  >
                    <Icon name={d.glyph} size={22} />
                  </div>
                  <h3 style={{ font: `600 ${type.title} ${font.display}`, letterSpacing: '-0.01em', margin: '4px 0 0' }}>
                    {d.title}
                  </h3>
                  <p style={{ font: `400 15px/1.6 ${font.body}`, color: c.muted, margin: 0 }}>{d.body}</p>
                </div>

                {/* Capped, never stretched. Left to scale with the card, the
                    two-column card's visual would render twice the height of
                    its neighbours' and drag the whole grid row down with it. */}
                <div className="vf-accent">
                  <DeliverableArt kind={d.art} />
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
              font: `600 ${type.h3}/1.15 ${font.display}`,
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

          {/* Two boxes, deliberately. The frame owns the rounded corners and
              clips to them; the scroller inside it owns the horizontal
              overflow. They used to be one element with an inline
              `overflow: hidden`, which beat the `overflow-x: auto` the mobile
              media query was trying to set — so on every phone the table
              clipped 307px off its own right edge and the "Video Funker"
              column, the entire point of the comparison, was unreachable. */}
          <Reveal
            variant="scale"
            delay={140}
            className="vf-compare-frame"
            style={{
              position: 'relative',
              border: `1px solid ${c.line}`,
              borderRadius: 18,
              overflow: 'hidden',
              /* No maxWidth. It was capped at 940px inside a 1280px container,
                 sitting directly under a card grid that spans the full 1280.
                 That stranded 353px of empty space to its right and made the
                 section look like two different layouts stacked on top of each
                 other. A comparison table is the moment a reader decides; it
                 should not look like an afterthought pinned to the left. */
              background: c.white,
              boxShadow: '0 18px 48px #0429520f',
            }}
          >
            <div className="vf-compare-scroll">
              <div className="vf-compare-grid">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  background: c.panelWarm,
                  borderBottom: `1px solid ${c.line}`,
                }}
              >
                <div style={{ padding: '22px 28px' }} />
                {compareHeading.columns.map((col) => (
                  <div
                    key={col}
                    style={{
                      padding: '22px 14px',
                      font: `500 15px ${font.body}`,
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
                    padding: '22px 14px',
                    font: `700 16px ${font.body}`,
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
                  <div style={{ padding: '20px 28px', font: `500 16px ${font.body}`, whiteSpace: 'nowrap' }}>
                    {row.label}
                  </div>
                  {[
                    [row.c1, row.c1color],
                    [row.c2, row.c2color],
                    [row.c3, row.c3color],
                  ].map(([v, col], i) => (
                    <div
                      key={i}
                      style={{ padding: '20px 14px', display: 'grid', placeItems: 'center', color: col }}
                    >
                      <Icon name={v} size={23} label={`${COMPARE_LABELS[v]}, ${row.label}, ${compareHeading.columns[i]}`} />
                    </div>
                  ))}
                  <div
                    style={{
                      padding: '20px 14px',
                      display: 'grid',
                      placeItems: 'center',
                      color: c.orangeDark,
                      background: '#ff901b1f',
                    }}
                  >
                    <Icon
                      name={row.c4}
                      size={24}
                      strokeWidth={2.6}
                      label={`${COMPARE_LABELS[row.c4]}, ${row.label}, Video Funker`}
                    />
                  </div>
                </div>
              ))}
              </div>
            </div>
          </Reveal>

          {/* `~` meant "partly" and nothing on the page said so. */}
          <Reveal
            as="ul"
            delay={200}
            className="vf-compare-legend"
            style={{ font: `500 14px ${font.body}`, color: c.muted }}
          >
            {Object.entries(COMPARE_LABELS).map(([glyph, label]) => (
              <li key={glyph}>
                <Icon name={glyph} size={16} />
                {label}
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
