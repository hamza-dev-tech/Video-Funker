# Video Funker

Monorepo for the Video Funker marketing site and its supporting API.

```
videofunker/
├── client/          Next.js 15 (App Router) — the marketing site
│   ├── public/
│   │   ├── brand/   logo.png (lockup), mark.png (icon only)
│   │   └── shots/   product screenshots used in "How it works"
│   └── src/
│       ├── app/     layout, page, globals.css, icon/apple-icon/opengraph images
│       ├── components/
│       │   ├── brand/       Logo
│       │   └── marketing/   Nav, Hero, HowItWorks, WhyVideo,
│       │                    Deliverables, Proof, CTA, Footer, CursorRing
│       └── config/  site.js (brand tokens, links), content.js (all page copy)
└── server/          Express BFF — lead capture + health
```

## The two client routes

The client deliberately splits into two route families:

| Route      | Serves                                                            |
| ---------- | ----------------------------------------------------------------- |
| `/`        | the marketing site, rendered by this Next app                     |
| `/app/*`   | redirects to the product at `app.videofunker.ai`                  |

`/login` and `/signup` redirect there too, so every call to action in the
marketing HTML points at a local path and the product's real hostname lives in
exactly one place: `NEXT_PUBLIC_APP_URL`. Point that at a local instance and
the whole site follows, no code change.

Redirects are declared in [`client/next.config.mjs`](client/next.config.mjs).

## Running it

```bash
cp .env.example .env && npm install && npm run dev
```

Client on <http://localhost:3000>, BFF on <http://localhost:4000>.
Run them separately with `npm run dev:client` / `npm run dev:server`.

## Where to change things

All page copy lives in [`client/src/config/content.js`](client/src/config/content.js) —
headline, steps, deliverables, comparison table, proof, testimonial wall, CTA.
Nothing user-visible is hard-coded inside a component.

Brand tokens (palette, fonts, nav items, app links) live in
[`client/src/config/site.js`](client/src/config/site.js).

## Server

A thin BFF, not the product API:

- `GET  /api/health` — liveness
- `POST /api/leads` — demo / contact / start-free capture

Leads fan out to a webhook and/or SMTP, whichever is configured. With neither
set they are logged and still return success, so the marketing form never
breaks because a credential is missing. Rate limited to 8 posts per IP per
10 minutes, with a honeypot field.

## Artwork

`public/art/` holds the brand illustration set. Two rules govern how it is used:

**Artefacts ship as images; copy stays as text.** The feed posts, DM thread,
analytics panel and calendar are mockups of things — they are pictures, and
they carry their content in `alt`. The deliverable cards' titles and bodies are
copy a buyer reads and a crawler indexes, so those stay real HTML and only take
a cropped *visual accent* from the artwork (`accent-*.png`).

**Art is trimmed and shadowed on its alpha.** Source files carry a page-tint
margin around the artwork; it is cropped off with an alpha-aware bounding box,
which leaves the card's own rounded corners with transparency outside them.
Shadows on those must be `filter: drop-shadow(...)` — a `box-shadow` paints a
hard rectangle behind the curve.

## Notes for whoever picks this up

A few things in here look like they could be simplified but should not be:

- **No global `box-sizing: border-box`.** The approved design sizes several
  fixed-width cards in the content-box model and opts individual elements into
  border-box inline. Flipping it globally silently shrinks those cards by
  their padding.
- **Scroll reveals are an IntersectionObserver, not `animation-timeline: view()`.**
  The CSS timeline only exists in Chromium, and its `both` fill-mode left
  Firefox and Safari either blank or firing everything at once on load. See
  `components/marketing/Reveal.js` and `[data-reveal]` in `globals.css`. The
  hidden state is authored in CSS so it ships in the server HTML.
- **The grid item is the `Reveal` wrapper, not the card.** Any `grid-column`
  override has to target `.vf-delcard-wrap`. Aimed at `.vf-delcard` it does
  nothing, and the wrapper's inline `span 2` makes Grid invent an implicit
  second column — which is how a one-column mobile layout silently stays at two.
- **The deliverable accent is width-capped.** Allowed to scale with its card,
  the two-column card's accent renders twice its neighbours' height and drags
  the whole grid row down with it.
- **Marquee images load `eager`.** The strip is always moving, so a lazily
  loaded card slides into view as an empty box and fills in afterwards — it
  reads as the section repairing itself a moment after load.
- **The marquee spaces its cards with `margin-right`, not a flex `gap`.** The
  strip is doubled and slid exactly half its width; a gap adds one fewer space
  than there are cards, so the halfway point stops lining up and the loop
  visibly jumps once per pass.
- **The screenshot stage in "How it works" sits inside a plain wrapper div.**
  As a direct flex item it gets auto side margins, stops stretching, and
  `aspect-ratio` then resolves its height to zero.
- **The favicon is transparent, not tiled.** A light tile renders as a glowing
  white box on dark browser chrome; a coloured one swallows the mark's own
  blue frame.
