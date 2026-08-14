'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { howHeading, steps } from '@/config/content';
import { c, font, space, type } from '@/config/site';

/**
 * A tall section with a sticky stage: scrolling through it walks the four
 * steps, crossfading a real product screenshot for each one. The cards are
 * also clickable, which scrolls to the matching slice.
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

  useEffect(() => {
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
  }, []);

  const goTo = (i) => {
    const el = wrap.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) return; // compact layout — the card is already the content
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + total * (i / steps.length + 0.02), behavior: 'smooth' });
  };

  return (
    <section id="how" ref={wrap} className="vf-how">
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

        {/* The plain wrapper matters: as a direct flex item the framed stage
            would have auto side margins, which stops it stretching — its width
            collapses to its (absolutely positioned) content, and aspect-ratio
            then resolves the height to zero. */}
        <div className="vf-how-stage-wrap">
          <div
            style={{
              position: 'relative',
              aspectRatio: '2794 / 1584',
              maxHeight: '58vh',
              margin: '0 auto',
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
