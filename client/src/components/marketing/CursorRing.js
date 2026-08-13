'use client';

import { useEffect, useRef } from 'react';

import { rafLoop } from '@/components/marketing/motion';
import { c } from '@/config/site';

const REST = 30;
const HOT = 44;

/**
 * A soft ring that trails the pointer and swells over links.
 *
 * It stays hidden until the first real mousemove, so touch users — who never
 * fire one — are never shown a cursor they don't have.
 *
 * The ring is a fixed 30px box that is *scaled*, never resized. The earlier
 * version wrote `width`, `height` and `margin` on every single frame and also
 * carried `transition: width, height` — so each frame dirtied layout and
 * re-entered a transition on a property that cannot be composited. That is the
 * whole reason a cursor effect ends up feeling a half-beat behind the mouse.
 * Everything here is transform and opacity.
 */
export default function CursorRing() {
  const ring = useRef(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const cur = { x: -100, y: -100, tx: -100, ty: -100, s: 1, ts: 1, seen: false };

    const onMove = (e) => {
      cur.tx = e.clientX;
      cur.ty = e.clientY;
      cur.seen = true;
      const hot = !!(e.target.closest && e.target.closest('a, button'));
      cur.ts = hot ? HOT / REST : 1;
      el.style.borderColor = hot ? c.orange : c.blue;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // The ring follows the viewport, not a section, so it is gated on the
    // document element — it parks when the tab is hidden and nowhere else.
    const stop = rafLoop(document.documentElement, () => {
      if (!cur.seen) return;
      cur.x += (cur.tx - cur.x) * 0.22;
      cur.y += (cur.ty - cur.y) * 0.22;
      cur.s += (cur.ts - cur.s) * 0.18;
      el.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0) scale(${cur.s.toFixed(3)})`;
      el.style.opacity = '1';
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      stop();
    };
  }, []);

  return (
    <div
      ref={ring}
      className="vf-cursor-ring"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: REST,
        height: REST,
        margin: `${-REST / 2}px 0 0 ${-REST / 2}px`,
        border: `1.4px solid ${c.blue}`,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        willChange: 'transform',
        transition: 'opacity 0.3s, border-color 0.2s',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.orange, display: 'block' }} />
    </div>
  );
}
