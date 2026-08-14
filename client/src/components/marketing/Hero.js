'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import Icon from '@/components/marketing/icons';
import { rafLoop, reducedMotion } from '@/components/marketing/motion';
import { hero } from '@/config/content';
import { appLinks, c, font, type, EASE } from '@/config/site';

const STREAM_COLORS = [c.blue, c.blueMid, c.bluePale, c.orange, '#ffc824'];
const PARTICLES = 260;

/**
 * Splits a headline into individually interactive words.
 *
 * Each word lifts and takes an accent underline on hover — the same
 * highlighter motif the hero already uses under "Video wins." — so the
 * headline reads as something you can touch rather than a static block.
 * The lift is a transform and the rule also fires on :active, so it works
 * on a tap where there is no hover at all.
 */
function Words({ text, accent = false }) {
  const words = text.split(' ');
  return words.map((word, i) => (
    <span key={`${word}-${i}`}>
      <span className={accent ? 'vf-word vf-word-accent' : 'vf-word'}>
        {word}
        {!accent && <span className="vf-word-bar" aria-hidden="true" />}
      </span>
      {i < words.length - 1 ? ' ' : null}
    </span>
  ));
}

export default function Hero() {
  const canvas = useRef(null);
  const cards = useRef(null);
  const state = useRef({ px: 0, py: 0, tx: 0, ty: 0, mx: -9999, my: -9999 });
  /* Seeded at the final value, not at zero. The count-up is decoration, and a
     counter that starts at 0 renders a broken-looking "0 views" any time the
     animation cannot run — a background tab, reduced motion, slow hydration.
     The effect below animates up to it only when it can; otherwise the real
     number was always there. */
  const [views, setViews] = useState(hero.viewsTarget);

  /* ── Flow field ─────────────────────────────────────────────
     Drifting ribbons carried by a curl-ish noise field. The pointer
     adds a swirl, so the banner reacts without ever being a toy.

     260 ribbons redrawn every frame is the heaviest thing on the page, and
     `prefers-reduced-motion` in CSS cannot reach a canvas — so it is checked
     here. Reduced motion gets one static frame instead of nothing, which keeps
     the hero from becoming a flat colour field. */
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const still = reducedMotion();

    let W = 0;
    let H = 0;
    const fit = () => {
      // Render at device resolution so the 1.25px ribbons stay crisp on
      // retina, but keep every coordinate below in CSS pixels.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth;
      H = cv.offsetHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, H);
    };
    fit();
    window.addEventListener('resize', fit);

    const spawn = (p, w, h, fromEdge) => {
      p.x = fromEdge ? -30 : Math.random() * w;
      p.y = Math.random() * h;
      p.hist = [];
    };

    const P = [];
    for (let i = 0; i < PARTICLES; i++) {
      const tone = i % 24 === 0 ? 4 : i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
      const p = {
        c: STREAM_COLORS[tone],
        s: 0.7 + Math.random() * 1.2,
        a: 0.12 + Math.random() * 0.24,
        trail: 70 + Math.floor(Math.random() * 90),
        hist: [],
      };
      spawn(p, 3000, 1600, false);
      P.push(p);
    }

    let raf = 0;
    const tick = (t) => {
      const h = state.current;
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, H);

      const tt = t * 0.00009;
      ctx.lineWidth = 1.25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const p of P) {
        const a1 = Math.sin(p.y * 0.0021 + tt * 2.2) + Math.cos(p.x * 0.0016 - tt * 1.6);
        const a2 = Math.sin((p.x + p.y) * 0.0009 + tt * 2.8);
        const ang = (a1 + a2) * 1.05;

        let vx = Math.cos(ang) * p.s + 0.55; // steady left → right drift
        let vy = Math.sin(ang) * p.s * 0.85;

        const mdx = p.x - h.mx;
        const mdy = p.y - h.my;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 48400) {
          const md = Math.sqrt(md2) || 1;
          const k = (1 - md / 220) * 2.2;
          vx += (-mdy / md) * k;
          vy += (mdx / md) * k;
        }

        p.x += vx;
        p.y += vy;
        p.hist.push(p.x, p.y);
        if (p.hist.length > p.trail * 2) p.hist.splice(0, 2);

        if (p.hist.length >= 6) {
          ctx.strokeStyle = p.c;
          ctx.globalAlpha = p.a;
          ctx.beginPath();
          ctx.moveTo(p.hist[0], p.hist[1]);
          for (let k = 2; k < p.hist.length - 2; k += 2) {
            // Midpoint smoothing keeps the ribbon fluid rather than jointed.
            ctx.quadraticCurveTo(
              p.hist[k],
              p.hist[k + 1],
              (p.hist[k] + p.hist[k + 2]) / 2,
              (p.hist[k + 1] + p.hist[k + 3]) / 2
            );
          }
          ctx.stroke();
        }

        if (p.x > W + 40 || p.y < -40 || p.y > H + 40) spawn(p, W, H, true);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    // Reduced motion: paint one frame's worth of ribbons and stop there.
    if (still) {
      tick(0);
      cancelAnimationFrame(raf);
      raf = 0;
      return () => window.removeEventListener('resize', fit);
    }

    // Only simulate while the hero is actually on screen.
    const gate = () => {
      const r = cv.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight && !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(tick);
      else if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    window.addEventListener('scroll', gate, { passive: true });
    document.addEventListener('visibilitychange', gate);
    gate();

    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('scroll', gate);
      document.removeEventListener('visibilitychange', gate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ── Card parallax ──────────────────────────────────────────────
     Gated on the card stack itself, which does double duty: below 1080px the
     stack is `display: none`, so it never intersects and the loop never runs.
     It used to spin at 60fps for the life of the page, writing transforms to
     an element that phones and tablets do not even render. */
  useEffect(
    () =>
      rafLoop(cards.current, () => {
        const h = state.current;
        h.px += (h.tx - h.px) * 0.06;
        h.py += (h.ty - h.py) * 0.06;
        if (!cards.current) return;
        cards.current.style.transform =
          `perspective(1100px) rotateY(${(h.px * -7).toFixed(2)}deg) rotateX(${(h.py * 5).toFixed(2)}deg) ` +
          `translate(${(h.px * -14).toFixed(1)}px, ${(h.py * -10).toFixed(1)}px)`;
      }),
    []
  );

  /* ── View counter ───────────────────────────────────────────── */
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const t0 = performance.now();
    const dur = 2200;
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setViews(Math.round(hero.viewsTarget * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const h = state.current;
    h.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    h.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    h.mx = e.clientX - r.left;
    h.my = e.clientY - r.top;
  };

  const onLeave = () => {
    const h = state.current;
    h.tx = 0;
    h.ty = 0;
    h.mx = -9999;
    h.my = -9999;
  };

  return (
    <header
      id="top"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        background: c.bg,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 90,
      }}
    >
      <canvas ref={canvas} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div
        className="vf-hero-grid vf-pad"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
          gap: 40,
          alignItems: 'center',
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '40px 48px 0',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <h1
            style={{
              font: `600 ${type.hero}/1.02 ${font.display}`,
              letterSpacing: '-0.02em',
              margin: '0 0 30px',
            }}
          >
            {hero.lines.map((line, i) => (
              <span key={line} style={{ display: 'block', animation: `rise 0.9s ${0.1 + i * 0.15}s ${EASE} both` }}>
                <Words text={line} />
              </span>
            ))}
            <span style={{ display: 'block', animation: `rise 0.9s 0.4s ${EASE} both` }}>
              <span style={{ color: c.orangeDeep, display: 'inline-block' }}>
                <Words text={hero.accent} accent />
                <span
                  style={{
                    display: 'block',
                    height: 6,
                    background: c.orange,
                    borderRadius: 3,
                    transformOrigin: 'left',
                    animation: `drawX 0.8s 1.2s ${EASE} both`,
                  }}
                />
              </span>
            </span>
          </h1>

          <p
            style={{
              font: `400 20px/1.6 ${font.body}`,
              color: c.muted,
              maxWidth: 540,
              margin: '0 0 36px',
              animation: `rise 0.9s 0.55s ${EASE} both`,
            }}
          >
            {hero.sub}
          </p>

          <div
            className="vf-hero-actions"
            style={{ display: 'flex', gap: 14, alignItems: 'center', animation: `rise 0.9s 0.7s ${EASE} both` }}
          >
            <a
              href={appLinks.signup}
              className="vf-btn-primary"
              style={{
                background: c.orange,
                color: c.orangeInk,
                font: `700 18px ${font.body}`,
                padding: '18px 34px',
                borderRadius: '100px',
              }}
            >
              {hero.primary}
            </a>
            <a
              href="#how"
              className="vf-btn-ghost"
              style={{
                font: `600 18px ${font.body}`,
                color: c.ink,
                padding: '18px 28px',
                border: `1.5px solid ${c.lineStrong}`,
                borderRadius: '100px',
              }}
            >
              {hero.secondary}
            </a>
          </div>

          {/* Answers the objections that stop the click, without a third button. */}
          <ul
            className="vf-hero-proof"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 22px',
              listStyle: 'none',
              margin: '26px 0 0',
              padding: 0,
              font: `500 14px ${font.body}`,
              color: c.soft,
              animation: `rise 0.9s 0.85s ${EASE} both`,
            }}
          >
            {hero.proof.map((p) => (
              <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" style={{ flex: 'none' }}>
                  <circle cx="8" cy="8" r="8" fill="#ff901b26" />
                  <path
                    d="M4.6 8.2 L6.9 10.5 L11.4 5.9"
                    fill="none"
                    stroke={c.orangeDeep}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Floating proof stack */}
        <div
          ref={cards}
          className="vf-hero-cards"
          aria-hidden="true"
          style={{
            position: 'relative',
            height: 560,
            animation: `riseBig 1.1s 0.5s ${EASE} both`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 20,
              width: 330,
              '--r': '3deg',
              animation: 'floaty 7s ease-in-out infinite',
              background: '#ffffffee',
              border: `1px solid ${c.line}`,
              backdropFilter: 'blur(6px)',
              borderRadius: 16,
              padding: 18,
              transform: 'rotate(3deg)',
              boxShadow: '0 24px 60px #0c2b4a1f',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flex: 'none',
                  background: 'linear-gradient(150deg, #e7eef7, #d6e3f2)',
                }}
              >
                <Image
                  src={hero.post.avatar}
                  alt=""
                  width={76}
                  height={76}
                  sizes="38px"
                  priority
                  style={{ display: 'block', width: 38, height: 38, objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: `700 14px ${font.body}` }}>{hero.post.author}</div>
                <div style={{ font: `400 12px ${font.body}`, color: c.soft }}>{hero.post.meta}</div>
              </div>
            </div>

            <p style={{ font: `400 13px/1.5 ${font.body}`, color: c.ink, margin: '0 0 12px' }}>
              {hero.post.caption}
            </p>

            <div
              style={{
                position: 'relative',
                aspectRatio: hero.post.stillRatio,
                borderRadius: 10,
                overflow: 'hidden',
                background: '#dfe8f3',
              }}
            >
              <Image
                src={hero.post.still}
                alt={hero.post.stillAlt}
                fill
                sizes="330px"
                priority
                style={{ objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #0c2b4a00 40%, #0c2b4a4d 100%)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: c.orange,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 20px #0c2b4a4d, 0 0 0 7px #ffffff40',
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: `14px solid ${c.orangeInk}`,
                      borderTop: '9px solid transparent',
                      borderBottom: '9px solid transparent',
                      marginLeft: 4,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  background: '#0c2b4ab8',
                  color: '#fff',
                  font: `600 11px ${font.body}`,
                  padding: '3px 7px',
                  borderRadius: 5,
                  letterSpacing: '0.02em',
                }}
              >
                {hero.post.duration}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 14,
                marginTop: 12,
                paddingTop: 11,
                borderTop: `1px solid ${c.line}`,
                font: `600 13px ${font.body}`,
                color: c.muted,
              }}
            >
              {/* `orangeDeep` is a large-text colour; at 13px it measured
                  3.47:1. And the play mark is an icon, not a character. */}
              <span style={{ color: c.orangeDark, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="▶" size={14} />
                {views.toLocaleString()} views
              </span>
              <span>{hero.post.comments}</span>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 370,
              left: 0,
              width: 300,
              '--r': '-3deg',
              animation: 'floaty 7s 1.4s ease-in-out infinite',
              background: c.yellow,
              color: '#221a04',
              borderRadius: 16,
              padding: 20,
              transform: 'rotate(-3deg)',
              boxShadow: '0 24px 60px #0c2b4a26',
            }}
          >
            <div style={{ font: `600 18px/1.35 ${font.display}` }}>{hero.dm.quote}</div>
            <div style={{ font: `500 13px ${font.body}`, marginTop: 12, opacity: 0.7 }}>{hero.dm.meta}</div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 60,
              '--r': '2deg',
              animation: 'floaty 7s 2.6s ease-in-out infinite',
              background: '#ffffffe6',
              border: `1px solid ${c.line}`,
              borderRadius: 14,
              padding: '16px 20px',
              transform: 'rotate(2deg)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.orange, animation: 'blink 1.8s infinite' }} />
            <div style={{ font: `600 15px ${font.body}` }}>{hero.booked}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
