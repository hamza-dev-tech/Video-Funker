import { c, font } from '@/config/site';

/**
 * The little visual on each deliverable card.
 *
 * These were five PNG exports (`/art/accent-*.png`, 1124x450) and they had two
 * problems that compounded each other.
 *
 * The first was duplication. Each image had a paraphrase of the card's own body
 * copy baked into it, so every card said the same thing twice. "Short
 * founder-led videos with scripts, presenter delivery, captions and feed-ready
 * formatting" sat directly above a picture reading "Founder-led clips with
 * scripts, presenter delivery, captions, and sizing." A reader's eye catches
 * that instantly and reads it as a template that was filled in twice.
 *
 * The second was typography. The words inside those files were pixels, drawn at
 * 1124px wide and displayed at 380, sitting beside live text rendered at 15px
 * by the font engine. Nothing makes those match.
 *
 * So each one is markup now, and each shows an ARTEFACT rather than restating
 * the sentence above it: the button on a finished clip, the hook line of a
 * draft, the shape of a carousel. Nothing here repeats the body copy, and every
 * word is real text at the real font.
 */

const shell = {
  border: `1px solid ${c.line}`,
  borderRadius: 14,
  background: c.bg,
  padding: 16,
  width: '100%',
};

/** A finished clip, with the one button that matters on it. */
function VideosArt() {
  return (
    <div style={shell}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: c.blueCard,
          borderRadius: 10,
          padding: '13px 16px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: c.orange,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: `9px solid ${c.orangeInk}`,
              borderTop: '5.5px solid transparent',
              borderBottom: '5.5px solid transparent',
              marginLeft: 3,
            }}
          />
        </span>
        <span style={{ font: `700 15px ${font.body}`, color: c.white }}>Ready for LinkedIn</span>
        <span style={{ font: `600 12px ${font.body}`, color: c.bluePale, marginLeft: 'auto' }}>0:42</span>
      </div>
    </div>
  );
}

/** The hook line of a draft, which is the part a founder actually reviews. */
function PostsArt() {
  return (
    <div style={shell}>
      <p
        style={{
          font: `700 10px ${font.body}`,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: c.soft,
          margin: '0 0 7px',
        }}
      >
        Hook
      </p>
      <p style={{ font: `600 15px/1.45 ${font.body}`, color: c.ink, margin: 0 }}>
        Most agencies price the wrong thing.
      </p>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }} aria-hidden="true">
        {['62%', '88%', '40%'].map((w, i) => (
          <span key={i} style={{ height: 6, width: w, borderRadius: 3, background: c.lineStrong, opacity: 0.7 }} />
        ))}
      </div>
    </div>
  );
}

/** Three slides, which is the shape of the format rather than a caption for it. */
function CarouselsArt() {
  const slides = [
    { bg: c.blueCard, n: '1' },
    { bg: c.blueBright, n: '2' },
    { bg: c.orange, n: '3', ink: c.orangeInk },
  ];
  return (
    <div style={shell}>
      <div style={{ display: 'flex', gap: 8 }}>
        {slides.map((s) => (
          <span
            key={s.n}
            aria-hidden="true"
            style={{
              flex: 1,
              height: 64,
              borderRadius: 9,
              background: s.bg,
              display: 'flex',
              alignItems: 'flex-end',
              padding: 9,
              font: `700 13px ${font.body}`,
              color: s.ink || c.white,
            }}
          >
            {s.n}
          </span>
        ))}
      </div>
      <p style={{ font: `500 12px ${font.body}`, color: c.soft, margin: '11px 0 0' }}>Swipe, three slides</p>
    </div>
  );
}

/** Paragraphs and a reading time: what a long piece looks like at a glance. */
function ArticlesArt() {
  return (
    <div style={shell}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }} aria-hidden="true">
        {['100%', '94%', '97%', '58%'].map((w, i) => (
          <span key={i} style={{ height: 7, width: w, borderRadius: 4, background: c.lineStrong, opacity: 0.75 }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <span
          style={{
            font: `700 11px ${font.body}`,
            color: c.amber,
            background: '#ffd23f2e',
            borderRadius: 100,
            padding: '4px 10px',
          }}
        >
          6 min read
        </span>
        <span style={{ font: `500 12px ${font.body}`, color: c.soft }}>Published to your page</span>
      </div>
    </div>
  );
}

/** A real reply, which is the outcome the card is describing. */
function OutreachArt() {
  return (
    <div style={shell}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span
          aria-hidden="true"
          style={{ width: 30, height: 30, borderRadius: '50%', background: c.blueWash, flex: 'none' }}
        />
        <div
          style={{
            background: '#ffd23f24',
            border: `1px solid #ffd23f70`,
            borderRadius: '4px 12px 12px 12px',
            padding: '11px 14px',
          }}
        >
          <p style={{ font: `500 14px/1.45 ${font.body}`, color: c.ink, margin: 0 }}>
            Saw your pricing video. Worth sending the teardown?
          </p>
        </div>
      </div>
      <p style={{ font: `500 12px ${font.body}`, color: c.soft, margin: '11px 0 0 40px' }}>Reply, day 9</p>
    </div>
  );
}

const ART = {
  videos: VideosArt,
  posts: PostsArt,
  carousels: CarouselsArt,
  articles: ArticlesArt,
  outreach: OutreachArt,
};

export default function DeliverableArt({ kind }) {
  const Art = ART[kind];
  // An unknown key renders nothing rather than throwing. A typo in the content
  // file should cost one visual, not the whole page.
  return Art ? <Art /> : null;
}
