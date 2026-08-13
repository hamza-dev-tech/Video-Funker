'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll-triggered reveal.
 *
 * Replaces the CSS `animation-timeline: view()` the design originally used.
 * That only exists in Chromium, and its `both` fill-mode meant Firefox and
 * Safari either froze every element at its 0% keyframe or fired the whole
 * page at once on load. An IntersectionObserver plus a CSS transition runs
 * identically everywhere and lets children stagger off one parent.
 *
 * The pre-reveal state lives in CSS on [data-reveal], so it ships in the
 * server HTML — no flash of finished layout before hydration.
 */
export default function Reveal({
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  amount = 0.15,
  once = true,
  className,
  style,
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const show = () => el.setAttribute('data-shown', '');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      show();
      return undefined;
    }

    // Anything already on screen at mount reveals immediately rather than
    // waiting for a scroll that may never come.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            el.removeAttribute('data-shown');
          }
        }
      },
      { threshold: amount, rootMargin: '0px 0px -6% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [amount, once]);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={className}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
