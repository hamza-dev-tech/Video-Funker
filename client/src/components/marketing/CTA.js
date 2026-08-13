'use client';

import { useEffect, useRef } from 'react';

import Reveal from '@/components/marketing/Reveal';
import { rafLoop } from '@/components/marketing/motion';
import { cta } from '@/config/content';
import { appLinks, c, font, space, type } from '@/config/site';

/**
 * Closing panel. Two light blooms track the pointer on a spring, and a third
 * drifts on its own clock so the wash never looks locked to the cursor.
 *
 * The loop is gated on the section (see motion.js). It used to run for the
 * life of the page, repainting three full-bleed radial gradients every frame
 * while the visitor was still up in the hero.
 */
export default function CTA() {
  const section = useRef(null);
  const glow = useRef(null);

  useEffect(() => {
    const g = { x: 50, y: 40, tx: 50, ty: 40 };

    const onMove = (e) => {
      const el = glow.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Ignore the pointer until it is roughly in this section's neighbourhood.
      if (e.clientY < r.top - 300 || e.clientY > r.bottom + 300) return;
      g.tx = ((e.clientX - r.left) / r.width) * 100;
      g.ty = ((e.clientY - r.top) / r.height) * 100;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const stop = rafLoop(section.current, (t) => {
      const el = glow.current;
      if (!el) return;
      g.x += (g.tx - g.x) * 0.07;
      g.y += (g.ty - g.y) * 0.07;
      const dx = 100 - g.x + Math.sin(t / 1700) * 14;
      const dy = 100 - g.y + Math.cos(t / 2100) * 12;
      el.style.setProperty('--mx', `${g.x.toFixed(2)}%`);
      el.style.setProperty('--my', `${g.y.toFixed(2)}%`);
      el.style.setProperty('--mx2', `${dx.toFixed(2)}%`);
      el.style.setProperty('--my2', `${dy.toFixed(2)}%`);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      stop();
    };
  }, []);

  return (
    <section
      id="cta"
      ref={section}
      className="vf-pad"
      style={{
        padding: `${space.sectionLg}px 48px`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        ref={glow}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(700px 400px at 50% 100%, #ffe7c7 0%, transparent 70%), ' +
            'radial-gradient(650px 480px at var(--mx, 50%) var(--my, 40%), #4189d466 0%, #cfe4fa66 40%, transparent 72%), ' +
            'radial-gradient(380px 300px at var(--mx2, 40%) var(--my2, 60%), #ff901b40 0%, transparent 70%)',
        }}
      />

      <div style={{ position: 'relative' }}>
        <Reveal
          as="h2"
          style={{
            font: `600 ${type.display}/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            margin: '0 auto 26px',
            maxWidth: 800,
          }}
        >
          {cta.title}
        </Reveal>
        <Reveal
          as="p"
          delay={110}
          style={{ font: `400 20px/1.6 ${font.body}`, color: c.muted, maxWidth: 520, margin: '0 auto 40px' }}
        >
          {cta.sub}
        </Reveal>
        <Reveal delay={210}>
          <a
            href={appLinks.signup}
            className="vf-btn-cta"
            style={{
              display: 'inline-block',
              background: c.orange,
              color: c.orangeInk,
              font: `700 20px ${font.body}`,
              padding: '22px 48px',
              borderRadius: '100px',
              animation: 'ringPulse 2.8s infinite',
            }}
          >
            {cta.button}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
