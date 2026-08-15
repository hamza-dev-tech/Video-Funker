/**
 * The only place WordPress I/O happens.
 *
 * Every clause of this contract is load-bearing:
 *
 *  · It THROWS on transport failure and on 5xx. It does not return empty.
 *    Returning empty renders a successful, EMPTY page, which Next then caches
 *    as a perfectly valid 200 — so one CMS blip turns the blog index into a
 *    blank page that Google crawls and de-indexes the articles from. Throwing
 *    makes Next serve the PREVIOUS cached page instead, which is exactly the
 *    behaviour you want from a CDN in front of a flaky origin.
 *
 *  · A 400 carrying rest_post_invalid_page_number means "you asked for page 9
 *    of 3", which is genuinely empty rather than broken. It resolves, it does
 *    not throw.
 *
 *  · `cache: 'force-cache'` is written explicitly because a bare fetch is
 *    UNCACHED in Next 15+. Relying on the old default silently turns every
 *    article render into a live round trip to WordPress.
 *
 *  · It retries at most once, and only on transport-shaped failures. A 4xx or
 *    a header-stripping proxy is deterministic: the second attempt returns the
 *    identical answer at double the latency.
 */

const WP = process.env.WP_API_URL || '';
const TIMEOUT_MS = Number(process.env.WP_TIMEOUT_MS || 8000);

/**
 * Bounded staleness for when the publish webhook is dead.
 *
 * Tag invalidation gives instant updates on the happy path, so the temptation
 * is `revalidate: false` — cache forever, let the webhook do the work. The
 * failure mode of that is silent and permanent: rotate the webhook secret,
 * firewall the CMS egress, change the URL in a deploy, and the blog freezes at
 * its last good snapshot with nothing to report it. This TTL only ever binds
 * when the webhook is already broken.
 */
const FALLBACK_TTL = Number(process.env.WP_FALLBACK_TTL || 3600);

const MAX_ATTEMPTS = 2;

export class WpUnavailableError extends Error {
  constructor(message, retryable = false) {
    super(message);
    this.name = 'WpUnavailableError';
    this.retryable = retryable;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} path e.g. `/wp/v2/posts?per_page=9`
 * @param {{tags: string[], revalidate?: number|false, timeoutMs?: number, requireTotals?: boolean}} opts
 * @returns {Promise<{data: any, total: number, totalPages: number}>}
 */
export async function wpFetch(path, opts) {
  const {
    tags,
    revalidate = FALLBACK_TTL,
    timeoutMs = TIMEOUT_MS,
    requireTotals = false,
  } = opts;

  if (!WP) throw new WpUnavailableError('WP_API_URL is not configured', false);

  let last = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await attemptFetch(path, { tags, revalidate, timeoutMs, requireTotals });
    } catch (e) {
      const err =
        e instanceof WpUnavailableError
          ? e
          : new WpUnavailableError(`WP unreachable ${path}: ${String(e)}`, true);
      last = err;
      if (!err.retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(150 + Math.random() * 350);
    }
  }
  throw last || new WpUnavailableError(`WP failed ${path}`);
}

async function attemptFetch(path, { tags, revalidate, timeoutMs, requireTotals }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${WP}${path}`, {
      signal: controller.signal,
      cache: 'force-cache',
      next: { tags, revalidate },
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    // A timeout and a dropped connection are both worth one more shot.
    throw new WpUnavailableError(
      e && e.name === 'AbortError'
        ? `WP timeout ${timeoutMs}ms: ${path}`
        : `WP unreachable ${path}: ${String(e)}`,
      true
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 400) return { data: [], total: 0, totalPages: 0 };
  if (res.status === 404) return { data: null, total: 0, totalPages: 0 };
  if (!res.ok) {
    // 5xx is retryable — a restarting php-fpm recovers in a couple hundred ms.
    throw new WpUnavailableError(`WP ${res.status} ${path}`, res.status >= 500);
  }

  const totalHeader = res.headers.get('x-wp-total');
  /**
   * X-WP-Total is a CUSTOM header, and any proxy in front of WordPress can
   * drop it. When it vanishes, `total` silently becomes 0 — which renders
   * pagination as a single page and truncates the sitemap enumeration after
   * page one. Both are invisible in the UI and catastrophic for crawling, so
   * the call sites that actually read `total` demand it rather than coping.
   *
   * Deliberately NOT retryable: a proxy that strips a header strips it every
   * time.
   */
  if (requireTotals && totalHeader === null) {
    throw new WpUnavailableError(
      `X-WP-Total missing on ${path} — a proxy is stripping it`,
      false
    );
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    // A truncated body is a transport failure wearing a 200.
    throw new WpUnavailableError(`WP bad JSON ${path}: ${String(e)}`, true);
  }

  return {
    data,
    total: Number(totalHeader || 0),
    totalPages: Number(res.headers.get('x-wp-totalpages') || 1),
  };
}

/**
 * Authenticated fetch — DRAFT PREVIEW ONLY, never on a public path.
 * `no-store` because a draft must not survive in any cache.
 */
export async function wpFetchPreview(path) {
  if (!WP || !process.env.WP_APP_USER) return null;
  const auth = Buffer.from(
    `${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`
  ).toString('base64');
  const res = await fetch(`${WP}${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });
  return res.ok ? res.json() : null;
}

/**
 * Coerce to an array, loudly-but-safely.
 *
 * The WP REST API answers a permission problem with an error OBJECT where the
 * caller expects a list — `{code: 'rest_forbidden', …}`. Calling `.map()` on
 * that throws, which turns a page that could have rendered without its category
 * pills into a 500. Every list read from a WP payload goes through here.
 */
export function asArray(value, context) {
  if (Array.isArray(value)) return value;
  if (value != null && process.env.NODE_ENV !== 'production') {
    console.warn(`[blog] expected an array at ${context}, got ${typeof value}`);
  }
  return [];
}
