/** Presentation helpers shared by the routes and the components. */

/**
 * Human date, e.g. "14 August 2026".
 *
 * `timeZone: 'UTC'` is not cosmetic. Post dates are stored as UTC instants; if
 * the formatter is left to use the runtime's zone, the server (UTC) and a
 * reader's browser (anything) can format the SAME instant as two different
 * days, which React reports as a hydration mismatch and which shows a reader a
 * publish date one day off. Pinning it makes the string a pure function of the
 * input everywhere.
 */
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Machine date for <time dateTime>. Returns '' rather than 'Invalid Date'. */
export function isoDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Reading time in minutes at ~220wpm.
 *
 * Accepts HTML or plain text — tags are stripped first, because counting
 * `<figure class="wp-block-image">` as three words inflates the estimate on
 * image-heavy posts by a minute or more.
 */
export function readingTime(input) {
  const text = String(input || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Word count on the same stripped text, for the article's JSON-LD. */
export function wordCount(input) {
  const text = String(input || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Kebab-case slug from a title. */
export function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * A meta description from a body, when the author has not written one.
 *
 * Cut on a word boundary, not mid-word: Google renders the snippet it chooses
 * anyway, but a description ending "…the presenter reco" is what gets shown in
 * social cards, where there is no rewriting.
 */
export function excerptFrom(input, max = 160) {
  const text = String(input || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,.;:\s]+$/, '')}…`;
}

/** "3 min read" / "1 min read". */
export function readingLabel(minutes) {
  const m = Number(minutes) || 0;
  return m > 0 ? `${m} min read` : '';
}
