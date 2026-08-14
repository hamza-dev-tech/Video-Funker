/**
 * Single source of truth for brand identity, outbound links and the design
 * tokens the marketing page paints with. Components import from here so a
 * palette or domain change never means a find-and-replace across sections.
 */

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.videofunker.ai';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://videofunker.ai';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const site = {
  name: 'Video Funker',
  legalName: 'Video Funker',
  domain: 'videofunker.ai',
  tagline: 'AI writes it. A lifelike presenter delivers it. You book meetings.',
  description:
    'Video Funker turns one intake call into a month of feed-ready video. AI drafts posts and scripts in your voice, a lifelike presenter films them, and the content feeds LinkedIn outreach that lands like inbound.',
};

/**
 * Every product-side destination. These resolve through this app's own
 * /login, /signup and /app/* redirects (see next.config.mjs), so the
 * marketing HTML stays domain-agnostic.
 */
export const appLinks = {
  signup: '/signup',
  login: '/login',
  dashboard: '/app',
};

export const nav = [
  { label: 'How it works', href: '#how' },
  { label: 'Why video', href: '#why-video' },
  { label: 'What you get', href: '#deliverables' },
  { label: 'Proof', href: '#proof' },
];

/** The footer leads with the argument rather than the mechanics. */
export const footerNav = [
  { label: 'Why video', href: '#why-video' },
  { label: 'How it works', href: '#how' },
  { label: 'What you get', href: '#deliverables' },
  { label: 'Proof', href: '#proof' },
];

/**
 * Palette lifted from the approved design, with three text colours corrected
 * for contrast. The design's originals (`soft` #7186a0, `orangeDeep` #e57200,
 * `orangeDark` #b35f00) all measured below WCAG AA against the surfaces they
 * actually sit on, so they are darkened here rather than at each call site:
 *
 *   soft        #7186a0 → #566d88   3.54:1 → 5.06:1 on bg, 4.56:1 worst case
 *   orangeDeep  #e57200 → #d96b00   2.95:1 → 3.29:1  (large text + icon strokes)
 *   orangeDark  #b35f00 → #a85800   4.37:1 → 4.90:1  (small text)
 *
 * The fill orange (`orange`) is untouched — it is a background, never a text
 * colour, and darkening it would shift the brand.
 */
export const c = {
  bg: '#f7f9fc',
  panel: '#eef3f9',
  panelWarm: '#e7eef7',
  ink: '#12202e',
  muted: '#52657c',
  soft: '#566d88',
  line: '#dce4ee',
  lineStrong: '#c3d2e4',
  white: '#ffffff',

  blue: '#0560be',
  blueDeep: '#0455a8',
  blueDark: '#033f80',
  blueBright: '#0668cc',
  blueLift: '#1a7ee0',
  blueMid: '#4189d4',
  bluePale: '#8bc6ff',
  blueWash: '#cfe4fa',
  blueCard: '#0a4f9e',
  blueCardAlt: '#1160b8',
  blueText: '#b9d6f2',

  orange: '#ff901b',
  orangeDeep: '#d96b00',
  orangeDark: '#a85800',
  orangeInk: '#2a1a04',
  yellow: '#ffd23f',
  amber: '#a87f00',
  violet: '#8fa2ff',
};

/**
 * Type scale. The page was built with 28 distinct size/weight pairs — 13/14/15/
 * 16/17px all in play, 19/20/21 all in play, and five H2s rendering at three
 * different sizes. These are the steps everything should reach for instead.
 *
 * `h2` in particular is one value on purpose: five sections at the same
 * semantic level were rendering at 44px, 54px and 64px depending on which
 * clamp() each component happened to be written with.
 */
export const type = {
  hero: 'clamp(52px, 5.6vw, 84px)',
  /** The closing CTA only. Two deliberate bookend sizes, not five accidents. */
  display: 'clamp(44px, 4.8vw, 68px)',
  h2: 'clamp(36px, 4vw, 56px)',
  h3: 'clamp(26px, 2.4vw, 36px)',
  /** The big number on a proof card. */
  stat: 'clamp(40px, 3.6vw, 52px)',
  title: '21px',
  lead: '20px',
  body: '16px',
  small: '14px',
  micro: '12px',
};

/**
 * Vertical rhythm. Section padding ran 96 / 100 / 140 / 160px — near-misses
 * with no system behind them. Sections use `space.section`; the closing CTA
 * gets `space.sectionLg` because it is the one panel meant to feel roomier.
 */
export const space = {
  section: 112,
  sectionLg: 160,
};

/**
 * Both faces are self-hosted through next/font (see app/layout.js), which
 * generates the real family names at build time — so styles reference the
 * CSS variables it exposes rather than naming the fonts directly.
 */
export const font = {
  display: 'var(--font-display), sans-serif',
  body: 'var(--font-body), sans-serif',
};

/** The one easing curve the whole page moves on. */
export const EASE = 'cubic-bezier(0.2,0.7,0.2,1)';
