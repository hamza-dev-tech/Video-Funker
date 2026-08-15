import { c, font } from '@/config/site';

/**
 * The four artefacts on the proof wall: the post, the reply, the numbers, the
 * calendar.
 *
 * These were four PNG exports (`/art/wall-*.png`, 1788x1148, 459KB together)
 * and they repeated the mistake the feed strip and the deliverable cards had
 * already been fixed for. Every word inside them was a bitmap drawn at 1788px
 * wide and displayed at roughly 300, sitting beside a live 13px figcaption.
 * Nothing in them could be selected, read aloud, translated or indexed, and it
 * all went stale the moment the copy moved.
 *
 * They also asserted things we cannot stand behind. The stills carried burnt-in
 * counts (4,180 views, 6 warm DMs, 2 calls booked, then 6,340 views, 41 warm
 * DMs, 312 profile visits, 3 calls booked), an invented client brand (Sherpa
 * Growth) and an invented prospect (Maya Patel, VP Revenue, Series A SaaS). A
 * number inside a picture is still a claim. None of those figures survived.
 *
 * What is left is real text, and only text that already exists in
 * src/config/content.js: the post caption, the 0:42 duration, the prospect's DM
 * and the Thursday 14:30 booking. The trend chart carries no values at all. The
 * direction of the two lines makes the point, and a y-axis we cannot evidence
 * would be decoration pretending to be proof.
 *
 * TWO THINGS TO KNOW BEFORE EDITING.
 *
 * 1. Every type size and most of the geometry is in `em`, and the card's own
 *    font-size is a clamp on `cqw`. The wall drops to two columns under 1080px
 *    and the cards reach about 150px wide on a phone, which is narrower than
 *    any of this reads at. Scaling off the container keeps the artefacts legible
 *    instead of clipping. Do not set font-size on an intermediate wrapper: the
 *    `em` values all resolve against the card, and a nested size would compound.
 * 2. Card heights are set by the tallest card in the row, so each one puts its
 *    main block on `flex: 1`. Shorter cards centre their content rather than
 *    leaving the wall ragged.
 */

/** Desktop card width is ~313px; the base size clamps down from there. */
const card = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.87em',
  fontSize: 'clamp(9px, 3.67cqw, 11.5px)',
  background: c.white,
  border: `1px solid ${c.line}`,
  borderRadius: 16,
  padding: '1.22em',
  boxShadow: '0 18px 40px rgba(4,41,82,0.34)',
};

/** Top strip on the cards that need a title and a quiet right-hand note. */
function Head({ title, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7em' }}>
      <span style={{ font: `700 1em ${font.body}`, color: c.ink, letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ font: `600 0.83em ${font.body}`, color: c.soft, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
        {note}
      </span>
    </div>
  );
}

/** The published post: a still with the play control, and the hook under it. */
function PostArt() {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em' }}>
        <span
          aria-hidden="true"
          style={{ width: '2.09em', height: '2.09em', borderRadius: '50%', background: c.blueCard, flex: 'none' }}
        />
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ font: `700 1em ${font.body}`, color: c.ink }}>Your post</span>
          <span style={{ font: `500 0.83em ${font.body}`, color: c.soft }}>Founder, 2h, Public</span>
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '8.3em',
          borderRadius: 10,
          background: c.blueCard,
          overflow: 'hidden',
        }}
      >
        {/* A presenter, shoulders up. Shapes only: the point is that a person is
            on camera, not who they are. */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '1.57em',
            bottom: '2.6em',
            width: '2.26em',
            height: '2.26em',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.24)',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '0.6em',
            bottom: 0,
            width: '4.17em',
            height: '2.78em',
            borderRadius: '2.09em 2.09em 0 0',
            background: 'rgba(255,255,255,0.24)',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-1.4em',
            top: '-1.9em',
            width: '7.65em',
            height: '7.65em',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />

        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '56%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '2.96em',
            height: '2.96em',
            borderRadius: '50%',
            background: c.orange,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: `0.96em solid ${c.orangeInk}`,
              borderTop: '0.61em solid transparent',
              borderBottom: '0.61em solid transparent',
              marginLeft: '0.35em',
            }}
          />
        </span>

        <span
          style={{
            position: 'absolute',
            right: '0.7em',
            bottom: '0.7em',
            font: `700 0.87em ${font.body}`,
            color: c.white,
            background: 'rgba(3,63,128,0.74)',
            borderRadius: 5,
            padding: '0.26em 0.52em',
          }}
        >
          0:42
        </span>
      </div>

      <p style={{ font: `600 1em/1.4 ${font.body}`, color: c.ink, margin: 0 }}>
        The pricing mistake that quietly kills agency margins.
      </p>
    </div>
  );
}

/** The reply it pulled. No sender: we are not putting a name to a made-up buyer. */
function ReplyArt() {
  const bubble = {
    maxWidth: '92%',
    padding: '0.78em 0.96em',
    font: `500 1em/1.45 ${font.body}`,
  };

  return (
    <div style={card}>
      <Head title="LinkedIn DM" note="Day 9" />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.7em',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            ...bubble,
            alignSelf: 'flex-start',
            background: c.panel,
            color: c.ink,
            borderRadius: '4px 12px 12px 12px',
          }}
        >
          Saw your video. Do you have 20 min this week?
        </span>
        <span
          style={{
            ...bubble,
            alignSelf: 'flex-end',
            background: c.blue,
            color: c.white,
            borderRadius: '12px 12px 4px 12px',
          }}
        >
          Thursday afternoon works.
        </span>
        <span
          style={{
            ...bubble,
            alignSelf: 'flex-start',
            background: c.panel,
            color: c.ink,
            borderRadius: '12px 12px 12px 4px',
          }}
        >
          Perfect, sending an invite.
        </span>
      </div>
    </div>
  );
}

/** What the numbers did. Two lines, no y-axis, nothing asserted. */
function NumbersArt() {
  const stroke = {
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  };
  // Drawn in a 120x48 box and stretched, so the stroke has to opt out of the
  // scale or it goes fat horizontally and thin vertically.
  const reach = 'M0 41 C 12 39, 18 32, 30 30 C 42 28, 46 19, 58 18 C 70 17, 74 24, 86 21 C 98 18, 104 8, 120 6';
  const replies = 'M0 45 C 14 44, 20 41, 32 40 C 44 39, 50 42, 62 39 C 74 36, 80 33, 92 31 C 104 29, 110 27, 120 25';

  return (
    <div style={card}>
      <Head title="Post performance" note="Last 14 days" />
      <div
        style={{
          flex: 1,
          minHeight: '7.65em',
          background: c.bg,
          border: `1px solid ${c.line}`,
          borderRadius: 10,
          padding: '0.7em',
        }}
      >
        <svg
          viewBox="0 0 120 48"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          {[12, 24, 36].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="120"
              y2={y}
              stroke={c.line}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={`${reach} L120 48 L0 48 Z`} fill={c.blue} fillOpacity="0.09" stroke="none" />
          <path d={reach} stroke={c.blue} {...stroke} />
          <path d={replies} stroke={c.orange} {...stroke} />
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '1.2em' }}>
        {[
          { dot: c.blue, label: 'Reach' },
          { dot: c.orange, label: 'Replies' },
        ].map((k) => (
          <span key={k.label} style={{ display: 'flex', alignItems: 'center', gap: '0.43em' }}>
            <span
              aria-hidden="true"
              style={{ width: '0.61em', height: '0.61em', borderRadius: '50%', background: k.dot, flex: 'none' }}
            />
            <span style={{ font: `600 0.87em ${font.body}`, color: c.soft }}>{k.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The calendar that filled. Meeting types and times, no invented buyers. */
function CalendarArt() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  // `day` is the grid column, 1 = Monday. The Thursday 14:30 is the booking the
  // hero already names, so the reply card and this one describe one meeting.
  const slots = [
    { day: 2, from: 1, to: 3, name: 'Discovery', at: '10:00', warm: false },
    { day: 4, from: 1, to: 4, name: 'Intro call', at: '14:30', warm: true },
    { day: 5, from: 3, to: 5, name: 'Follow-up', at: '09:30', warm: false },
  ];

  return (
    <div style={card}>
      <Head title="This week" note="Mon to Fri" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
        {days.map((d) => (
          <span key={d} style={{ font: `700 0.78em ${font.body}`, color: c.soft, textAlign: 'center' }}>
            {d}
          </span>
        ))}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: '8em',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: 2,
          borderRadius: 8,
          border: `1px solid ${c.line}`,
          background: c.white,
          // The ruled week is painted rather than built from twenty empty cells,
          // so every child below can be placed explicitly and nothing gets
          // auto-flowed into the wrong day.
          backgroundImage: `linear-gradient(${c.line} 1px, transparent 1px), linear-gradient(90deg, ${c.line} 1px, transparent 1px)`,
          backgroundSize: '20% 25%',
        }}
      >
        {slots.map((s) => (
          <span
            key={s.name}
            style={{
              gridColumn: s.day,
              gridRow: `${s.from} / ${s.to}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '0.35em 0.43em',
              borderRadius: 6,
              background: s.warm ? '#ff901b1f' : '#0560be12',
              border: `1px solid ${s.warm ? '#ff901b8c' : c.lineStrong}`,
            }}
          >
            <span
              style={{
                font: `700 0.74em ${font.body}`,
                color: s.warm ? c.orangeDark : c.blueDeep,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                font: `600 0.74em ${font.body}`,
                color: s.warm ? c.orangeDark : c.soft,
                opacity: 0.85,
                whiteSpace: 'nowrap',
              }}
            >
              {s.at}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const ART = {
  post: PostArt,
  reply: ReplyArt,
  numbers: NumbersArt,
  calendar: CalendarArt,
};

export default function ProofArt({ kind }) {
  const Art = ART[kind];
  // An unknown key renders nothing rather than throwing, the same rule
  // DeliverableArt follows: a typo in the content file costs one visual, not
  // the whole page.
  if (!Art) return null;
  // The container lives out here, not on the card, because an element cannot
  // query its own size: the card's `cqw` font-size needs a container above it.
  return (
    <div style={{ containerType: 'inline-size', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Art />
    </div>
  );
}
