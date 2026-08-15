'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import Logo from '@/components/brand/Logo';
import { appLinks, c, font, nav, EASE } from '@/config/site';

/**
 * The bar starts as a floating pill and, past the hero, becomes a full-bleed
 * sheet of liquid glass.
 *
 * That morph used to be a CSS transition across `top`, `left`, `right`,
 * `width`, `padding` and `border-radius` — six properties, five of which
 * trigger layout — on a fixed element carrying a full-viewport
 * `backdrop-filter`. Every frame cost a layout pass plus a re-blur of
 * everything behind the bar. So the geometry no longer moves at all: the row is
 * always full-bleed, and the two looks are two stacked backdrop layers that
 * cross-fade. Opacity is the only thing that animates.
 *
 * ─── LAYOUT ──────────────────────────────────────────────────────────────────
 * The row is a three-column grid ONLY above 1080px, where all three children
 * exist. Below that the links are `display: none`, and a display-none child is
 * removed from the grid entirely rather than collapsing to a zero-width track.
 * The result was that the right-hand controls slid into column TWO: measured at
 * 320px the grid computed to `63.4px 161.2px 63.4px`, so the logo and the
 * buttons were touching at x=79 with 63px of dead space stranded to their
 * right. The bar looked broken on every phone. Below 1080 it is a flex row with
 * space-between, which cannot express that bug.
 */

export default function Nav({ base = '' }) {
  /* Only same-page anchors are rebased. `nav` mixes anchors with real paths
     (/blog), and prefixing a path yields `//blog`, which a browser reads as a
     protocol-relative URL pointing at a host called "blog". */
  const links = nav.map((n) => (n.href.startsWith('#') ? { ...n, href: `${base}${n.href}` } : n));

  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const pathname = usePathname();
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.75);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * Scroll spy.
   *
   * IntersectionObserver rather than a scroll handler: a scroll listener that
   * measures section offsets runs on every frame of every scroll on the longest
   * page of the site, and each measurement is a forced layout read. The
   * observer costs nothing when nothing crosses.
   *
   * The rootMargin is deliberately lopsided. `-88px` at the top discounts the
   * height of the fixed bar so a section counts as current only once it is
   * actually clear of it, and `-65%` at the bottom means a section becomes
   * current when it reaches the upper third of the viewport rather than the
   * instant one pixel of it appears. Without the bottom margin the highlight
   * runs a whole section ahead of what the reader is looking at.
   */
  useEffect(() => {
    const ids = nav.filter((n) => n.href.startsWith('#')).map((n) => n.href.slice(1));
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    // Not the homepage: there are no sections to spy on, and that is fine.
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -65% 0px', threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  /* The menu is a modal surface on top of the page: Escape closes it, the page
     behind it does not scroll, and focus returns to the button that opened it
     rather than being dropped at the top of the document. */
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

  /* A real path is current when the route matches; an anchor is current when
     its section is the one being read. Returning the string 'page' vs 'true'
     matters: aria-current="page" is for a link to the page you are on, and
     "true" is the correct value for a location within it. */
  const currentFor = (href) => {
    if (href.startsWith('#')) return href.slice(1) === activeId ? 'true' : undefined;
    if (href.includes('#')) return href.split('#')[1] === activeId ? 'true' : undefined;
    if (href === '/') return pathname === '/' ? 'page' : undefined;
    return pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined;
  };

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

      <div className="vf-nav-row">
        <a href={base || '#top'} className="vf-logo" style={{ justifySelf: 'start' }}>
          <Logo height={34} priority />
        </a>

        <div className="vf-nav-links" style={{ font: `500 15px ${font.body}`, color: '#33475e' }}>
          {links.map((n) => {
            const current = currentFor(n.href);
            return (
              <a
                key={n.href}
                href={n.href}
                className={`vf-navlink${current ? ' is-active' : ''}`}
                aria-current={current}
              >
                {n.label}
              </a>
            );
          })}
        </div>

        <div className="vf-nav-actions">
          <a
            href={appLinks.login}
            className="vf-navlink vf-press vf-nav-login"
            style={{ font: `500 15px ${font.body}`, color: '#33475e' }}
          >
            Log in
          </a>
          <a
            href={appLinks.signup}
            className="vf-btn-sm"
            style={{ background: c.orange, color: c.orangeInk, font: `700 15px ${font.body}` }}
          >
            Start free
          </a>

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

      <div id="vf-mobile-menu" ref={panelRef} className={`vf-mobile-menu${open ? ' is-open' : ''}`} hidden={!open}>
        <ul>
          {links.map((n) => {
            const current = currentFor(n.href);
            return (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={close}
                  className={current ? 'is-active' : undefined}
                  aria-current={current}
                >
                  {n.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* The primary action belongs in the menu too. It used to exist only in
            the header row, where at 320px it was one of three controls fighting
            for 161px beside the logo. */}
        <div className="vf-mobile-menu-foot">
          <a href={appLinks.login} onClick={close} className="vf-mobile-menu-login">
            Log in
          </a>
          <a
            href={appLinks.signup}
            onClick={close}
            className="vf-mobile-menu-cta"
            style={{ background: c.orange, color: c.orangeInk, font: `700 16px ${font.body}` }}
          >
            Start free
          </a>
        </div>
      </div>
    </nav>
  );
}
