import crypto from 'node:crypto';
import { revalidateTag } from 'next/cache';

/**
 * The publish webhook.
 *
 * WordPress calls this when a post is published, updated, trashed or renamed,
 * and it purges exactly the cache tags that content belongs to. Without it the
 * blog serves whatever it cached until WP_FALLBACK_TTL expires — an hour by
 * default — so "publish" would not mean live.
 *
 * ─── The tag contract ───────────────────────────────────────────────────────
 * The names below are a FIXED CONTRACT shared with src/lib/blog/wordpress.js.
 * Every tag this route can purge is subscribed to over there, and every tag
 * subscribed over there can be purged here. Break that in either direction and
 * the failure is silent: a tag nothing purges is a surface frozen forever, and
 * a tag nothing subscribes to is a purge that does nothing.
 *
 * There is deliberately NO global "purge everything" tag. It looks like cheap
 * insurance and it is the opposite — it masks exactly the mismatch described
 * above, because every surface gets swept up by accident and nobody discovers
 * the broken tag until the day the global one is removed.
 */

const SECRET = process.env.REVALIDATE_SECRET || '';

/** How far a request's timestamp may be from ours. */
const MAX_SKEW_MS = 5 * 60 * 1000;

/**
 * Constant-time comparison.
 *
 * `a === b` on a secret leaks its length and its prefix through timing. That is
 * a real attack against a webhook an attacker can call as often as they like.
 * timingSafeEqual throws on a length mismatch, so the lengths are checked first
 * — and checking length separately is fine, because the length of an HMAC-SHA256
 * digest is public knowledge anyway.
 */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  if (!SECRET) {
    // Never fail open. An unconfigured secret means anyone who finds this URL
    // can force unlimited cache purges, which is a free denial-of-service
    // against both this app and the WordPress box behind it.
    return Response.json({ error: 'not configured' }, { status: 503 });
  }

  const raw = await request.text();
  const timestamp = request.headers.get('x-vf-timestamp') || '';
  const signature = request.headers.get('x-vf-signature') || '';

  /**
   * The timestamp is INSIDE the signed payload, not merely alongside it.
   *
   * Signing the body alone gives an attacker who captures one valid request a
   * token they can replay forever. Signing "{timestamp}.{body}" and then
   * rejecting old timestamps bounds the replay window to MAX_SKEW_MS, because
   * changing the timestamp invalidates the signature.
   */
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!timestamp || Number.isNaN(age) || age > MAX_SKEW_MS) {
    return Response.json({ error: 'stale or missing timestamp' }, { status: 401 });
  }

  const expected = crypto.createHmac('sha256', SECRET).update(`${timestamp}.${raw}`).digest('hex');
  if (!safeEqual(signature, expected)) {
    return Response.json({ error: 'bad signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
  }

  const { slug, categories = [], tags = [], event = 'update' } = payload;

  const purged = new Set();
  const purge = (tag) => {
    if (!tag) return;
    revalidateTag(tag);
    purged.add(tag);
  };

  // Any list that could contain this post.
  purge('wp:list');
  // Sitemap enumeration and the slug set.
  purge('wp:sitemap');

  if (slug) purge(`wp:post:${slug}`);
  for (const c of Array.isArray(categories) ? categories : []) purge(`wp:category:${c}`);
  for (const t of Array.isArray(tags) ? tags : []) purge(`wp:tag:${t}`);

  /**
   * Term membership and the redirect index only change on structural events, so
   * they are not purged on every routine content edit — those two indexes are
   * the expensive ones to rebuild (they enumerate every published post) and
   * purging them on a typo fix means rebuilding the whole corpus index because
   * somebody fixed a comma.
   */
  if (event === 'delete' || event === 'rename' || event === 'terms') {
    purge('wp:redirects');
    purge('wp:taxonomies');
  }

  return Response.json({ revalidated: [...purged], now: Date.now() });
}

/**
 * GET is defined only so that hitting the URL in a browser returns something
 * honest. It must never revalidate: a GET that mutates cache state is
 * reachable by any crawler, any link preview and any prefetch.
 */
export async function GET() {
  return Response.json({ error: 'POST with a signature' }, { status: 405 });
}
