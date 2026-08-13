'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { howHeading, steps } from '@/config/content';
import { c, font } from '@/config/site';

/**
 * A tall section with a sticky stage: scrolling through it walks the four
 * steps, crossfading a real product screenshot for each one. The cards are
 * also clickable, which scrolls to the matching slice.
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
      const prog = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
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
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + total * (i / steps.length + 0.02), behavior: 'smooth' });
  };

  return (
    <section id="how" ref={wrap} style={{ height: '320vh', position: 'relative' }}>
      <div
        className="vf-pad"
        style={{
          position: 'sticky',
          top: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px 48px 40px',
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
                font: `600 clamp(34px, 3.4vw, 52px)/1.05 ${font.display}`,
                letterSpacing: '-0.02em',
                margin: '0 0 12px',
              }}
            >
              {howHeading.title}
            </h2>
            <p style={{ font: `400 19px/1.5 ${font.body}`, color: c.muted, margin: 0 }}>{howHeading.sub}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }} aria-hidden="true">
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
                    color: i === active ? c.white : c.orangeDeep,
                    boxSizing: 'border-box',
                    transition: 'background 0.4s, color 0.4s',
                    flex: 'none',
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ font: `600 18px ${font.display}`, letterSpacing: '-0.01em', margin: 0 }}>{s.title}</h3>
              </div>
              <p style={{ font: `400 14px/1.5 ${font.body}`, color: c.muted, margin: 0 }}>{s.body}</p>
            </button>
          ))}
        </div>

        {/* The plain wrapper matters: as a direct flex item the framed stage
            would have auto side margins, which stops it stretching — its width
            collapses to its (absolutely positioned) content, and aspect-ratio
            then resolves the height to zero. */}
        <div>
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
                style={{ position: 'absolute', inset: 0, opacity: i === active ? 1 : 0, transition: 'opacity 0.5s' }}
              >
                <Image
                  src={s.shot}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority={i === 0}
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
