'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { howHeading, steps } from '@/config/content';
import { c, font, space, type } from '@/config/site';

/**
 * A tall section with a sticky stage: scrolling through it walks the four
 * steps, crossfading a real product screenshot for each one. The cards are
 * also clickable, which pins the step the reader asked for.
 *
 * Two rules keep the click and the scroll story from fighting each other:
 *
 *   1. The stage always fits the pinned screen. The sticky pane is exactly
 *      100vh and the stage flexes into whatever the heading and the cards
 *      leave over, so a screenshot is never clipped and reading one never
 *      costs a scroll. It used to be capped at 58vh regardless of how much
 *      sat above it, so on a normal laptop the bottom of the shot fell under
 *      the fold and the only way to see it was to scroll.
 *   2. A click ends the scroll story. Scrolling is this section's own
 *      navigation, so scrolling down to look at a shot also walked the
 *      selection forward — the reader who picked step 1 arrived at step 4
 *      with a different image in front of them. So the first click takes the
 *      runway away: the section collapses to the one screen it is already
 *      showing, the scroll listener comes off, and what is left is a plain
 *      panel of four tabs. The picked step stays picked, and the next scroll
 *      goes to the next section instead of grinding through 2.2 screens of
 *      travel the reader has already opted out of.
 *
 * Collapsing mid-section is invisible: inside the runway the pane is stuck to
 * the top of the window, which is exactly where the section's own top lands
 * once the runway is gone, so scrolling to it moves nothing on screen. It is
 * a one-way switch — a reader who has taken the wheel keeps it for the rest
 * of the page, rather than having the section start driving again behind them.
 *
 * Below 900px that whole mechanism is switched off in CSS. At phone width the
 * sticky stage rendered the screenshot at 335×191px — these are dense product
 * UIs, so at that size they are texture rather than information — and it cost
 * 3.2 screens of scroll-jacked travel to walk past four of them. So the narrow
 * layout drops the stage, drops the 320vh runway, and gives each step its own
 * full-width screenshot inside its own card. Same four steps, same images,
 * read at a size that works and scrolled at the reader's own pace.
 *
 * Both layouts ship in the same HTML and CSS picks one, so there is no
 * hydration branch and nothing reflows after load. The images share their URLs
 * across the two, so the duplicate markup costs no extra bytes — and each copy
 * is lazy, so the one that is `display: none` never intersects and never
 * fetches.
 */
export default function HowItWorks() {
  const wrap = useRef(null);
  const [active, setActive] = useState(0);
  // The reader has taken the wheel: the runway is gone and the cards are the
  // only thing that changes the stage.
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (picked) return undefined; // no runway left to read, and nothing to drive
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      // In the compact layout the section is only as tall as its content, so
      // there is no progress to read and nothing to drive.
      if (total <= 0) return;
      const prog = Math.min(1, Math.max(0, -r.top / total));
      setActive(Math.min(steps.length - 1, Math.floor(prog * steps.length)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [picked]);

  const goTo = (i) => {
    const el = wrap.current;
    if (!el) return;
    // Compact layout — the card carries its own screenshot, so there is
    // nothing to switch and no runway to take away.
    if (!picked && el.offsetHeight - window.innerHeight <= 0) return;
    setActive(i);
    if (picked) return; // already a panel of tabs: just switch the shot
    setPicked(true);
    // Land on the section's own top. Inside the runway that is where the
    // pinned pane already sits, so nothing moves; on the way in it brings the
    // stage up whole. Either way the section is one screen from here, and the
    // next scroll belongs to the next section.
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: window.scrollY < top ? 'smooth' : 'auto' });
  };

  return (
    <section id="how" ref={wrap} className={picked ? 'vf-how vf-how-picked' : 'vf-how'}>
      <div
        className="vf-pad vf-how-inner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${space.section}px 48px 40px`,
          maxWidth: 1280,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="vf-how-head"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 34 }}
        >
          <div>
            <h2
              style={{
                font: `600 ${type.h2}/1.05 ${font.display}`,
                letterSpacing: '-0.02em',
                margin: '0 0 12px',
              }}
            >
              {howHeading.title}
              <span className="vf-h2-lead">{howHeading.lead}</span>
            </h2>
            <p style={{ font: `400 ${type.lead}/1.5 ${font.body}`, color: c.muted, margin: 0 }}>{howHeading.sub}</p>
          </div>

          <div className="vf-how-dots" style={{ display: 'flex', gap: 8, paddingBottom: 8 }} aria-hidden="true">
            {steps.map((s, i) => (
              <div
                key={s.n}
                style={{
                  width: i === active ? 34 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === active ? c.orange : c.line,
                  transition: 'width 0.35s, background 0.35s',
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="vf-steps"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 26 }}
        >
          {steps.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === active ? 'step' : undefined}
              className="vf-step"
              style={{
                textAlign: 'left',
                borderRadius: 14,
                padding: '18px 20px',
                background: i === active ? c.white : 'transparent',
                border: `1px solid ${i === active ? c.orange : c.line}`,
                opacity: i === active ? 1 : 0.55,
                transition: 'background 0.4s, border-color 0.4s, opacity 0.4s',
                cursor: 'pointer',
                font: 'inherit',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: i === active ? c.orange : c.white,
                    border: `2px solid ${c.orange}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: `600 15px ${font.display}`,
                    color: i === active ? c.white : c.orangeDark,
                    boxSizing: 'border-box',
                    transition: 'background 0.4s, color 0.4s',
                    flex: 'none',
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ font: `600 18px ${font.display}`, letterSpacing: '-0.01em', margin: 0 }}>{s.title}</h3>
              </div>
              <p style={{ font: `400 ${type.small}/1.5 ${font.body}`, color: c.muted, margin: 0 }}>{s.body}</p>

              {/* Narrow layout only — the step's own screenshot, full card width. */}
              <span className="vf-step-shot">
                <Image src={s.shot} alt={s.alt} width={2794} height={1584} sizes="(max-width: 900px) 92vw, 1px" loading="lazy" />
              </span>
            </button>
          ))}
        </div>

        {/* The wrapper earns its keep twice: as a direct flex item the framed
            stage would have auto side margins, which stops it stretching — its
            width collapses to its (absolutely positioned) content, and
            aspect-ratio then resolves the height to zero. And it is the box
            that claims the height left over on the pinned screen, which the
            frame inside it then reads off as the one dimension it is sized
            from. */}
        <div className="vf-how-stage-wrap">
          <div
            style={{
              position: 'relative',
              // Height first, width from the ratio: the shot is as large as
              // the pinned screen has room for and never a pixel taller, so
              // seeing all of it never costs a scroll.
              height: '100%',
              width: 'auto',
              maxWidth: '100%',
              aspectRatio: '2794 / 1584',
              borderRadius: 16,
              overflow: 'hidden',
              border: `1px solid ${c.line}`,
              boxShadow: '0 24px 60px #04295212',
              background: c.white,
            }}
          >
            {steps.map((s, i) => (
              <div
                key={s.n}
                aria-hidden={i !== active}
                style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0, transition: 'opacity 0.5s' }}
              >
                <Image
                  src={s.shot}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 900px) 1px, (max-width: 1280px) 100vw, 1280px"
                  loading="lazy"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
