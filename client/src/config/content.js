import { c } from './site';

/* ── HERO ──────────────────────────────────────────────────────────── */

export const hero = {
  lines: ['AI killed the', 'written post.'],
  accent: 'Video wins.',
  /**
   * Leads with the category, then the mechanism.
   *
   * The h1 above it is the brand's best line and the whole word-by-word hover
   * treatment is built on it, so it keeps its metaphor. That leaves this
   * paragraph as the first place on the page where a reader (or a crawler)
   * learns what is actually being sold, which is why "done-for-you LinkedIn
   * video for B2B founders" sits at the front of it rather than the mechanism.
   */
  sub: 'Done-for-you LinkedIn video for B2B founders. AI writes the script, a lifelike presenter delivers it on camera, and you post it and book meetings. No crew, no studio, no filming day.',
  primary: 'Start free',
  secondary: 'See how it works',
  /** Answers the three objections that stop people clicking, in three words each. */
  proof: ['First video free', 'Ready in 72 hours', 'No camera, no crew'],
  viewsTarget: 4180,
  /**
   * The floating post card — a real frame from the product, not a placeholder.
   *
   * This has to stay a *video* post from the visitor's own account. It is the
   * hero's proof of the headline: the page argues written posts are dead, so a
   * card carrying generic written copy (or a dashboard image in the media slot)
   * argues against us in our own hero. A face mid-sentence is the product.
   */
  post: {
    author: 'Your post',
    meta: 'Founder · 2h · Public',
    caption: 'The pricing mistake that quietly kills agency margins.',
    /* Profile photo and presenter are the same person on purpose. It is your
       account and your face in your own video, and a mismatch there quietly
       undoes the claim the hero is making.
       Both now come from the same source frame: avatar-founder.png is a crop
       of thumb-founder.jpg. The previous still (hero-thumb-pricing.jpg) was a
       different man once the avatar was regenerated, and it carried a burnt-in
       title card in a font the site does not use. */
    avatar: '/art/avatar-founder.jpg',
    still: '/art/thumb-founder.jpg',
    /* The thumbnail's own 16:9. Do not force these title cards into a taller
       slot: object-fit then crops the first letter off the headline. */
    stillRatio: '16 / 9',
    stillAlt: 'A founder talking straight to camera in a finished video about pricing',
    duration: '0:42',
    comments: '32 comments',
  },
  dm: {
    quote: '"Saw your video. Do you have 20 min this week?"',
    meta: 'DM from a prospect · day 9',
  },
  booked: 'Meeting booked, Thu 14:30',
};

/* ── HOW IT WORKS ──────────────────────────────────────────────────── */

/**
 * Section headings carry two lines, and the second one is not decoration.
 *
 * `title` is the line the design was built around. `lead` is the same idea said
 * the way a buyer would type it, rendered smaller inside the SAME h2 element.
 *
 * The reason is that every heading on this page used to be a metaphor. "One
 * call. Then it runs itself.", "AI made every feed sound the same.", "Proof,
 * not promises." Not one of the sixteen headings on the site contained "B2B
 * video", "LinkedIn video", "founder-led video" or "video content agency" as a
 * phrase anybody searches for. Headings are one of the few strong on-page
 * relevance signals left and the part a grounding snippet reliably quotes, so
 * the page was spending all of them on wordplay.
 *
 * Putting the plain line inside the h2 rather than in a paragraph underneath is
 * the whole point. A sibling paragraph is body copy; this is the heading.
 */
export const howHeading = {
  title: 'One call. Then it runs itself.',
  lead: 'How done-for-you LinkedIn video works',
  sub: 'Tell us your story once. Everything after that is handled.',
};

export const steps = [
  {
    n: '1',
    title: 'Capture your point of view',
    body: 'One strategy call turns your founder voice, offers, objections and strongest opinions into a reusable content engine.',
    shot: '/shots/step-1-icp.png',
    alt: 'Video Funker ICP screen showing industry, company size, target roles, pain points and buying triggers',
  },
  {
    n: '2',
    title: 'Turn it into sharp scripts',
    body: 'We write short posts and video scripts that sound specific, useful and credible, instead of generic AI filler.',
    shot: '/shots/step-2-content.png',
    alt: 'Video Funker content engine with research, article, video script, captions, LinkedIn posts and outbound tabs',
  },
  {
    n: '3',
    title: 'Produce premium video',
    body: 'Your ideas become polished presenter videos, edited for LinkedIn and ready to publish without a filming day.',
    shot: '/shots/step-3-film.jpg',
    alt: 'Video Funker film studio playing a finished AI-presenter video',
  },
  {
    n: '4',
    title: 'Warm your outbound',
    body: 'Your videos support LinkedIn outreach, so prospects recognise your ideas before the first message ever lands.',
    shot: '/shots/step-4-report.png',
    alt: 'Video Funker campaign report showing ICP, content and video counts with a campaign funnel',
  },
];

/* ── WHY VIDEO ─────────────────────────────────────────────────────── */

export const whyVideo = {
  title: 'AI made every feed sound the same.',
  lead: 'Why founder-led video works for B2B buyers',
  sub: 'Video is the exception. Buyers check your profile before they take the meeting, and a face is the one thing they still trust.',
};

/**
 * The scrolling feed strip, alternating two kinds of post.
 *
 * `video` items are the ones with a face and something to watch. `text` items
 * are a wall of generic copy that fades out with nothing to look at. The
 * alternation is the section's whole argument, so the two must always stay
 * interleaved.
 *
 * BOTH kinds are built in markup. They used to differ: the video posts were
 * flat PNG exports of a finished card, roughly 600KB each, drawn at 640px wide
 * and displayed at 336. Every word inside them was a bitmap, resampled to 52%,
 * sitting beside live text rendered at 14px by the font engine. The two could
 * never match, so the strip read as though half the cards used a different
 * typeface. Rebuilding them as real markup fixed the typography, cut 2.8MB of
 * images, and turned the captions into text that can be read, selected,
 * translated and indexed.
 *
 * Three rules hold this together, and all three are easy to break by accident:
 *
 * 1. The strip loops, so this list is a ring. The last item sits next to the
 *    first one. Keep the length EVEN and end on a `text` item, or the join
 *    puts two video cards side by side and the alternation reads as broken
 *    exactly once per pass.
 * 2. Each `text` body has to be long enough to overflow the card. The wall is
 *    ~260px tall and truncates with a fade; copy that stops short leaves a
 *    hole where a real post would still be talking.
 * 3. `text` bodies are DELIBERATELY written to sound machine-generated. The
 *    stock phrases in them are the joke. Do not clean them up.
 */
export const feed = [
  {
    kind: 'video',
    who: 'Your post',
    meta: 'Founder · 2d',
    avatar: '/art/avatar-founder.jpg',
    body: 'We priced by the hour for four years and kept wondering where the margin went. Moving to scope pricing took a week.',
    thumb: '/art/thumb-founder.jpg',
    thumbAlt: 'A founder talking to camera about pricing',
    duration: '0:42',
    stat: '41,300 views',
    stat2: '215 comments',
    tilt: '1.5deg',
  },
  {
    kind: 'text',
    who: 'Daniel Whitfield',
    meta: 'Head of Revenue Operations · 3h',
    /* avatar-3, not avatar-1: avatar-1 and avatar-founder are the same face,
       so this card and the "Your post" card were showing one person twice. */
    avatar: '/art/avatar-3.png',
    body:
      'Five lessons on scaling revenue that I keep coming back to. In today’s rapidly evolving landscape, cross-functional alignment is what separates the organisations that compound from the ones that quietly stall. Lesson one: alignment is a habit, not a meeting. Lesson two: your process is only ever as strong as the conversations happening behind it. Lesson three: data without context is just noise with a dashboard attached. Lesson four: the strongest teams over-communicate the obvious. Lesson five: consistency beats intensity, every single quarter, without exception. None of this is revolutionary, and that is rather the point. The fundamentals are unglamorous, repeatable, and the first thing to get skipped the moment targets tighten. Save this one for later.',
    stat: '2 likes',
    stat2: '0 comments',
    tilt: '-1deg',
  },
  {
    kind: 'video',
    who: 'Elena Rostova',
    meta: 'Enterprise Account Executive · 1d',
    avatar: '/art/avatar-elena.jpg',
    body: 'Six buyers mentioned my videos on first calls last quarter. Not one of them mentioned the deck I spent a month on.',
    thumb: '/art/thumb-elena.jpg',
    thumbAlt: 'An account executive talking to camera about how buyers research before a first call',
    duration: '1:04',
    stat: '18,500 views',
    stat2: '94 comments',
    tilt: '-1deg',
  },
  {
    kind: 'text',
    who: 'Tomas Lindqvist',
    meta: 'VP, Corporate Strategy · 5h',
    avatar: '/art/avatar-2.png',
    body:
      'Reflecting on a strong quarter with an exceptional team. Trust really is the new currency, and culture will always eat strategy for breakfast. Grateful to everyone who continues to believe in the mission we are building together. What I keep learning is that momentum is never the result of one big decision; it is the compound interest of a hundred small ones, made consistently, in roughly the right direction, by people who genuinely care about the outcome. We did not arrive here by chasing every trend that crossed the feed. We got here by staying close to our customers and being honest about what was not working. Vulnerability at the leadership level is not weakness. It is permission for everybody else to tell the truth.',
    stat: '1 like',
    stat2: '0 comments',
    tilt: '1deg',
  },
  {
    kind: 'video',
    who: 'Aisha Khan',
    meta: 'Director of Revenue Operations · 5h',
    avatar: '/art/avatar-aisha.jpg',
    body: 'Our CRM data was clean and pipeline still missed by thirty percent. The problem started three steps upstream of the CRM.',
    thumb: '/art/thumb-aisha.jpg',
    thumbAlt: 'A revenue operations lead talking to camera about where pipeline forecasts break down',
    duration: '0:38',
    stat: '31,500 views',
    stat2: '140 comments',
    tilt: '1deg',
  },
  {
    /* No avatar. avatar-3 now belongs to the Aisha video card, and the same
       face appearing on both a video post and a written one in the same strip
       reads as a mistake. The silhouette is also what LinkedIn actually shows
       for the accounts that post like this. */
    kind: 'text',
    who: 'Andre Bakker',
    meta: 'Director of Demand Generation · 1d',
    body:
      'Seven ways to unlock predictable pipeline (number three genuinely surprised me). Growth is a mindset long before it is ever a motion, and consistency compounds in ways most teams routinely underestimate. One: know your ideal customer better than they know themselves. Two: stop measuring activity and start measuring progression. Three: your best channel is almost always the one you have not fully committed to yet. Four: qualify out faster than feels comfortable. Five: every handoff is a leak until proven otherwise. Six: pipeline coverage is a symptom, not a strategy. Seven: the market rewards clarity, never volume. I could write a full post on each of these, and in time I probably will. Interested to hear your thoughts.',
    stat: '4 likes',
    stat2: '1 comment',
    tilt: '0.5deg',
  },
  {
    kind: 'video',
    who: 'Marcus Delaney',
    meta: 'Head of Sales · 3h',
    avatar: '/art/avatar-marcus.jpg',
    body: 'We sent half the outreach we sent last year and booked twice the meetings. The only thing that changed was showing my face first.',
    thumb: '/art/thumb-marcus.jpg',
    thumbAlt: 'A head of sales talking to camera about cutting outreach volume and booking more meetings',
    duration: '0:51',
    stat: '12,800 views',
    stat2: '61 comments',
    tilt: '-1.5deg',
  },
  {
    /* No avatar on this one — LinkedIn falls back to a silhouette, and a
       faceless post is the cleanest possible statement of the argument. */
    kind: 'text',
    who: 'Priya Raghunathan',
    meta: 'Global Head of Partnerships · 2d',
    body:
      'Had a fascinating conversation this week that completely reframed how I think about go-to-market. We talk endlessly about scale, but scale without a system underneath it is simply noise at a higher volume. The organisations pulling ahead right now are not the ones with the biggest teams or the largest budgets. They are the ones with the shortest distance between an insight and an action. That distance is a design choice. It shows up in how you run forecast calls, how you write enablement docs, and how quickly a signal from the front line reaches somebody who is empowered to act on it. Most companies optimise the parts and quietly neglect the seams.',
    stat: '3 likes',
    stat2: '0 comments',
    tilt: '-0.5deg',
  },
];

/* ── WHAT YOU GET ──────────────────────────────────────────────────── */

export const deliverablesHeading = {
  title: 'Everything you need to show up.',
  lead: 'What a month of B2B video content includes',
  sub: 'A month of feed-ready content, every month. In your voice, and nothing left to edit.',
};

/**
 * Titles and bodies are real text, because this is the copy buyers read and
 * search engines index.
 *
 * `art` names a visual in components/marketing/DeliverableArt.js. It used to be
 * a path to a PNG, and each of those PNGs had a paraphrase of the body copy
 * baked into it as pixels, so every card stated its point twice in two
 * different typefaces. The replacements show an artefact instead: the button on
 * a finished clip, the hook line of a draft, the shape of a carousel. If you
 * add a card, write the body here and the visual there, and make sure the two
 * are not saying the same sentence.
 */
export const deliverables = [
  {
    glyph: '▶',
    chip: c.orange,
    title: 'Finished videos',
    body: 'Short videos of you, scripted, filmed and captioned, sized for the feed and ready to post.',
    art: 'videos',
    span: '1',
    delay: '0s',
  },
  {
    glyph: 'Aa',
    chip: c.yellow,
    title: 'LinkedIn posts',
    body: 'A written post for every video, in your voice, opening on a line people stop scrolling for.',
    art: 'posts',
    span: '1',
    delay: '0.9s',
  },
  {
    glyph: '☰',
    chip: c.violet,
    title: 'Carousel creative',
    body: 'One idea, three slides, built so a buyer gets the whole argument on a phone in ten seconds.',
    art: 'carousels',
    span: '1',
    delay: '1.8s',
  },
  {
    glyph: '✎',
    chip: c.yellow,
    title: 'Long-form articles',
    body: 'The longer piece a serious buyer reads after your video makes them curious enough to look.',
    art: 'articles',
    span: '1',
    delay: '2.7s',
  },
  {
    glyph: '↗',
    chip: c.orange,
    title: 'Outreach support',
    body: 'Message angles tied to what you just published, so the person you contact has already seen your face and knows the argument before you say hello.',
    art: 'outreach',
    span: '2',
    delay: '3.6s',
  },
];

/* ── COMPARISON ────────────────────────────────────────────────────── */

export const compareHeading = {
  title: 'Fast or credible? Pick both.',
  sub: 'Writing tools are fast but faceless. Agencies are credible but slow. Video Funker is trusted video at AI speed, wired straight into outreach.',
  columns: ['AI writing tools', 'DIY filming', 'Video agencies'],
};

const no = { v: '✕', c: c.soft };
const yes = { v: '✓', c: c.ink };
const part = { v: '~', c: c.amber };

const mk = (label, c1, c2, c3, c4, last) => ({
  label,
  c1: c1.v,
  c1color: c1.c,
  c2: c2.v,
  c2color: c2.c,
  c3: c3.v,
  c3color: c3.c,
  c4,
  divider: last ? 'transparent' : c.line,
});

export const compareRows = [
  mk('Video content', no, yes, yes, '✓'),
  mk('A human face', no, yes, yes, '✓'),
  mk('Speed & volume', yes, no, no, '✓'),
  mk('Done-for-you', no, no, part, '✓'),
  mk('Wired into outreach', no, no, no, '✓', true),
];

/* ── PROOF ─────────────────────────────────────────────────────────── */

export const proofHeading = {
  title: 'Proof, not promises.',
  lead: 'Results from founder-led video campaigns',
};

export const proofs = [
  {
    big: '$360K+',
    title: 'Qualified pipeline in 45 days',
    body: 'Video-led content for a B2B services team. No generic hype, no boosted spend.',
  },
  {
    big: '10 → booked',
    title: 'From empty profile to meetings',
    body: 'Cold outreach that started converting like inbound once the videos went live.',
  },
  {
    big: '100s',
    title: 'Buyer interactions in 2 weeks',
    body: 'For a dev firm. Real conversations in the DMs, not vanity reach.',
  },
];

/**
 * The wall under the stats. The original design left four slots labelled
 * "drop screenshot here" — these are those artefacts: the post, the reply it
 * pulled, what the numbers did, and the calendar that filled.
 */
export const wall = [
  {
    src: '/art/wall-video-still.png',
    alt: 'A published founder-led video post with 4,180 views, 6 warm DMs and 2 calls booked',
    caption: 'The post',
    tilt: '-2deg',
  },
  {
    src: '/art/wall-dm.png',
    alt: 'A LinkedIn conversation where a prospect says the video described their exact problem, ending in a booked meeting',
    caption: 'The reply',
    tilt: '1.5deg',
  },
  {
    src: '/art/wall-analytics.png',
    alt: 'Video post performance over 14 days: 6,340 views, 41 warm DMs, 312 profile visits, 3 calls booked',
    caption: 'The numbers',
    tilt: '-1deg',
  },
  {
    src: '/art/wall-calendar.png',
    alt: 'A week of client calendar meetings sourced from video-led outreach',
    caption: 'The calendar',
    tilt: '2deg',
  },
];

/* ── CTA ───────────────────────────────────────────────────────────── */

export const cta = {
  title: 'Be the face buyers trust.',
  sub: 'Your first video is on us. Written, produced and ready to post.',
  button: 'Start free',
};
