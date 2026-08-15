/**
 * The headless-WordPress content source.
 *
 * Same interface as local.js, so `source.js` can swap between them with no
 * caller aware of the difference. Everything here that looks like paranoia is
 * a failure we have actually watched happen to a WP-backed blog.
 *
 * ─── Cache-tag vocabulary ───────────────────────────────────────────────────
 * This is a FIXED CONTRACT shared with the WordPress side and /api/revalidate.
 * Every tag subscribed to below must be emitted by the publish hook, and every
 * tag the hook emits must be subscribed to here. A tag nothing emits can never
 * be purged, which is a silent permanent freeze on that surface — and the
 * classic way it hides is behind a global "purge everything" tag that sweeps it
 * up by accident. There is deliberately no such global tag.
 *
 *   wp:list             anything rendering a LIST of posts
 *   wp:sitemap          sitemap and slug enumeration
 *   wp:redirects        the old-slug index
 *   wp:taxonomies       the term vocabulary itself
 *   wp:post:{slug}      one article body
 *   wp:category:{slug}  one category archive
 *   wp:tag:{slug}       one tag archive
 */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { decode } from 'html-entities';

import { wpFetch, asArray } from './wp';
import { renderPostHtml } from './html';
import { readingTime, wordCount, excerptFrom } from './format';
import { scoreRelated } from './relevance';

export const POSTS_PER_PAGE = 9;

const T_LIST = 'wp:list';
const T_SITEMAP = 'wp:sitemap';
const T_REDIRECTS = 'wp:redirects';
const T_TAXONOMIES = 'wp:taxonomies';
const tPost = (slug) => `wp:post:${slug}`;
const tCategory = (slug) => `wp:category:${slug}`;
const tTag = (slug) => `wp:tag:${slug}`;

/**
 * Wall-clock ceiling for the enumeration loops below.
 *
 * Raising the per-request timeout is the wrong lever — it would let one slow
 * embed hang every reader path. This bounds only the loops that legitimately
 * make up to twenty sequential requests.
 */
const LOOP_BUDGET_MS = 45_000;

/**
 * `_fields` and `_embed` FIGHT each other. If you pass `_fields` you MUST list
 * `_links` and `_embedded` too, or WordPress has nothing to embed from and
 * `_embedded` comes back empty — which silently removes every cover image,
 * category pill and tag from the listing while the request still returns 200.
 */
const LIST_FIELDS = 'id,slug,title,excerpt,date_gmt,modified_gmt,categories,tags,vf,_links,_embedded';
const EMBED = 'wp:featuredmedia,wp:term';

/* ──────────────────────────── mapping ──────────────────────────── */

const strip = (s = '') => String(s).replace(/<[^>]*>/g, '').replace(/\[(?:…|\.\.\.)\]/g, '').trim();
const text = (s = '') => decode(strip(s));
const plain = (s = '') => decode(String(s).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
/** WP dates are UTC but carry no zone marker; without the Z they parse as local. */
const utc = (gmt) => (gmt ? `${gmt}Z` : null);

function media(p) {
  const m = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
  // A `code` property means WP answered with an error object (rest_forbidden)
  // where a media object was expected — a private or deleted attachment.
  if (!m || m.code) return { url: null, alt: null };
  const sizes = m.media_details && m.media_details.sizes;
  return {
    url: (sizes && sizes.large && sizes.large.source_url) || m.source_url || null,
    alt: m.alt_text || null,
  };
}

function terms(p) {
  /**
   * Select by `taxonomy`, NEVER by position.
   *
   * `groups[0]` / `groups[1]` relies on get_object_taxonomies() ordering, which
   * is an accident of core registering `category` before `post_tag` at init
   * priority 0 — not a contract. Any taxonomy registered earlier, or a
   * register_taxonomy_for_object_type() re-attach, silently swaps them, and a
   * wrong articleSection is wrong without ever throwing.
   *
   * asArray at BOTH levels: a forbidden group arrives as an error object, and
   * .flat() on a non-array throws — a 500 on a page that could have rendered
   * perfectly well without its pills.
   */
  const groups = asArray(p._embedded && p._embedded['wp:term'], `${p.slug}:wp:term`);
  const flat = groups.flatMap((g) => asArray(g, `${p.slug}:wp:term[]`));
  const cats = flat.filter((t) => t && t.taxonomy === 'category' && t.slug !== 'uncategorized');
  const tags = flat.filter((t) => t && t.taxonomy === 'post_tag');
  return {
    category: cats[0] ? { slug: cats[0].slug, name: decode(cats[0].name || '') } : null,
    tags: tags.map((t) => decode(t.name || '')),
  };
}

/**
 * `modified_gmt` maps to post_modified, which bumps on a typo fix, a category
 * reassignment, or any metabox touch. dateModified is a claim to the reader and
 * to Google that the content changed, so prefer a content-derived timestamp
 * when the CMS supplies one (a small mu-plugin can set `vf.content_modified`).
 *
 * The fallback is modified_gmt, NOT date_gmt: falling back to published would
 * erase every legitimate historical edit on posts predating the field.
 */
function contentModified(p) {
  return utc(p.vf && p.vf.content_modified) || utc(p.modified_gmt) || utc(p.date_gmt);
}

/**
 * A dateModified earlier than datePublished is not a hard validator error, but
 * Google discounts or mis-displays it. Emit published instead.
 */
function clampModified(modified, published) {
  if (!modified) return published;
  if (published && modified < published) return published;
  return modified;
}

function authorOf(p) {
  const a = (p.vf && p.vf.author) || {};
  return {
    name: a.name || 'The Video Funker team',
    title: a.title || null,
    bio: a.bio || null,
    avatar: a.avatar || null,
    // Only when the CMS supplies a real, live URL. An author link to a page
    // that does not exist is worse than no link at all.
    url: a.url || null,
    // Defaults to Organization when the CMS names nobody, because the fallback
    // byline above is the company rather than a person.
    type: a.type || (a.name ? 'Person' : 'Organization'),
  };
}

/** @returns {import('./types').PostCard} */
function toCard(p) {
  const { category, tags } = terms(p);
  const cover = media(p);
  const title = text(p.title && p.title.rendered);
  return {
    slug: p.slug,
    title,
    excerpt: text(p.excerpt && p.excerpt.rendered) || null,
    coverImage: cover.url,
    coverAlt: cover.alt || title,
    readingMinutes: (p.vf && p.vf.reading_time) || readingTime(p.excerpt && p.excerpt.rendered) || null,
    publishedAt: utc(p.date_gmt),
    updatedAt: clampModified(contentModified(p), utc(p.date_gmt)),
    category,
    tags,
    author: authorOf(p),
  };
}

/** @returns {Promise<import('./types').Post>} */
async function toPost(p) {
  const raw = (p.content && p.content.rendered) || '';
  const { html, headings } = await renderPostHtml(raw);
  const card = toCard(p);
  const yoast = p.yoast_head_json || {};

  return {
    ...card,
    id: String(p.id),
    body: html,
    headings,
    readingMinutes: (p.vf && p.vf.reading_time) || readingTime(raw),
    categoryId: p.categories && p.categories[0] != null ? p.categories[0] : null,
    seoTitle: yoast.title || null,
    seoDescription: yoast.description || card.excerpt || excerptFrom(raw),
    /**
     * ─── NON-NEGOTIABLE ────────────────────────────────────────────────────
     * canonicalUrl and ogImageUrl are ALWAYS null. Next computes both from the
     * public route.
     *
     * Yoast emits a canonical pointing at the CMS host. The article route does
     * `canonical: post.canonicalUrl ?? url` and passes it through unvalidated,
     * so mapping Yoast's value here would canonicalise the entire public blog
     * to the CMS origin and de-index every article on the real domain. This is
     * the single most damaging line that could be "helpfully" filled in.
     * ───────────────────────────────────────────────────────────────────────
     */
    canonicalUrl: null,
    ogImageUrl: null,
    wordCount: wordCount(raw),
  };
}

function toTermInfo(t) {
  return {
    id: t.id,
    slug: t.slug,
    name: decode(t.name || ''),
    description: plain(t.description),
    count: t.count || 0,
    parent: t.parent || 0,
  };
}

/* ──────────────────────────── terms ──────────────────────────── */

/**
 * Paginated term fetch.
 *
 * per_page is capped at 100 by WP core. Fetching exactly one page with no loop
 * is the default mistake, and because the query is `orderby=count&order=desc`
 * the terms lost past 100 are the LOWEST-count ones. For tags that is a
 * correctness bug — the resolver finds nothing and a real archive renders as
 * "not found". For categories it is worse: a dropped PARENT orphans its whole
 * populated child branch out of the topic hub.
 */
async function fetchAllTerms(base, fields) {
  const out = [];
  const deadline = Date.now() + LOOP_BUDGET_MS;
  for (let page = 1; page <= 10; page += 1) {
    const { data, totalPages } = await wpFetch(`${base}&per_page=100&page=${page}&_fields=${fields}`, {
      tags: [T_TAXONOMIES],
    });
    const rows = asArray(data, 'fetchAllTerms');
    if (!rows.length) break;
    out.push(...rows);
    // Two independent stop conditions: a short page ends the loop even when a
    // proxy has stripped the totals header entirely.
    if (rows.length < 100) break;
    if (totalPages && page >= totalPages) break;
    if (Date.now() > deadline) break;
  }
  return out;
}

const CAT_FIELDS = 'id,name,slug,description,count,parent';
const TAG_FIELDS = 'id,name,slug,description,count';

/**
 * `cache()` because one archive render asks for terms three separate times
 * (resolve the term, list its posts, render the nav), each otherwise re-parsing
 * the same payload.
 *
 * `includeEmpty` is routed by PURPOSE, not by convenience. Resolution paths
 * pass true so a real-but-empty term resolves to its own archive instead of a
 * bare 404 — otherwise an editor creates a category, visits its URL, and
 * concludes the site is broken. Navigation and the prerender set pass false, so
 * empty categories never surface to readers as dead links.
 */
const getCategoryTerms = cache(async (includeEmpty = false) => {
  const all = await fetchAllTerms(
    `/wp/v2/categories?hide_empty=${includeEmpty ? 'false' : 'true'}&orderby=count&order=desc`,
    CAT_FIELDS
  );
  return all.filter((t) => t.slug !== 'uncategorized');
});

const getTagTerms = cache(async (includeEmpty = false) =>
  fetchAllTerms(
    `/wp/v2/tags?hide_empty=${includeEmpty ? 'false' : 'true'}&orderby=count&order=desc`,
    TAG_FIELDS
  )
);

export async function getCategories({ includeEmpty = false } = {}) {
  try {
    return (await getCategoryTerms(includeEmpty)).map(toTermInfo);
  } catch {
    /**
     * Empty, never a hardcoded stand-in list.
     *
     * A fallback list of "probable" category slugs means that exactly when the
     * CMS is unreachable, the nav fills with chips that each lead to a 404 — a
     * dead end presented as navigation. Every consumer renders correctly with
     * no categories, so showing none is the honest degraded state.
     */
    return [];
  }
}

export async function getCategory(slug) {
  try {
    const t = (await getCategoryTerms(true)).find((x) => x.slug === slug);
    return t ? toTermInfo(t) : null;
  } catch {
    return null;
  }
}

export async function getCategoryTree() {
  try {
    const all = (await getCategoryTerms(true)).map(toTermInfo);
    return all
      .filter((c) => c.parent === 0)
      .map((c) => ({ ...c, children: all.filter((k) => k.parent === c.id && k.count > 0) }))
      .filter((c) => c.count > 0 || c.children.length > 0);
  } catch {
    return [];
  }
}

export async function getTags() {
  try {
    return (await getTagTerms()).map(toTermInfo);
  } catch {
    return [];
  }
}

export async function getTag(slug) {
  try {
    const t = (await getTagTerms(true)).find((x) => x.slug === slug);
    return t ? toTermInfo(t) : null;
  } catch {
    return null;
  }
}

/* ─────────────────────────── queries ─────────────────────────── */

export async function listPosts(page = 1) {
  const { data, total } = await wpFetch(
    `/wp/v2/posts?status=publish&per_page=${POSTS_PER_PAGE}&page=${page}` +
      `&orderby=date&order=desc&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST], requireTotals: true }
  );
  return { posts: asArray(data, 'listPosts').map(toCard), total };
}

/**
 * `cache()`d because the article route calls this TWICE per render — once in
 * generateMetadata and once in the page body. The fetch itself is deduped by
 * Next's data cache, but `toPost()` is not, and it awaits a full unified
 * parse/sanitize/slug/stringify over the entire article. That is the dominant
 * CPU cost of an article render, and without this it runs twice.
 */
export const getPost = cache(async (slug) => {
  // `?slug=` returns an ARRAY (possibly empty); there is no /posts/by-slug.
  // `_embed=1`, not `_embed=` — an empty value is dropped by WP and the post
  // renders with no image, no category and no tags.
  const { data } = await wpFetch(
    `/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish&per_page=1&_embed=1`,
    // wp:post:{slug} ALONE. A single article has no list to go stale, and
    // subscribing it to wp:list would make every unrelated publish purge every
    // article body on the site.
    { tags: [tPost(slug)] }
  );
  const rows = asArray(data, `getPost:${slug}`);
  return rows[0] ? toPost(rows[0]) : null;
});

export async function getPostCard(slug) {
  const { data } = await wpFetch(
    `/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish&per_page=1` +
      `&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST, tPost(slug)] }
  );
  const rows = asArray(data, `getPostCard:${slug}`);
  return rows[0] ? toCard(rows[0]) : null;
}

export async function listByCategory(slug, page = 1) {
  const term = (await getCategoryTerms(true)).find((t) => t.slug === slug);
  if (!term) return { posts: [], total: 0, category: null };

  const { data, total } = await wpFetch(
    `/wp/v2/posts?status=publish&categories=${term.id}&per_page=${POSTS_PER_PAGE}&page=${page}` +
      `&orderby=date&order=desc&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST, tCategory(slug)], requireTotals: true }
  );
  return {
    posts: asArray(data, `listByCategory:${slug}`).map(toCard),
    total,
    category: toTermInfo(term),
  };
}

export async function listByTag(slug, page = 1) {
  const term = (await getTagTerms(true)).find((t) => t.slug === slug);
  if (!term) return { posts: [], total: 0, tag: null };

  const { data, total } = await wpFetch(
    `/wp/v2/posts?status=publish&tags=${term.id}&per_page=${POSTS_PER_PAGE}&page=${page}` +
      `&orderby=date&order=desc&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST, tTag(slug)], requireTotals: true }
  );
  return { posts: asArray(data, `listByTag:${slug}`).map(toCard), total, tag: toTermInfo(term) };
}

/**
 * Search is DELIBERATELY UNTAGGED, and this is a security decision rather than
 * an oversight.
 *
 * The query string is unbounded user input. Attaching a cache tag to it would
 * let anyone mint unlimited cache entries by walking random queries, and would
 * let one publish webhook fan an invalidation out across that unbounded set.
 * A short TTL gives the same practical benefit with none of that.
 */
export async function search(query, page = 1) {
  const q = String(query || '').trim().slice(0, 120);
  if (q.length < 2) return { posts: [], total: 0 };

  const { data, total } = await wpFetch(
    `/wp/v2/posts?status=publish&search=${encodeURIComponent(q)}` +
      `&per_page=${POSTS_PER_PAGE}&page=${page}&orderby=relevance` +
      `&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [], revalidate: 300, requireTotals: true }
  );
  return { posts: asArray(data, 'search').map(toCard), total };
}

export async function getRecent(limit = 20) {
  const { data } = await wpFetch(
    `/wp/v2/posts?status=publish&per_page=${Math.min(limit, 100)}&orderby=date&order=desc` +
      `&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST] }
  );
  return asArray(data, 'getRecent').map(toCard);
}

/* ─────────────────────── relatedness ─────────────────────── */

/**
 * Term membership for every published post, in one cached pass.
 *
 * Its own narrow `_fields` — no `_embed`. This index only needs ids, and
 * pulling embeds would make it heavier than the article render it exists to
 * accelerate.
 */
const taxonomyIndex = unstable_cache(
  async () => {
    const out = [];
    const deadline = Date.now() + LOOP_BUDGET_MS;
    for (let page = 1; page <= 20; page += 1) {
      const { data, totalPages } = await wpFetch(
        `/wp/v2/posts?status=publish&per_page=100&page=${page}` +
          `&orderby=date&order=desc&_fields=id,slug,categories,tags`,
        { tags: [T_LIST] }
      );
      const rows = asArray(data, 'taxonomyIndex');
      if (!rows.length) break;
      for (const p of rows) {
        out.push({
          id: p.id,
          slug: p.slug,
          categories: asArray(p.categories, 'taxIndex.categories'),
          tags: asArray(p.tags, 'taxIndex.tags'),
          rank: out.length,
        });
      }
      if (rows.length < 100) break;
      if (totalPages && page >= totalPages) break;
      if (Date.now() > deadline) break;
    }
    return out;
  },
  ['vf-wp-taxonomy-index'],
  { tags: [T_LIST], revalidate: 3600 }
);

/** `orderby=include` is what stops WP re-sorting the winners back into date order. */
async function fetchByIds(ids, limit) {
  if (!ids.length) return [];
  const { data } = await wpFetch(
    `/wp/v2/posts?status=publish&include=${ids.join(',')}&orderby=include` +
      `&per_page=${limit}&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST] }
  );
  return asArray(data, 'fetchByIds').map(toCard);
}

/** The pre-scoring behaviour, kept only as the cold-cache fallback. */
async function relatedByRecency(categoryId, excludeSlug, limit) {
  if (!categoryId) return [];
  // WP cannot exclude by slug (`exclude` takes ids). Over-fetch by one, filter.
  const { data } = await wpFetch(
    `/wp/v2/posts?status=publish&categories=${categoryId}&per_page=${limit + 1}` +
      `&orderby=date&order=desc&_embed=${EMBED}&_fields=${LIST_FIELDS}`,
    { tags: [T_LIST] }
  );
  return asArray(data, 'relatedByRecency')
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, limit)
    .map(toCard);
}

export async function getRelated(slug, limit = 3, categoryId = null) {
  try {
    const index = await taxonomyIndex();
    const current = index.find((r) => r.slug === slug);
    // Published inside the cache window, or the index came back empty. The rail
    // must never render empty just because a cache was cold.
    if (!current) return relatedByRecency(categoryId, slug, limit);

    const winners = scoreRelated(current, index, limit);
    if (!winners.length) return relatedByRecency(categoryId, slug, limit);

    const posts = await fetchByIds(winners.map((w) => w.id), limit);
    return posts.length ? posts : relatedByRecency(categoryId, slug, limit);
  } catch {
    // A relevance optimisation must never take the article down with it.
    try {
      return await relatedByRecency(categoryId, slug, limit);
    } catch {
      return [];
    }
  }
}

/**
 * Over-fetches by one and filters by slug: WP's before/after compare against
 * post_date in SITE timezone while publishedAt comes from date_gmt, so an
 * eight-hour skew can otherwise return the current post as its own neighbour.
 */
export async function getAdjacent(slug, categoryId = null, publishedAt = null) {
  if (!categoryId || !publishedAt) return { prev: null, next: null };

  const base =
    `/wp/v2/posts?status=publish&categories=${categoryId}&per_page=2` +
    `&_embed=${EMBED}&_fields=${LIST_FIELDS}`;
  const pick = (data) =>
    asArray(data, 'getAdjacent')
      .filter((p) => p.slug !== slug)
      .map(toCard)[0] || null;

  try {
    const [older, newer] = await Promise.all([
      wpFetch(`${base}&before=${encodeURIComponent(publishedAt)}&orderby=date&order=desc`, { tags: [T_LIST] }),
      wpFetch(`${base}&after=${encodeURIComponent(publishedAt)}&orderby=date&order=asc`, { tags: [T_LIST] }),
    ]);
    return { prev: pick(older.data), next: pick(newer.data) };
  } catch {
    // Navigation furniture must never take the article down with it.
    return { prev: null, next: null };
  }
}

/* ─────────────────────── enumeration ─────────────────────── */

export async function getAllSlugs() {
  const out = [];
  try {
    const deadline = Date.now() + LOOP_BUDGET_MS;
    for (let page = 1; page <= 20; page += 1) {
      const { data, totalPages } = await wpFetch(
        `/wp/v2/posts?status=publish&per_page=100&page=${page}&_fields=slug`,
        { tags: [T_SITEMAP], requireTotals: true }
      );
      const rows = asArray(data, 'getAllSlugs');
      if (!rows.length) break;
      out.push(...rows.map((p) => p.slug));
      if (rows.length < 100) break;
      if (totalPages && page >= totalPages) break;
      if (Date.now() > deadline) break;
    }
  } catch {
    // Genuinely safe to return short: dynamicParams renders the rest on demand.
    return out;
  }
  return out;
}

export async function getSitemapEntries() {
  const rows = [];
  try {
    const deadline = Date.now() + LOOP_BUDGET_MS;
    for (let page = 1; page <= 20; page += 1) {
      const { data, totalPages } = await wpFetch(
        `/wp/v2/posts?status=publish&per_page=100&page=${page}` +
          // `vf` and `date_gmt` are here so the sitemap's lastmod uses the SAME
          // content-modified resolution as the article's dateModified.
          // Publishing two different modified dates for one URL is worse than
          // publishing none: lastmod is the signal Google acts on for recrawl,
          // and a contradicted one gets the whole site's lastmod discounted.
          `&_embed=wp:featuredmedia&_fields=slug,date_gmt,modified_gmt,vf,categories,_links,_embedded`,
        { tags: [T_SITEMAP], requireTotals: true }
      );
      const pageRows = asArray(data, 'getSitemapEntries');
      if (!pageRows.length) break;
      for (const p of pageRows) {
        const cover = media(p);
        const lastModified = clampModified(contentModified(p), utc(p.date_gmt));
        if (!lastModified) continue;
        rows.push({
          slug: p.slug,
          lastModified,
          images: cover.url ? [cover.url] : [],
          cats: asArray(p.categories, 'sitemap.categories'),
        });
      }
      if (pageRows.length < 100) break;
      if (totalPages && page >= totalPages) break;
      if (Date.now() > deadline) break;
    }

    const terms = await getCategoryTerms();
    const newest = new Map();
    for (const r of rows) {
      for (const c of r.cats) {
        const cur = newest.get(c);
        if (!cur || r.lastModified > cur) newest.set(c, r.lastModified);
      }
    }

    return {
      posts: rows.map(({ slug, lastModified, images }) => ({ slug, lastModified, images })),
      categories: terms.map((t) => ({ slug: t.slug, lastModified: newest.get(t.id) })),
    };
  } catch {
    return { posts: rows.map(({ slug, lastModified, images }) => ({ slug, lastModified, images })), categories: [] };
  }
}

/**
 * old slug -> current slug, for every published post.
 *
 * Built once and cached under wp:redirects. WordPress accumulates every
 * historical slug in _wp_old_slug, so a post renamed a → b → c maps BOTH a and
 * b to c: renames resolve in one hop with no redirect chain.
 *
 * Consulted ONLY on the 404 path, so it costs nothing on the happy path.
 */
const oldSlugIndex = unstable_cache(
  async () => {
    const map = {};
    const deadline = Date.now() + LOOP_BUDGET_MS;
    for (let page = 1; page <= 20; page += 1) {
      const { data, totalPages } = await wpFetch(
        `/wp/v2/posts?status=publish&per_page=100&page=${page}&_fields=slug,vf`,
        { tags: [T_REDIRECTS], requireTotals: true }
      );
      const rows = asArray(data, 'oldSlugIndex');
      if (!rows.length) break;
      for (const p of rows) {
        for (const old of asArray(p.vf && p.vf.old_slugs, 'oldSlugIndex.old_slugs')) map[old] = p.slug;
      }
      if (rows.length < 100) break;
      if (totalPages && page >= totalPages) break;
      if (Date.now() > deadline) break;
    }
    return map;
  },
  ['vf-wp-old-slug-index'],
  { tags: [T_REDIRECTS], revalidate: 3600 }
);

export async function resolveOldSlug(oldSlug) {
  try {
    return (await oldSlugIndex())[oldSlug] || null;
  } catch {
    // A redirect lookup must never turn a clean 404 into a 500.
    return null;
  }
}

/**
 * A term slug that matched no live term.
 *
 * Collision guard first: if the slug now belongs to a DIFFERENT live term,
 * return null so the caller serves that live term rather than redirecting away
 * from a page that exists.
 */
export async function resolveTermRedirect(slug, taxonomy = 'category') {
  try {
    const live = taxonomy === 'category' ? await getCategoryTerms(true) : await getTagTerms(true);
    if (live.some((t) => t.slug === slug)) return null;
    const map = await oldSlugIndex();
    return map[slug] ? { kind: 'renamed', slug: map[slug] } : null;
  } catch {
    return null;
  }
}
