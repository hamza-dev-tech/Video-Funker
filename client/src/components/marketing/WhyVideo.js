import Image from 'next/image';

import Reveal from '@/components/marketing/Reveal';
import { feed, whyVideo } from '@/config/content';
import { c, font } from '@/config/site';

/* Wide enough that one full loop outruns the viewport — any narrower and the
   same card turns up twice on screen at once. */
const CARD_W = 372;
const CARD_GAP = 24;
const ART_W = 640;
const ART_H = 726;
/* Every card in the strip is pinned to this height — artwork included. The
   four post images were exported at slightly different heights (723–731px),
   so letting them size themselves left the row up to 5px ragged along the
   bottom. Cropping each one to a shared box costs a pixel or two off the
   edge and nothing that reads. */
const CARD_H = Math.round((CARD_W * ART_H) / ART_W);
/* Seconds of travel per card, so adding a post lengthens the loop instead of
   speeding the whole strip up. This is the dial for the strip's pace:
   lower is faster, and the card pitch is 396px, so 5.5 ≈ 72px/s. */
const SECONDS_PER_CARD = 5.5;

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

/** A finished post: a real face, real media, real engagement. */
function ArtCard({ item, hidden }) {
  return (
    <div
      className="vf-tilt vf-feedcard vf-postcard"
      aria-hidden={hidden || undefined}
      style={{ '--tilt': item.tilt, width: CARD_W, height: CARD_H, marginRight: CARD_GAP }}
    >
      <Image
        src={item.src}
        alt={hidden ? '' : item.alt}
        width={ART_W}
        height={ART_H}
        sizes={`${CARD_W}px`}
        loading="eager"
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}

/** The other half of the argument: words, no face, nothing to watch. */
function TextCard({ item, hidden }) {
  return (
    <article
      className="vf-tilt vf-feedcard vf-post vf-post-ai"
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

      <div className="vf-post-wall-wrap">
        <div className="vf-post-wall">
          <p className="vf-post-body">{item.body}</p>
        </div>
        <span className="vf-post-more">…see more</span>
      </div>

      <footer className="vf-post-stats">
        <span className="vf-post-stat-hot">{item.stat}</span>
        <span>{item.stat2}</span>
      </footer>
    </article>
  );
}

function Post({ item, hidden }) {
  return item.kind === 'card' ? <ArtCard item={item} hidden={hidden} /> : <TextCard item={item} hidden={hidden} />;
}

export default function WhyVideo() {
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
            font: `600 clamp(40px, 4.2vw, 64px)/1.05 ${font.display}`,
            letterSpacing: '-0.02em',
            maxWidth: 820,
            margin: '0 0 26px',
          }}
        >
          {whyVideo.title}
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
          the items, not as a flex gap — a gap adds one fewer space than there
          are cards, so the halfway point stops matching and the loop visibly
          jumps every pass. */}
      <div style={{ overflow: 'hidden', padding: '20px 0 90px', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            alignItems: 'flex-start',
            animation: `marquee ${(feed.length * SECONDS_PER_CARD).toFixed(1)}s linear infinite`,
          }}
        >
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
