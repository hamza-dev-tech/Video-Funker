import { useEffect, useRef } from "react";
import { rafLoop, reducedMotion } from "@/components/marketing/motion";

/**
 * The marketing hero's flow field, retuned for a dark panel.
 *
 * This is the one visual thing Video Funker actually owns — drifting ribbons
 * carried by a curl-ish noise field, leaning away from the pointer — and it is
 * why the sign-in screen now looks like the same company as the homepage
 * rather than a login page bought from a template.
 *
 * The simulation is lifted from components/marketing/Hero.js unchanged: same
 * noise frequencies, same bounded turn, same steady left-to-right drift, same
 * midpoint-smoothed trails. Three things are different, and all three are
 * because this canvas sits on navy instead of on the site's near-white:
 *
 *   1. The palette is the light end of the brand ramp. The hero's mid blues
 *      vanish on a dark ground.
 *   2. Alpha is roughly tripled. A 10%-opacity line over #f7f9fc is a visible
 *      grey; over #062544 it is nothing at all.
 *   3. Density is HIGHER, not lower — see the note on PARTICLE_AREA. The
 *      instinct to calm the field down behind a headline was wrong, and
 *      sampling the canvas is what caught it.
 *
 * `rafLoop` is imported rather than copied. It is plain JavaScript with no
 * styling, it already gates on IntersectionObserver and tab visibility, and it
 * already refuses to start under `prefers-reduced-motion` — reimplementing all
 * of that in the product tree to avoid one import across folders would be the
 * worse trade.
 */

/** The light end of the brand ramp: two blues, a wash, and the two accents. */
const STREAM_COLORS = ["#4189d4", "#8bc6ff", "#cfe4fa", "#ff901b", "#ffd23f"];

/** The panel's ground. Every frame repaints this before drawing. */
const GROUND = "#062544";

/**
 * Ribbon count from the panel's own area, then clamped.
 *
 * Denser than the hero, not sparser, and that is measured rather than guessed.
 * The first pass reused the homepage's heuristic (one ribbon per 52,000px²,
 * floor of 10) on the assumption that a half-viewport panel behind a headline
 * needed a calmer field. Sampling the rendered canvas said otherwise: a
 * 640×720 panel got the floor of 10 ribbons covering 0.57% of its pixels,
 * which does not read as a current — it reads as a few scratches on a flat
 * navy rectangle, which is the same "empty gradient" problem this panel was
 * built to replace.
 *
 * At one per 22,000px² the same panel gets 21 ribbons and 1.3% coverage, and
 * the field reads as flow. The vignette layered over this canvas is what keeps
 * the headline legible at that density, so legibility is not what limits the
 * count here.
 */
const PARTICLE_AREA = 22000;
const PARTICLES_MIN = 18;
const PARTICLES_MAX = 36;

const particleCount = (w: number, h: number) =>
  Math.max(PARTICLES_MIN, Math.min(PARTICLES_MAX, Math.round((w * h) / PARTICLE_AREA)));

interface Ribbon {
  c: string;
  s: number;
  a: number;
  trail: number;
  x: number;
  y: number;
  hist: number[];
}

const RibbonField = () => {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  /** Pointer position in canvas space. Parked off-field until the mouse moves. */
  const pointer = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return undefined;

    // alpha:false lets the compositor skip blending a full-panel layer. Safe
    // here because the first thing every frame does is repaint W×H opaque.
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return undefined;

    const still = reducedMotion();

    let W = 0;
    let H = 0;

    const fit = () => {
      // Draw at device resolution so 1.25px ribbons stay crisp on retina, but
      // keep every coordinate below in CSS pixels.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth;
      H = cv.offsetHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, W, H);
    };
    fit();

    // Resize arrives as a burst while a window is dragged, and each event both
    // reads layout and reallocates the backing store. Coalesced to one a frame.
    let fitRaf = 0;
    const onResize = () => {
      if (fitRaf) return;
      fitRaf = requestAnimationFrame(() => {
        fitRaf = 0;
        fit();
      });
    };
    window.addEventListener("resize", onResize);

    const onPointerMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.current.x = e.clientX - r.left;
      pointer.current.y = e.clientY - r.top;
    };
    const onPointerLeave = () => {
      pointer.current.x = -9999;
      pointer.current.y = -9999;
    };
    // Listened for on the canvas, not the window: the pointer only bends the
    // field while it is actually over the panel, and a cursor resting in the
    // form on the right should not be dragging the artwork behind it.
    cv.addEventListener("pointermove", onPointerMove);
    cv.addEventListener("pointerleave", onPointerLeave);

    const spawn = (p: Ribbon, w: number, h: number, fromEdge: boolean) => {
      p.x = fromEdge ? -30 : Math.random() * w;
      p.y = Math.random() * h;
      p.hist = [];
    };

    const P: Ribbon[] = [];
    const N = particleCount(W, H);
    for (let i = 0; i < N; i++) {
      // One in 24 is yellow and one in 7 orange, so the two warm accents stay
      // rare enough to read as accents.
      const tone = i % 24 === 0 ? 4 : i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
      const p: Ribbon = {
        c: STREAM_COLORS[tone],
        s: 0.7 + Math.random() * 1.2,
        // Roughly triple the hero's alpha. Its values were tuned against a
        // near-white ground, where a 10% line is a visible grey; over #062544
        // the same line is nothing. Sampled rather than eyeballed — see the
        // coverage note on PARTICLE_AREA.
        a: 0.3 + Math.random() * 0.32,
        trail: 55 + Math.floor(Math.random() * 55),
        x: 0,
        y: 0,
        hist: [],
      };
      spawn(p, W, H, false);
      P.push(p);
    }

    const tick = (t: number) => {
      const h = pointer.current;
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, W, H);

      const tt = t * 0.00009;
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const p of P) {
        // Bounded to ±0.84 rad, so cos(ang) never drops below 0.67 and the
        // +0.55 drift keeps every ribbon moving left to right. Unbounded, two
        // neighbours can be sent opposite ways and the field tangles.
        const a1 = Math.sin(p.y * 0.0062 + tt * 1.6) + Math.cos(p.x * 0.0049 - tt * 1.2);
        const ang = a1 * 0.42;

        let vx = Math.cos(ang) * p.s + 0.55;
        let vy = Math.sin(ang) * p.s * 0.85;

        const mdx = p.x - h.x;
        const mdy = p.y - h.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 48400) {
          const md = Math.sqrt(md2) || 1;
          // 0.55 leans the flow around the pointer. Higher values make a
          // vortex, which knots every ribbon near the cursor.
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

    // Reduced motion gets one painted frame rather than nothing, so the panel
    // is still artwork instead of a flat rectangle. CSS media queries cannot
    // reach a canvas draw call, which is why this is checked in JS.
    if (still) {
      // Warm the trails so the single frame shows arcs, not dots.
      for (let i = 0; i < 90; i++) tick(i * 16);
      return () => {
        window.removeEventListener("resize", onResize);
        cv.removeEventListener("pointermove", onPointerMove);
        cv.removeEventListener("pointerleave", onPointerLeave);
        if (fitRaf) cancelAnimationFrame(fitRaf);
      };
    }

    const stop = rafLoop(cv, tick);

    return () => {
      window.removeEventListener("resize", onResize);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerleave", onPointerLeave);
      if (fitRaf) cancelAnimationFrame(fitRaf);
      stop();
    };
  }, []);

  return <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
};

export default RibbonField;
