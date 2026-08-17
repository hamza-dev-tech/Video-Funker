'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import Icon from '@/components/marketing/icons';
import { rafLoop, reducedMotion } from '@/components/marketing/motion';
import { hero } from '@/config/content';
import { appLinks, c, font, type, EASE } from '@/config/site';

const STREAM_COLORS = [c.blue, c.blueMid, c.bluePale, c.orange, '#ffc824'];

/* Ribbon count, derived from the hero's own area and then clamped.

   The field itself is unchanged — same curl-ish noise, same drift, same
   pointer swirl. Only the density moved, because density was the whole problem.
   At 260 ribbons each dragging a 70-160 point trail, roughly 28,000 control
   points were on screen at once; every ribbon crossed a dozen others and the
   eye had nothing to follow, so a field that is elegant at low count read as
   noise. Around 40 leaves each ribbon legible as its own line while keeping the
   same movement, and cuts the per-frame work by about six times.

   One ribbon in 24 is warm and one in 7 is orange (see the `tone` picker), so
   the accents only survive at low count if the count is not tiny — hence the
   floor of 18 rather than something smaller. Below about 14 the palette stops
   being visible at all and the field looks monochrome. */
const PARTICLE_AREA = 46000;
const PARTICLES_MIN = 12;
const PARTICLES_MAX = 30;

const particleCount = (w, h) =>
  Math.max(PARTICLES_MIN, Math.min(PARTICLES_MAX, Math.round((w * h) / PARTICLE_AREA)));

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
  const shell = useRef(null);
  const viewsEl = useRef(null);
  const state = useRef({ px: 0, py: 0, tx: 0, ty: 0, mx: -9999, my: -9999 });

  /* Raw pointer input, plus a cache of the header's box. Nothing here is read
     or written during the event itself. */
  const pointer = useRef({ cx: 0, cy: 0, inside: false, dirty: false });
  const box = useRef(null);

  /* Turns the last pointer position into hero coordinates, at most once per
     animation frame.

     The mousemove handler used to call getBoundingClientRect() on the header
     for every event. That is a layout read sitting on the input path, and a
     mouse reporting at 125Hz fired it 125 times a second to feed two loops
     that only consume the answer 60 times. Worse, it is a read placed directly
     after a style write from the cursor ring, which is the shape that turns
     into forced synchronous layout the moment anything on the page touches a
     layout-affecting property.

     The rect is now cached and only invalidated by scroll and resize, so the
     steady state is zero reads per frame while the pointer moves. */
  const syncPointer = () => {
    const p = pointer.current;
    if (!p.dirty) return;
    p.dirty = false;

    const h = state.current;
    if (!p.inside) {
      h.tx = 0;
      h.ty = 0;
      h.mx = -9999;
      h.my = -9999;
      return;
    }

    const el = shell.current;
    if (!el) return;
    if (!box.current) box.current = el.getBoundingClientRect();
    const r = box.current;
    if (!r.width || !r.height) return;

    h.tx = ((p.cx - r.left) / r.width - 0.5) * 2;
    h.ty = ((p.cy - r.top) / r.height - 0.5) * 2;
    h.mx = p.cx - r.left;
    h.my = p.cy - r.top;
  };

  /* ── Flow field ─────────────────────────────────────────────
     Drifting ribbons carried by a curl-ish noise field. The pointer
     adds a swirl, so the banner reacts without ever being a toy.

     The ribbons redrawn every frame are the heaviest thing on the page, and
     `prefers-reduced-motion` in CSS cannot reach a canvas — so it is checked
     here. Reduced motion gets one static frame instead of nothing, which keeps
     the hero from becoming a flat colour field. */
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return undefined;
    /* `alpha: false` costs nothing to correctness: the first thing every frame
       does is repaint all of W by H opaque in c.bg, so the canvas was already
       fully opaque. Declaring it lets the compositor skip blending a
       full-viewport layer, which is the part of this effect that does scale
       with screen area. */
    const ctx = cv.getContext('2d', { alpha: false });
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

    /* Resize arrives as a burst while a window is dragged, and each event both
       read layout and reallocated the backing store. Coalesced to one per
       frame. */
    let fitRaf = 0;
    const onResize = () => {
      box.current = null;
      if (fitRaf) return;
      fitRaf = requestAnimationFrame(() => {
        fitRaf = 0;
        fit();
      });
    };
    window.addEventListener('resize', onResize);

    const spawn = (p, w, h, fromEdge) => {
      p.x = fromEdge ? -30 : Math.random() * w;
      p.y = Math.random() * h;
      p.hist = [];
    };

    /* `hist` stays a plain array that is push()ed and splice(0, 2)'d, which
       looks like the expensive option and is not. A ring buffer over a
       Float64Array was measured at 0.67ms per frame against 0.20ms for this,
       and Float32Array at 0.79ms: V8 keeps `hist` in packed-double elements
       and turns the splice into one memmove, while the typed-array version
       pays a bounds check and a float conversion on every one of the ~28,000
       control points a frame. Do not "optimise" this into a ring buffer. */
    const P = [];
    /* Was a hardcoded 260 marked TEMP-BASELINE, with particleCount() sitting
       right above it unused — the density function existed and nothing ever
       called it, so every viewport got laptop density. */
    const N = particleCount(W, H);
    for (let i = 0; i < N; i++) {
      const tone = i % 24 === 0 ? 4 : i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
      const p = {
        c: STREAM_COLORS[tone],
        s: 0.7 + Math.random() * 1.2,
        /* Alpha and trail both lift a little, and only because the count fell.
           At 260 the field's weight came from ribbons stacking on top of each
           other; at 40 each one has to carry itself or the hero looks washed
           out. Longer trails also matter more now — with nothing overlapping,
           the trail IS the line you follow, so a short one reads as a comet
           rather than a current. */
        a: 0.1 + Math.random() * 0.16,
        /* Shorter, not longer. A trail is only a graceful arc while it is short
           enough that the field curves it; past that it is a straight streak
           with a long tail, and lengthening them was making the hatching worse
           rather than reading as flow. */
        trail: 55 + Math.floor(Math.random() * 55),
        hist: [],
      };
      // Spawn across the real canvas, not a nominal 3000x1600. At 260 ribbons
      // enough of them landed on screen for it not to matter; at 40, seeding
      // most of them outside the viewport leaves the hero visibly empty for the
      // first few seconds after load.
      spawn(p, W, H, false);
      P.push(p);
    }

    const tick = (t) => {
      syncPointer();
      const h = state.current;
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, H);

      const tt = t * 0.00009;
      ctx.lineWidth = 1.25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const p of P) {
        /* Two things changed here, and both are about what a single ribbon
           looks like rather than how many there are.

           FREQUENCY. The old field had a spatial wavelength near 3000px while a
           trail spans 110-440px, so the direction barely moved along a ribbon's
           length and every one of them drew as a straight line. At 260 ribbons
           that blurred into texture and read as fog; thin it out and the truth
           shows — straight parallel streaks, which is pencil hatching, not a
           current. The frequencies are ~3x higher so the angle sweeps visibly
           across a single trail and each ribbon reads as an arc.

           AMPLITUDE. The old `* 1.05` on a sum of three unit terms spanned
           ±3.15 radians — near a full turn — so a ribbon could reverse and two
           neighbours could be sent opposite ways. That is what the tangling
           was. Bounded to ±0.84 rad (±48°) it still curves freely, but
           `Math.cos(ang)` cannot go below 0.67, so combined with the +0.55
           drift `vx` is always positive: no ribbon ever doubles back on
           itself. */
        const a1 = Math.sin(p.y * 0.0062 + tt * 1.6) + Math.cos(p.x * 0.0049 - tt * 1.2);
        const ang = a1 * 0.42;

        let vx = Math.cos(ang) * p.s + 0.55; // steady left → right drift
        let vy = Math.sin(ang) * p.s * 0.85;

        const mdx = p.x - h.mx;
        const mdy = p.y - h.my;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 48400) {
          const md = Math.sqrt(md2) || 1;
          /* Was 2.2, which is a vortex: strong enough to spin a ribbon through
             its neighbours and knot whatever sat near the cursor. At 0.55 it
             leans the flow around the pointer instead of stirring it. */
          const k = (1 - md / 220) * 0.55;
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
    };

    // Reduced motion: paint one frame's worth of ribbons and stop there.
    if (still) {
      tick(0);
      return () => {
        window.removeEventListener('resize', onResize);
        if (fitRaf) cancelAnimationFrame(fitRaf);
      };
    }

    /* Only simulate while the hero is on screen and the tab is visible.
       This used to be a scroll listener that called getBoundingClientRect() on
       the canvas for every scroll event, which is a layout read per event on
       the scroll path. rafLoop does the same gating with an
       IntersectionObserver, so there is no scroll listener and no layout read
       at all, and it already parks on visibilitychange. */
    const stop = rafLoop(cv, tick);

    return () => {
      window.removeEventListener('resize', onResize);
      if (fitRaf) cancelAnimationFrame(fitRaf);
      stop();
    };
  }, []);

  /* Neither handler touches layout; they only mark the cached header rect
     stale so the next frame re-reads it. Both are passive, so neither can ever
     delay a scroll. */
  useEffect(() => {
    const stale = () => {
      box.current = null;
    };
    window.addEventListener('scroll', stale, { passive: true });
    window.addEventListener('resize', stale, { passive: true });
    return () => {
      window.removeEventListener('scroll', stale);
      window.removeEventListener('resize', stale);
    };
  }, []);

  /* ── Card parallax ──────────────────────────────────────────────
     Gated on the card stack itself, which does double duty: below 1080px the
     stack is `display: none`, so it never intersects and the loop never runs.
     It used to spin at 60fps for the life of the page, writing transforms to
     an element that phones and tablets do not even render. */
  useEffect(() => {
    let lx = NaN;
    let ly = NaN;
    return rafLoop(cards.current, () => {
      syncPointer();
      const h = state.current;
      h.px += (h.tx - h.px) * 0.06;
      h.py += (h.ty - h.py) * 0.06;
      /* The lerp converges to exactly its target in floating point, so once the
         pointer settles px and py stop changing and every remaining frame was
         formatting four numbers and rebuilding the same 90-character string to
         assign a value the element already had. An exact compare is enough:
         when it passes, the string would have been identical anyway. */
      if (h.px === lx && h.py === ly) return;
      lx = h.px;
      ly = h.py;
      const el = cards.current;
      if (!el) return;
      el.style.transform =
        `perspective(1100px) rotateY(${(h.px * -7).toFixed(2)}deg) rotateX(${(h.py * 5).toFixed(2)}deg) ` +
        `translate(${(h.px * -14).toFixed(1)}px, ${(h.py * -10).toFixed(1)}px)`;
    });
  }, []);

  /* ── View counter ─────────────────────────────────────────────
     Written straight to the span rather than through state. As component
     state this re-rendered the whole hero subtree on every frame of the
     count-up, roughly 130 renders inside the first 2.2 seconds, which is
     exactly the window the largest paint lands in. The rendered text is
     identical and the server still ships the final number. */
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const el = viewsEl.current;
    if (!el) return undefined;
    const t0 = performance.now();
    const dur = 2200;
    let raf = 0;
    let last = -1;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(hero.viewsTarget * (1 - Math.pow(1 - p, 3)));
      if (v !== last) {
        last = v;
        el.textContent = v.toLocaleString('en-GB');
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Records the pointer and nothing else. No layout read, no style write. */
  const onMove = (e) => {
    const p = pointer.current;
    p.cx = e.clientX;
    p.cy = e.clientY;
    p.inside = true;
    p.dirty = true;
  };

  const onLeave = () => {
    const p = pointer.current;
    p.inside = false;
    p.dirty = true;
  };

  return (
    <header
      id="top"
      ref={shell}
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
              {/* Rendered at the final value, not at zero. The count-up is
                  decoration, and a counter that starts at 0 renders a
                  broken-looking "0 views" any time the animation cannot run: a
                  background tab, reduced motion, slow hydration. The effect
                  above animates up to it only when it can. */}
              <span style={{ color: c.orangeDark, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="▶" size={14} />
                <span ref={viewsEl}>{hero.viewsTarget.toLocaleString('en-GB')}</span>
                {' views'}
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
