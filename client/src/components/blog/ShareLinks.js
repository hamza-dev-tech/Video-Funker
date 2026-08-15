'use client';

import { useEffect, useRef, useState } from 'react';

import { EV, track } from '@/lib/analytics';

/**
 * Share and copy-link.
 *
 * The share targets are ordinary links, not window.open() calls: a popup
 * blocker eats the second one, and a real href is what lets someone
 * middle-click or long-press to open in a new tab. `noopener noreferrer` for
 * the same reverse-tabnabbing reason the article body applies it.
 *
 * The copy button falls back to the deprecated execCommand path because
 * navigator.clipboard is unavailable on any non-secure origin — which includes
 * the http://localhost:PORT this is developed on, and every LAN preview URL.
 * Without the fallback the button silently does nothing exactly where it gets
 * tested most.
 */
export default function ShareLinks({ url, title }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  // A pending timeout that fires after unmount sets state on a dead component.
  useEffect(() => () => clearTimeout(timer.current), []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    { label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, glyph: 'in', network: 'linkedin' },
    { label: 'Share on X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, glyph: '𝕏', network: 'x' },
    { label: 'Share by email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, glyph: '@', network: 'email' },
  ];

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement('textarea');
        el.value = url;
        // Off-screen rather than display:none — a hidden element cannot be
        // selected, so the copy silently succeeds with an empty string.
        el.style.position = 'fixed';
        el.style.top = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
      // Tracked here rather than by the delegated listener, which only watches
      // anchors. Inside the try on purpose: a copy that threw is not a share.
      track(EV.blogCopyLink, { link_url: url });
    } catch {
      // Clipboard permission denied. Saying nothing is better than an error
      // dialog for an action the reader can do themselves from the URL bar.
    }
  };

  return (
    <div className="vf-share">
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="vf-share-btn"
          aria-label={t.label}
          title={t.label}
          // Read by the delegated listener in analytics/ClickTracker. Without
          // these the LinkedIn and X links would be logged as generic outbound
          // clicks, indistinguishable from a citation in the article body, and
          // the mailto would not be counted at all.
          data-track="blog_share"
          data-track-network={t.network}
        >
          <span aria-hidden="true">{t.glyph}</span>
        </a>
      ))}

      <button type="button" onClick={copy} className="vf-share-btn vf-share-copy">
        {copied ? 'Copied' : 'Copy link'}
      </button>

      {/* The button's own label changes, but a screen reader is not told unless
          the change is announced. role=status announces politely, without
          stealing focus mid-read. */}
      <span role="status" aria-live="polite" className="vf-visually-hidden">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}
