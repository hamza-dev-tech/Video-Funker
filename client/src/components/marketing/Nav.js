'use client';

import { useEffect, useRef, useState } from 'react';

import Logo from '@/components/brand/Logo';
import { appLinks, c, font, nav, EASE } from '@/config/site';

/**
 * The bar starts as a floating pill and, past the hero, becomes a full-bleed
 * sheet of liquid glass.
 *
 * That morph used to be a CSS transition across `top`, `left`, `right`,
 * `width`, `padding` and `border-radius` — six properties, five of which
 * trigger layout — on a fixed element carrying a full-viewport
 * `backdrop-filter`. Every frame of it cost a layout pass plus a re-blur of
 * everything behind the bar, and it fired on every crossing of the threshold.
 *
 * So the geometry no longer moves at all. The row is always full-bleed with a
 * constant max-width and constant padding, and the two looks are two stacked
 * backdrop layers that cross-fade. Opacity is the only thing that animates,
 * which the compositor handles without touching layout or paint.
 */

/* The two looks live in globals.css as `.vf-nav-pill` / `.vf-nav-sheet` so the
   pill can tighten its inset on small screens. Only opacity is set from here. */

export default function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.75);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* The menu is a modal surface on top of the page: Escape closes it, the page
     behind it does not scroll, and focus comes back to the button that opened
     it rather than being dropped at the top of the document. */
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        if (toggleRef.current) toggleRef.current.focus();
      }
    };
    const onPointer = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const first = panelRef.current && panelRef.current.querySelector('a');
    if (first) first.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav
      className="vf-nav"
      aria-label="Primary"
      style={{
        animation: `dropIn 0.8s 0.15s ${EASE} both`,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      {/* Two backdrops, cross-faded. Neither one is ever in the layout. */}
      <span aria-hidden="true" className="vf-nav-pill" style={{ opacity: stuck ? 0 : 1 }} />
      <span aria-hidden="true" className="vf-nav-sheet" style={{ opacity: stuck ? 1 : 0 }} />

      <div
        className="vf-nav-row"
        style={{
          position: 'relative',
          maxWidth: 1160,
          margin: '0 auto',
          padding: '26px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <a href="#top" className="vf-logo" style={{ display: 'flex', alignItems: 'center', justifySelf: 'start' }}>
          <Logo height={34} priority />
        </a>

        <div
          className="vf-nav-links"
          style={{ display: 'flex', gap: 6, font: `500 15px ${font.body}`, color: '#33475e' }}
        >
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="vf-navlink" style={{ padding: '9px 16px', borderRadius: 100 }}>
              {n.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifySelf: 'end' }}>
          <a
            href={appLinks.login}
            className="vf-navlink vf-press vf-nav-login"
            style={{
              font: `500 15px ${font.body}`,
              color: '#33475e',
              padding: '9px 14px',
              borderRadius: 100,
              whiteSpace: 'nowrap',
            }}
          >
            Log in
          </a>
          <a
            href={appLinks.signup}
            className="vf-btn-sm"
            style={{
              background: c.orange,
              color: c.orangeInk,
              font: `700 15px ${font.body}`,
              padding: '11px 22px',
              borderRadius: 100,
              whiteSpace: 'nowrap',
            }}
          >
            Start free
          </a>

          {/* Below 1080px the links and "Log in" are hidden. Until now nothing
              replaced them, so a phone visitor had no navigation at all and no
              way to reach the login. */}
          <button
            ref={toggleRef}
            type="button"
            className="vf-nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="vf-mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className={`vf-burger${open ? ' is-open' : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div
        id="vf-mobile-menu"
        ref={panelRef}
        className={`vf-mobile-menu${open ? ' is-open' : ''}`}
        hidden={!open}
      >
        <ul>
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href} onClick={close}>
                {n.label}
              </a>
            </li>
          ))}
          <li className="vf-mobile-menu-login">
            <a href={appLinks.login} onClick={close}>
              Log in
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
