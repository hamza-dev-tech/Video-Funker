import { c } from './site';

/* ── HERO ──────────────────────────────────────────────────────────── */

export const hero = {
  lines: ['AI killed the', 'written post.'],
  accent: 'Video wins.',
  sub: 'AI writes the script. A lifelike presenter delivers it on camera. You post it and book meetings — no crew, no studio, no filming day.',
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
    /* Profile photo and presenter are the same person on purpose — it is your
       account and your face in your own video. */
    avatar: '/art/avatar-founder.png',
    still: '/art/hero-thumb-pricing.jpg',
    /* The thumbnail's own 16:9. Do not force these title cards into a taller
       slot: object-fit then crops the first letter off the headline. */
    stillRatio: '16 / 9',
    stillAlt: 'A finished video titled "Pricing Strategy — Enterprise Solutions Deep Dive", presented to camera',
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

export const howHeading = {
  title: 'One call. Then it runs itself.',
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
    body: 'We write short posts and video scripts that sound specific, useful and credible — instead of generic AI filler.',
    shot: '/shots/step-2-content.png',
    alt: 'Video Funker content engine with research, article, video script, captions, LinkedIn posts and outbound tabs',
  },
  {
    n: '3',
    title: 'Produce premium video',
    body: 'Your ideas become polished presenter videos, edited for LinkedIn and ready to publish without a filming day.',
    shot: '/shots/step-3-film.png',
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
  sub: 'Video is the exception. Buyers check your profile before they take the meeting, and a face is the one thing they still trust.',
};

/**
 * The scrolling feed strip, alternating two kinds of post.
 *
 * `card` items are finished artwork — a real post with a face and media.
 * `text` items are built in markup: a wall of generic copy that fades out
 * with nothing to look at. The alternation is the section's whole argument,
 * so the two must always stay interleaved.
 *
 * Two rules hold this together, and both are easy to break by accident:
 *
 * 1. The strip loops, so this list is a ring — the last item sits next to the
 *    first one. Keep the length EVEN and end on a `text` item, or the join
 *    puts two pieces of artwork side by side and the alternation reads as
 *    broken exactly once per pass.
 * 2. Each `body` has to be long enough to overflow the card. The wall is
 *    ~300px tall and truncates with a fade; copy that stops short leaves a
 *    hole where a real post would still be talking.
 */
export const feed = [
  {
    kind: 'card',
    src: '/art/post-yours.png',
    alt: 'Your post, Founder, 2 days ago: "Context is everything in B2B. Before buyers reply, they check whether you are real." 41,300 views and 215 comments.',
    tilt: '1.5deg',
  },
  {
    kind: 'text',
    who: 'Daniel Whitfield',
    meta: 'Head of Revenue Operations · 3h',
    avatar: '/art/avatar-1.png',
    body:
      'Five lessons on scaling revenue that I keep coming back to. In today’s rapidly evolving landscape, cross-functional alignment is what separates the organisations that compound from the ones that quietly stall. Lesson one: alignment is a habit, not a meeting. Lesson two: your process is only ever as strong as the conversations happening behind it. Lesson three: data without context is just noise with a dashboard attached. Lesson four: the strongest teams over-communicate the obvious. Lesson five: consistency beats intensity, every single quarter, without exception. None of this is revolutionary, and that is rather the point — the fundamentals are unglamorous, repeatable, and almost always the first thing to get skipped the moment targets tighten. Save this one for later.',
    stat: '2 likes',
    stat2: '0 comments',
    tilt: '-1deg',
  },
  {
    kind: 'card',
    src: '/art/post-studio.png',
    alt: 'A post from Elena Rostova, Enterprise Account Executive, on video-led buyer enablement, showing a video studio with camera and teleprompter. 18,500 views and 94 comments.',
    tilt: '-1deg',
  },
  {
    kind: 'text',
    who: 'Tomas Lindqvist',
    meta: 'VP, Corporate Strategy · 5h',
    avatar: '/art/avatar-2.png',
    body:
      'Reflecting on a strong quarter with an exceptional team. Trust really is the new currency, and culture will always eat strategy for breakfast. Grateful to everyone who continues to believe in the mission we are building together. What I keep learning is that momentum is never the result of one big decision; it is the compound interest of a hundred small ones, made consistently, in roughly the right direction, by people who genuinely care about the outcome. We did not arrive here by chasing every trend that crossed the feed. We got here by staying close to our customers, listening rather more than we talked, and being honest about the things that were not working. That last part is harder than it sounds. Vulnerability at the leadership level is not weakness; it is permission for everybody else to tell the truth.',
    stat: '1 like',
    stat2: '0 comments',
    tilt: '1deg',
  },
  {
    kind: 'card',
    src: '/art/post-aisha.png',
    alt: 'A post from Aisha Khan, Director of Revenue Operations, on data hygiene and predictable GTM growth, showing a revenue dashboard. 31,500 views and 94 comments.',
    tilt: '1deg',
  },
  {
    kind: 'text',
    who: 'Andre Bakker',
    meta: 'Director of Demand Generation · 1d',
    avatar: '/art/avatar-3.png',
    body:
      'Seven ways to unlock predictable pipeline (number three genuinely surprised me). Growth is a mindset long before it is ever a motion, and consistency compounds in ways most teams routinely underestimate. One: know your ideal customer better than they know themselves. Two: stop measuring activity and start measuring progression. Three: your best channel is almost always the one you have not fully committed to yet. Four: qualify out faster than feels comfortable. Five: every handoff is a leak until proven otherwise. Six: pipeline coverage is a symptom, not a strategy. Seven: the market rewards clarity, never volume. I could write a full post on each of these, and in time I probably will. For now I am most curious which one you would push back on, because the third has caused more internal debate than anything else we shipped this year. Interested to hear your thoughts.',
    stat: '4 likes',
    stat2: '1 comment',
    tilt: '0.5deg',
  },
  {
    kind: 'card',
    src: '/art/post-elena.png',
    alt: 'A post from Elena Rostova, VP of Growth, on video-led buyer enablement, showing a pipeline and ARR dashboard. 18,500 views and 94 comments.',
    tilt: '-1.5deg',
  },
  {
    /* No avatar on this one — LinkedIn falls back to a silhouette, and a
       faceless post is the cleanest possible statement of the argument. */
    kind: 'text',
    who: 'Priya Raghunathan',
    meta: 'Global Head of Partnerships · 2d',
    body:
      'Had a fascinating conversation this week that completely reframed how I think about go-to-market. We talk endlessly about scale, but scale without a system underneath it is simply noise at a higher volume. The organisations pulling ahead right now are not the ones with the biggest teams or the largest budgets — they are the ones with the shortest distance between an insight and an action. That distance is a design choice. It shows up in how you run forecast calls, how you write enablement docs, and how quickly a signal from the front line reaches somebody empowered to act on it. Most companies optimise the parts and quietly neglect the seams. Three things I would challenge every leader to audit this quarter: where information goes to die, which meeting could have been a document, and what you would stop doing tomorrow if the number was already hit.',
    stat: '3 likes',
    stat2: '0 comments',
    tilt: '-0.5deg',
  },
];

/* ── WHAT YOU GET ──────────────────────────────────────────────────── */

export const deliverablesHeading = {
  title: 'Everything you need to show up.',
  sub: 'A month of feed-ready content, every month. In your voice, and nothing left to edit.',
};

/**
 * Titles and bodies stay as real text — this is the copy buyers read and
 * search engines index. Each card carries a piece of the brand artwork as an
 * accent so the section has weight without turning content into a picture.
 */
export const deliverables = [
  {
    glyph: '▶',
    chip: c.orange,
    title: 'Finished videos',
    body: 'Short founder-led videos with scripts, presenter delivery, captions and feed-ready formatting.',
    art: '/art/accent-videos.png',
    artAlt: 'A finished clip marked ready for LinkedIn',
    span: '1',
    delay: '0s',
  },
  {
    glyph: 'Aa',
    chip: c.yellow,
    title: 'LinkedIn posts',
    body: 'Text posts matched to each video, written in a clear founder voice with strong hooks and practical insight.',
    art: '/art/accent-posts.png',
    artAlt: 'A drafted post hook reading "Most agencies price the wrong thing"',
    span: '1',
    delay: '0.9s',
  },
  {
    glyph: '☰',
    chip: c.violet,
    title: 'Carousel creative',
    body: 'Clean visual posts that turn one idea into a simple, swipeable argument buyers understand fast.',
    art: '/art/accent-carousels.png',
    artAlt: 'Three carousel slides in the brand palette',
    span: '1',
    delay: '1.8s',
  },
  {
    glyph: '✎',
    chip: c.yellow,
    title: 'Long-form articles',
    body: 'Deeper articles that give serious prospects something useful to read after they notice your videos.',
    art: '/art/accent-articles.png',
    artAlt: 'A long-form article laid out in paragraphs',
    span: '1',
    delay: '2.7s',
  },
  {
    glyph: '↗',
    chip: c.orange,
    title: 'Outreach support',
    body: 'LinkedIn message angles that connect naturally to your content, so cold outreach feels warmer and far more relevant. Prospects recognise your ideas before you ever say hello.',
    art: '/art/accent-outreach.png',
    artAlt: 'A prospect reply reading "Saw your pricing video — worth sending the teardown?"',
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

export const proofHeading = 'Proof, not promises.';

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
