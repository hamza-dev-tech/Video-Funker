/**
 * Shared motion plumbing for the page's four JS-driven animations: the hero
 * flow field, the hero card parallax, the cursor ring and the CTA glow.
 *
 * Two problems this solves, both of which every one of them had separately:
 *
 * 1. `@media (prefers-reduced-motion: reduce)` in globals.css can only reach
 *    CSS animations and transitions. It cannot touch a canvas draw call or an
 *    inline `element.style.transform = …` write, so all four loops ran at full
 *    tilt for a visitor who had explicitly asked them not to.
 *
 * 2. Three of the four never stopped. They ran at 60fps for the life of the
 *    page whether or not their section was on screen — the hero parallax kept
 *    animating cards that are `display: none` below 1080px.
 *
 * `rafLoop` fixes both: it refuses to start under reduced motion, and it only
 * runs while its element is actually intersecting the viewport and the tab is
 * visible.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

/**
 * Runs `tick(timestamp)` on requestAnimationFrame, but only while `el` is on
 * screen and the document is visible.
 *
 * @param {Element}  el      the element whose visibility gates the loop
 * @param {Function} tick    called with the rAF timestamp
 * @param {Object}  [opts]
 * @param {Function} [opts.onStop]  run once whenever the loop parks, for
 *   loops that need to settle their element into a resting state
 * @param {boolean} [opts.respectReducedMotion=true]  set false for loops whose
 *   output is layout rather than decoration
 * @returns {Function} cleanup
 */
export function rafLoop(el, tick, opts = {}) {
  const { onStop, respectReducedMotion = true } = opts;

  if (!el) return () => {};
  if (respectReducedMotion && reducedMotion()) return () => {};

  let raf = 0;
  let onScreen = false;

  const frame = (t) => {
    tick(t);
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    const shouldRun = onScreen && !document.hidden;
    if (shouldRun && !raf) {
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      if (onStop) onStop();
    }
  };

  // A margin so the loop is already warm by the time the section is scrolled
  // to, rather than visibly starting on the first pixel of intersection.
  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries[0].isIntersecting;
      sync();
    },
    { rootMargin: '200px' }
  );
  io.observe(el);
  document.addEventListener('visibilitychange', sync);

  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', sync);
    if (raf) cancelAnimationFrame(raf);
  };
}
