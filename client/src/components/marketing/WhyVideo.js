import Image from 'next/image';

import Reveal from '@/components/marketing/Reveal';
import { feed, whyVideo } from '@/config/content';
import { c, font, type } from '@/config/site';

/* Wide enough that one full loop outruns the viewport. Any narrower and the
   same card turns up twice on screen at once. */
const CARD_W = 336;
const CARD_GAP = 22;
/* Every card in the strip is pinned to this height. Both kinds are markup now,
   so the number is a layout decision rather than a property of whatever height
   somebody happened to export a PNG at. It fits a header, a caption, a 640:281
   thumbnail and a stats row at 336px wide with 16px of padding. */
const CARD_H = 381;
/* The strip's pace, stated as speed rather than duration. Expressing it this
   way means neither adding a card nor resizing one changes how fast the feed
   actually moves; the duration is derived from both below. */
/* Fast enough that the strip reads as alive rather than as a static row of
   cards. It can afford this pace because hovering the strip pauses it, so
   nobody has to chase a card to finish reading it. */
const PIXELS_PER_SECOND = 78;

function Avatar({ src }) {
  return (
    <span className="vf-post-av" aria-hidden="true">
      {src ? (
        <Image src={src} alt="" width={76} height={76} sizes="38px" loading="eager" />
      ) : (
        /* The default-avatar silhouette, the way a real feed renders someone
           who never uploaded a photo. */
        <svg viewBox="0 0 38 38" width="38" height="38" aria-hidden="true">
          <circle cx="19" cy="14.5" r="6.2" fill="#b3c6dd" />
          <path d="M6.5 38c0-7 5.6-11.5 12.5-11.5S31.5 31 31.5 38Z" fill="#b3c6dd" />
        </svg>
      )}
    </span>
  );
}

/* Two tiny glyphs so the engagement row reads as a feed rather than a caption.
   Inline rather than imported from icons.js: these are 13px decorations beside
   a number that already says everything, so they are aria-hidden and carry no
   label of their own. */
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 7.4c0 3-2.7 5.4-6 5.4-.8 0-1.6-.14-2.3-.4L2 13.5l1.2-2.9A5.1 5.1 0 0 1 2 7.4C2 4.4 4.7 2 8 2s6 2.4 6 5.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The shared shell.
 *
 * Both kinds of post render through this so the header, the byline, the type
 * scale and the stats row are physically the same markup and the same CSS.
 * That is the whole point: the previous version drew the video posts as
 * exported bitmaps, and no amount of care keeps a resampled image of text
 * looking like text rendered live next to it.
 */
function PostShell({ item, hidden, variant, children }) {
  return (
    <article
      className={`vf-tilt vf-feedcard vf-post ${variant}`}
      aria-hidden={hidden || undefined}
      style={{ '--tilt': item.tilt, width: CARD_W, height: CARD_H, marginRight: CARD_GAP }}
    >
      <header className="vf-post-head">
        <Avatar src={item.avatar} />
        <div style={{ minWidth: 0 }}>
          <div className="vf-post-who">{item.who}</div>
          <div className="vf-post-meta">{item.meta}</div>
        </div>
      </header>
      {children}
      <footer className="vf-post-stats">
        <span className="vf-post-stat-hot">
          {variant === 'vf-post-video' && <EyeIcon />}
          {item.stat}
        </span>
        <span>
          {variant === 'vf-post-video' && <CommentIcon />}
          {item.stat2}
        </span>
      </footer>
    </article>
  );
}

/** A post with a face and something to watch. */
function VideoPost({ item, hidden }) {
  return (
    <PostShell item={item} hidden={hidden} variant="vf-post-video">
      {/* Clamped to three lines rather than faded. A real video caption is
          short and finishes its sentence; the fade belongs to the wall of text
          on the other card, where being cut off mid-thought is the point. */}
      <p className="vf-post-body vf-post-caption">{item.body}</p>

      <div className="vf-post-thumb">
        <Image
          src={item.thumb}
          alt={hidden ? '' : item.thumbAlt}
          fill
          sizes={`${CARD_W}px`}
          /**
           * Eager on the real copy, lazy on the duplicated half.
           *
           * Lazy loading assumes an element enters the viewport by scrolling.
           * These enter by TRANSFORM, sliding in from the right, and a card
           * that arrives before its thumbnail has been requested shows an
           * empty grey box for a beat. The strip is the second thing on the
           * page, so those four images (about 140KB in total) are going to be
           * needed within a second or two regardless.
           *
           * The duplicate half stays lazy and costs nothing either way: it
           * points at the identical URLs, so it is a cache hit.
           */
          loading={hidden ? 'lazy' : 'eager'}
          /**
           * Eager, but explicitly LOW priority.
           *
           * These sit below the fold, so plain `eager` would have them compete
           * with the hero for bandwidth and push out the LCP. Plain `lazy`
           * leaves them unrequested until they have already slid into view,
           * because the strip moves by transform rather than by scrolling, and
           * a card arriving before its thumbnail shows an empty grey box.
           *
           * fetchPriority="low" resolves the two: the request is queued
           * immediately but the browser services it after everything that
           * paints the first screen. The four files total about 150KB.
           */
          fetchPriority="low"
          style={{ objectFit: 'cover' }}
        />
        <span className="vf-post-play" aria-hidden="true">
          <span />
        </span>
        <span className="vf-post-dur" aria-hidden="true">
          {item.duration}
        </span>
      </div>
    </PostShell>
  );
}

/** The other half of the argument: words, no face, nothing to watch. */
function TextPost({ item, hidden }) {
  return (
    <PostShell item={item} hidden={hidden} variant="vf-post-ai">
      <div className="vf-post-wall-wrap">
        <div className="vf-post-wall">
          <p className="vf-post-body">{item.body}</p>
        </div>
        <span className="vf-post-more">…see more</span>
      </div>
    </PostShell>
  );
}

function Post({ item, hidden }) {
  return item.kind === 'video' ? <VideoPost item={item} hidden={hidden} /> : <TextPost item={item} hidden={hidden} />;
}

export default function WhyVideo() {
  const loopSeconds = ((feed.length * (CARD_W + CARD_GAP)) / PIXELS_PER_SECOND).toFixed(1);

  return (
    <section
      id="why-video"
      style={{
        background: `radial-gradient(1100px 600px at 15% 0%, ${c.blueLift} 0%, transparent 60%), radial-gradient(900px 700px at 90% 100%, ${c.blueDark} 0%, transparent 65%), linear-gradient(155deg, ${c.blueBright} 0%, ${c.blueDeep} 100%)`,
        color: '#fff',
        padding: '96px 0 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(#ffffff0a 1px, transparent 1px), linear-gradient(90deg, #ffffff0a 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          WebkitMaskImage: 'radial-gradient(900px 600px at 30% 20%, black 0%, transparent 80%)',
          maskImage: 'radial-gradient(900px 600px at 30% 20%, black 0%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      <div className="vf-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px', position: 'relative' }}>
        <Reveal
          as="h2"
          variant="left"
          style={{
            font: `600 ${type.h2}/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            maxWidth: 820,
            margin: '0 0 26px',
          }}
        >
          {whyVideo.title}
          <span className="vf-h2-lead">{whyVideo.lead}</span>
        </Reveal>
        <Reveal
          as="p"
          variant="left"
          delay={110}
          style={{ font: `400 20px/1.6 ${font.body}`, color: c.blueWash, maxWidth: 620, margin: '0 0 52px' }}
        >
          {whyVideo.sub}
        </Reveal>
      </div>

      {/* The strip is doubled and slid exactly half its width. Spacing lives on
          the items, not as a flex gap: a gap adds one fewer space than there
          are cards, so the halfway point stops matching and the loop visibly
          jumps every pass.

          `vf-marquee` carries the animation so it can pause on hover and stop
          entirely under prefers-reduced-motion. An inline `animation` could do
          neither, because there is no inline equivalent of :hover or a media
          query. */}
      <div className="vf-marquee-mask">
        <div className="vf-marquee" style={{ animationDuration: `${loopSeconds}s` }}>
          {feed.map((item, i) => (
            <Post key={`a-${i}`} item={item} />
          ))}
          {feed.map((item, i) => (
            <Post key={`b-${i}`} item={item} hidden />
          ))}
        </div>
      </div>
    </section>
  );
}
