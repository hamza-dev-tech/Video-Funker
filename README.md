# Video Funker

Monorepo for the Video Funker marketing site and its supporting API.

```
videofunker/
├── client/          Next.js 15 (App Router) — marketing site AND product app
│   ├── public/
│   │   ├── brand/   logo.png (lockup), mark.png (icon only)
│   │   └── shots/   product screenshots used in "How it works"
│   └── src/
│       ├── app/
│       │   ├── layout.js      root: <html>, fonts, analytics. NO stylesheet.
│       │   ├── globals.css    the marketing stylesheet
│       │   ├── (marketing)/   / , /about, /blog/**, /results/**, /vs/** …
│       │   └── (product)/     /app — the SPA mount + product.css (Tailwind)
│       ├── components/
│       │   ├── brand/       Logo
│       │   └── marketing/   Nav, Hero, HowItWorks, WhyVideo,
│       │                    Deliverables, Proof, CTA, Footer, CursorRing
│       ├── config/  site.js (brand tokens, links), content.js (all page copy)
│       └── product/ the product app: pages, components/ui (shadcn), hooks,
│                    lib (API clients), store, context
├── api/             Express + MongoDB + TypeScript — the product API
└── server/          Express BFF — marketing lead capture + health
```

## The two client routes

One Next app serves two different products:

| Route      | Serves                                                                |
| ---------- | --------------------------------------------------------------------- |
| `/`        | the marketing site — server-rendered, hand-written CSS                |
| `/app/*`   | the product workspace — a client-side React SPA, Tailwind + shadcn/ui  |

`/login` and `/signup` are 307s to `/app/auth` and `/app/auth?mode=signup`.
All of it is declared in [`client/next.config.mjs`](client/next.config.mjs).

### How the SPA is mounted

The product is a react-router application. It reaches the browser through
**one** Next route, `app/(product)/app/page.js`, and a rewrite sends every
deeper URL to it:

```js
async rewrites() {
  return [{ source: '/app/:path+', destination: '/app' }];
}
```

That rewrite is what makes a cold load of `/app/film` work — the server knows
no such path, react-router does. A catch-all segment (`[[...slug]]`) would
serve the same URLs, but Next keys a rendered segment by its params, so every
in-app navigation and every browser Back would tear the SPA down and rebuild
it, losing the query cache and all component state. One static route means Next
re-renders nothing and react-router does all the routing.

`BrowserRouter` takes its `basename` from `NEXT_PUBLIC_PRODUCT_BASE_PATH`
(default `/app`), so every route in `src/product/App.tsx` is still written from
`/`. Serving the product at the root of its own hostname later is an env change
plus the matching rewrite, not an edit to every link in the app.

### Why the route groups exist

`(marketing)` and `(product)` add nothing to any URL. They exist so each family
owns its own stylesheet, because the two cannot share a document:

- `globals.css` opens with `* { margin: 0; padding: 0 }`, fades every anchor on
  hover, and deliberately refuses a global `box-sizing: border-box`.
- The product is shadcn/ui, which assumes Tailwind's preflight — including
  `box-sizing: border-box` on everything.

Load both and the marketing cards shrink by their padding while the app's
buttons, inputs and dialogs come apart. Next only ships a segment's CSS on the
routes beneath it, so `globals.css` is imported by `(marketing)/layout.js`,
`product.css` by `(product)/layout.js`, and the root layout imports neither.
After touching either layout, check what the built product page actually links:

```bash
grep -o 'href="/_next/static/css/[^"]*"' client/.next/server/app/app.html
```

The marketing chunk — the one whose first bytes are `*{margin:0;padding:0}` —
must not be in that list.

One consequence to keep: links between the two families are plain `<a>`, never
`next/link`. A client-side navigation would carry the previous family's
stylesheet into the new document and undo the split.

## Running it

The product API needs MongoDB. A local install, Atlas, or:

```bash
docker run -d --name vf-mongo -p 27017:27017 mongo:7
```

Then:

```bash
cp client/.env.example client/.env.local && cp api/.env.example api/.env && npm install && npm run dev
```

| Service  | Port | What it is                                      |
| -------- | ---- | ----------------------------------------------- |
| `client` | 3000 | marketing site + product app                    |
| `api`    | 3001 | product API — auth, campaigns, content, billing  |
| `server` | 4000 | marketing lead-capture BFF                      |

Run them separately with `npm run dev:client` / `npm run dev:api` /
`npm run dev:server`.

**Each workspace reads its own env file** — `client/.env.local`, `api/.env`,
`server/.env`. A value written only in the root `.env` is invisible to all
three; that file is a map of the three services and nothing loads it.

### What works without third-party keys

MongoDB and `JWT_SECRET` are the only hard requirements. Sign-up, sign-in,
sessions and the whole workspace UI run on those alone. The rest degrade one
feature at a time rather than at boot:

| Missing             | Consequence                                                   |
| ------------------- | ------------------------------------------------------------- |
| `OPENAI_API_KEY`    | ICP, content generation and prospect research return an error |
| `SENDGRID_API_KEY`  | see below — no email means no verified accounts               |
| `STRIPE_SECRET_KEY` | the billing screens error; nothing else notices               |
| `HEYGEN_API_KEY`    | avatar/video generation and voice cloning fail                |

SendGrid is the one to plan for. Sign-up itself succeeds without it — the
account is created and the user lands in the app — but the verification code is
emailed, so `emailVerified` never becomes true, and `requireVerifiedEmail`
gates campaign creation, content generation, video generation and checkout.
Until SendGrid is configured, the app is effectively read-only after sign-up.

## Where to change things

All page copy lives in [`client/src/config/content.js`](client/src/config/content.js) —
headline, steps, deliverables, comparison table, proof, testimonial wall, CTA.
Nothing user-visible is hard-coded inside a component.

Brand tokens (palette, fonts, nav items, app links) live in
[`client/src/config/site.js`](client/src/config/site.js).

## API

`api/` is the product's own service: Express + Mongoose + TypeScript, mounted at
`/api`. Auth (JWT), campaigns, ICP, content generation, prospect research, video
and avatar generation, reports, and Stripe billing. Everything except the auth
and webhook endpoints sits behind `protect`, and most writes additionally behind
`requireVerifiedEmail`.

Two things to know before changing it:

- **`APP_URL` is not `CORS_ORIGINS`.** Stripe returns the customer to
  `${APP_URL}/pricing`, which must carry the `/app` base path; a CORS origin may
  not contain a path at all. These were one variable and could not stay one.
- **Third-party clients are constructed lazily** — `config/openai.ts`,
  `services/stripe.service.ts`, `services/email.service.ts`. An SDK constructed
  at module scope turns a missing key into a process that will not boot instead
  of one feature that does not work, which is exactly what `OPENAI_API_KEY`
  used to do here.

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

## Deploying

`.github/workflows/deploy.yml` still does the same thing: SSH to the VPS and run
`/root/deploy-videofunker.sh`. That script lives on the server and is not in
this repository, so bringing the product online needs three changes made there,
none of which this repo can make for you:

1. **Build the API too.** `npm run build` at the repo root now builds `api`
   before `client` (`tsc` then `next build`). A deploy script that runs
   `npm --workspace client run build` directly will ship a marketing site with a
   `/app` route whose API never started.
2. **Run three processes, not two.** `api` needs a pm2 entry alongside `client`
   and `server`, started with `npm --workspace api run start` (which runs the
   compiled `dist/server.js`).
3. **Give the API its environment.** `api/.env` on the server, with at minimum
   `MONGODB_URI` and `JWT_SECRET`, plus `APP_URL=https://videofunker.ai/app` and
   `CORS_ORIGINS` listing the real origins. MongoDB has to exist on that box or
   be reachable from it — this is the first service in the stack with a database.

The `/uploads` directory is written at runtime (avatar images, generated
documents) and resolves relative to the `api` package root. On a
release-directory deploy that path changes every release, so it wants a symlink
to a persistent location rather than living inside the release.

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
- **The product app's fonts are declared in the ROOT layout, not the product
  one.** Radix renders every dialog, dropdown and toast through a portal into
  `<body>`, outside the product layout's wrapper `<div>`. CSS custom properties
  inherit downward only, so fonts declared on that div do not reach the portals:
  `font-family: var(--font-product-body), …` becomes invalid there and every
  modal in the app falls back to Times New Roman.
- **`react-day-picker` is pinned to 8 with an npm `override` in the root
  package.json.** Version 8 declares a React peer range that stops at 18 and the
  client is on 19; 9 and 10 fixed the range but replaced the components API that
  `product/components/ui/calendar.tsx` is written against. The override is the
  narrow fix. `--legacy-peer-deps` is not — it turns peer checking off for every
  package in the tree.
- **The product's TypeScript is loose on purpose.** `client/tsconfig.json` sets
  `strict`, `strictNullChecks` and `noImplicitAny` to false, matching the config
  this code shipped under. Turning them on is a worthwhile change and a separate
  one; done during the move it would have meant editing hundreds of assertions
  nobody was in a position to judge.
