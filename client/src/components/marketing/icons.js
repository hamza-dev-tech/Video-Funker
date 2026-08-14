/**
 * The page's icon set.
 *
 * Every icon here used to be a literal text character in content.js — `▶`,
 * `Aa`, `☰`, `✎`, `↗` on the deliverable chips and `✓`, `✕`, `~` in the
 * comparison table. Plus Jakarta Sans contains none of them, so each one was
 * resolved by whatever symbol font the OS happened to fall back to: measured
 * advance widths ranged 23–41px for glyphs meant to read as one family, and on
 * macOS and iOS several of them (`▶` and `✎` in particular) come through as
 * colour emoji.
 *
 * They are keyed by the original character so the copy in content.js stays
 * exactly as authored — the character is the lookup, not the rendering.
 */

const PATHS = {
  /* Finished videos */
  '▶': (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      <path d="M10 9.5 L14.75 12 L10 14.5 Z" fill="currentColor" stroke="none" />
    </>
  ),
  /* LinkedIn posts — a drafted block of copy */
  Aa: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M7.5 9h9M7.5 12.5h9M7.5 16h5" />
    </>
  ),
  /* Carousel creative — stacked slides */
  '☰': (
    <>
      <rect x="7.5" y="4.5" width="13" height="15" rx="3" />
      <path d="M4.5 7.5v9" />
      <path d="M1.5 9.5v5" />
    </>
  ),
  /* Long-form articles */
  '✎': (
    <>
      <path d="M4 20h3.5l9.6-9.6a2.47 2.47 0 0 0-3.5-3.5L4 16.5Z" />
      <path d="M13.2 8.1l3.2 3.2" />
    </>
  ),
  /* Outreach support */
  '↗': (
    <>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  /* Comparison table */
  '✓': <path d="M5 12.5 9.5 17 19 7" />,
  '✕': <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  '~': <path d="M5 12h14" />,
};

/** Accessible names for the comparison table's three states. */
export const COMPARE_LABELS = {
  '✓': 'Yes',
  '✕': 'No',
  '~': 'Partly',
};

/**
 * @param {string} name  the original glyph character, used as the key
 * @param {number} [size=24]
 * @param {string} [label]  when set the icon is exposed to assistive tech with
 *   this name; when omitted it is decorative and hidden
 */
export default function Icon({ name, size = 24, label, strokeWidth = 1.9, style }) {
  const d = PATHS[name];
  if (!d) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
      style={{ display: 'block', flex: 'none', ...style }}
    >
      {d}
    </svg>
  );
}
