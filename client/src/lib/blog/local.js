/**
 * The in-repo content source.
 *
 * This exists so the blog is a working, indexable, fully-rendered product with
 * no CMS provisioned and no environment variables set — which is the state the
 * site is in today. It implements exactly the same interface as wordpress.js,
 * so switching over is one environment variable and zero code changes.
 *
 * It is not a stub. Pagination, term resolution, search, relatedness, adjacency
 * and the sitemap enumeration all behave the way their WordPress counterparts
 * do, because the whole point of a seam like this is that the thing on the
 * other side of it does not get to be special.
 */

import { cache } from 'react';

import { posts as rawPosts, categories as rawCategories, authors, defaultAuthor } from '@/content/blog';
import { renderPostHtml } from './html';
import { readingTime, slugify, wordCount, excerptFrom } from './format';
import { paginate, scoreRelated } from './relevance';

export const POSTS_PER_PAGE = 9;

/* ─────────────────────────── normalisation ─────────────────────────── */

const byDateDesc = (a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt));

/** Posts in feed order, with everything derivable already derived. */
const ordered = () =>
  [...rawPosts]
    .filter((p) => p.draft !== true)
    .sort(byDateDesc)
    .map((p, index) => ({ ...p, rank: index }));

const categoryBySlug = new Map(rawCategories.map((c) => [c.slug, c]));

/**
 * Tags are strings on a post and terms in the UI, so the id has to come from
 * somewhere. It is derived from the slug rather than assigned by hand: a
 * hand-maintained id table is one more thing that can drift out of sync with
 * the tag it names, and nothing outside this module ever reads the value.
 */
/**
 * The SAME slugify the article page uses to build its tag links. If these two
 * ever diverge, every tag link on every article points at an archive that
 * resolves to nothing — a 404 that no test would catch because both halves
 * look correct in isolation.
 */
const tagSlug = slugify;

const tagId = (slug) => {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) % 100000;
  // Offset past the category id space so a tag and a category can never
  // collide in the relatedness scorer, which sees both as opaque numbers.
  return 1000 + h;
};

function authorOf(post) {
  const a = authors[post.author] || defaultAuthor;
  // `type` carries through so the article graph can tell a team byline from a
  // named human. Defaults to Person, which is what a byline usually is.
  return { name: a.name, title: a.title, bio: a.bio, avatar: a.avatar, url: a.url, type: a.type || 'Person' };
}

/** @returns {import('./types').PostCard} */
function toCard(post) {
  const category = categoryBySlug.get(post.category) || null;
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || excerptFrom(post.body),
    coverImage: post.cover || null,
    coverAlt: post.coverAlt || null,
    readingMinutes: readingTime(post.body),
    publishedAt: post.publishedAt || null,
    // Falls back to publishedAt rather than null: a post that has never been
    // edited was last modified when it was written, and an absent dateModified
    // makes some consumers treat the page as undated.
    updatedAt: post.updatedAt || post.publishedAt || null,
    category: category ? { slug: category.slug, name: category.name } : null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    author: authorOf(post),
  };
}

/**
 * The HTML pipeline is the expensive part of rendering an article — a full
 * parse, sanitize, slug and stringify over the whole body. `cache()` dedupes it
 * within a request (the article route asks for the post twice: once in
 * generateMetadata, once in the body), and the module-level Map keeps it across
 * requests, which is safe here because the input is a build-time constant.
 */
const renderedBodies = new Map();

const renderBody = cache(async (slug, body) => {
  if (renderedBodies.has(slug)) return renderedBodies.get(slug);
  const result = await renderPostHtml(body);
  renderedBodies.set(slug, result);
  return result;
});

/** @returns {Promise<import('./types').Post>} */
async function toPost(post) {
  const { html, headings } = await renderBody(post.slug, post.body);
  const category = categoryBySlug.get(post.category) || null;
  return {
    ...toCard(post),
    id: post.slug,
    body: html,
    headings,
    categoryId: category ? category.id : null,
    seoTitle: post.seoTitle || null,
    seoDescription: post.seoDescription || post.excerpt || null,
    // Always null, both of them. The article route computes the canonical from
    // the request path and the OG image from its own route, and a value here
    // would override both. See the note in wordpress.js — that is where the
    // temptation actually lives.
    canonicalUrl: null,
    ogImageUrl: null,
    wordCount: wordCount(post.body),
  };
}

/* ────────────────────────────── terms ────────────────────────────── */

function categoryCounts() {
  const counts = new Map();
  for (const p of rawPosts) counts.set(p.category, (counts.get(p.category) || 0) + 1);
  return counts;
}

/** @returns {import('./types').TermInfo[]} */
export async function getCategories({ includeEmpty = false } = {}) {
  const counts = categoryCounts();
  return rawCategories
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description || '',
      count: counts.get(c.slug) || 0,
      parent: c.parent || 0,
    }))
    .filter((c) => includeEmpty || c.count > 0);
}

export async function getCategory(slug) {
  // includeEmpty: a category that exists but has no posts yet must resolve to
  // its own (empty) archive rather than a bare 404, which reads to an editor as
  // "the category I just made is broken".
  const all = await getCategories({ includeEmpty: true });
  return all.find((c) => c.slug === slug) || null;
}

export async function getCategoryTree() {
  const all = await getCategories({ includeEmpty: true });
  return all
    .filter((c) => c.parent === 0)
    .map((c) => ({ ...c, children: all.filter((k) => k.parent === c.id && k.count > 0) }))
    // Keep a root only if it has posts of its own or a populated child.
    // Without this, includeEmpty above would surface genuinely empty topics.
    .filter((c) => c.count > 0 || c.children.length > 0);
}

export async function getTags() {
  const counts = new Map();
  for (const p of rawPosts) {
    for (const t of p.tags || []) {
      const slug = tagSlug(t);
      const row = counts.get(slug) || { id: tagId(slug), slug, name: t, description: '', count: 0, parent: 0 };
      row.count += 1;
      counts.set(slug, row);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getTag(slug) {
  return (await getTags()).find((t) => t.slug === slug) || null;
}

/* ───────────────────────────── queries ───────────────────────────── */

export async function listPosts(page = 1) {
  const { items, total } = paginate(ordered(), page, POSTS_PER_PAGE);
  return { posts: items.map(toCard), total };
}

export async function getPost(slug) {
  const found = ordered().find((p) => p.slug === slug);
  return found ? toPost(found) : null;
}

/** Cheap variant for the OG image route: no HTML pipeline, no body. */
export async function getPostCard(slug) {
  const found = ordered().find((p) => p.slug === slug);
  return found ? toCard(found) : null;
}

export async function listByCategory(slug, page = 1) {
  const category = await getCategory(slug);
  if (!category) return { posts: [], total: 0, category: null };
  const { items, total } = paginate(
    ordered().filter((p) => p.category === slug),
    page,
    POSTS_PER_PAGE
  );
  return { posts: items.map(toCard), total, category };
}

export async function listByTag(slug, page = 1) {
  const tag = await getTag(slug);
  if (!tag) return { posts: [], total: 0, tag: null };
  const { items, total } = paginate(
    ordered().filter((p) => (p.tags || []).some((t) => tagSlug(t) === slug)),
    page,
    POSTS_PER_PAGE
  );
  return { posts: items.map(toCard), total, tag };
}

/**
 * Search.
 *
 * Scored rather than filtered, because a plain `includes` over the body ranks a
 * passing mention above a post that is entirely about the term. Title matches
 * dominate, then excerpt, then tags, then body — which is the order a reader
 * would rank them in.
 */
export async function search(query, page = 1) {
  const q = String(query || '').trim().toLowerCase().slice(0, 120);
  if (q.length < 2) return { posts: [], total: 0 };

  const terms = q.split(/\s+/).filter(Boolean);
  const scored = ordered()
    .map((p) => {
      const title = p.title.toLowerCase();
      const excerpt = String(p.excerpt || '').toLowerCase();
      const tags = (p.tags || []).join(' ').toLowerCase();
      const body = p.body.replace(/<[^>]*>/g, ' ').toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 8;
        if (excerpt.includes(t)) score += 3;
        if (tags.includes(t)) score += 2;
        if (body.includes(t)) score += 1;
      }
      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.post.rank - b.post.rank)
    .map((s) => s.post);

  const { items, total } = paginate(scored, page, POSTS_PER_PAGE);
  return { posts: items.map(toCard), total };
}

export async function getRecent(limit = 20) {
  return ordered().slice(0, limit).map(toCard);
}

export async function getRelated(slug, limit = 3) {
  const all = ordered();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];

  const row = (p) => ({
    id: p.rank + 1,
    slug: p.slug,
    categories: [p.category],
    tags: (p.tags || []).map(tagSlug),
    rank: p.rank,
  });

  const winners = scoreRelated(row(current), all.map(row), limit);
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const picked = winners.map((w) => toCard(bySlug.get(w.slug)));

  // Cold fallback: with a very small corpus every candidate can score zero
  // (different category, no shared tags) and an empty rail reads as breakage.
  // Recency is the honest second choice, and it is still filtered by slug.
  if (picked.length) return picked;
  return all.filter((p) => p.slug !== slug).slice(0, limit).map(toCard);
}

/**
 * Sequential siblings inside a category.
 *
 * Related posts is SIMILARITY; this is SEQUENCE. A reader working through the
 * production series wants the next instalment, not three lookalikes.
 */
export async function getAdjacent(slug) {
  const all = ordered();
  const current = all.find((p) => p.slug === slug);
  if (!current) return { prev: null, next: null };

  const siblings = all.filter((p) => p.category === current.category);
  const i = siblings.findIndex((p) => p.slug === slug);
  return {
    // `ordered()` is newest-first, so the NEXT index is the OLDER post.
    prev: siblings[i + 1] ? toCard(siblings[i + 1]) : null,
    next: i > 0 && siblings[i - 1] ? toCard(siblings[i - 1]) : null,
  };
}

export async function getAllSlugs() {
  return ordered().map((p) => p.slug);
}

export async function getSitemapEntries() {
  const all = ordered();
  const posts = all
    .map((p) => ({
      slug: p.slug,
      lastModified: p.updatedAt || p.publishedAt || null,
      images: p.cover ? [p.cover] : [],
    }))
    // Skip a row we cannot date rather than inventing one. An untrustworthy
    // lastmod makes Google discount lastmod across the whole site, so a
    // fabricated date is worse than a missing URL.
    .filter((p) => p.lastModified);

  // Categories carry no date of their own, so derive one from the freshest
  // post in them — same reasoning as above.
  const newest = new Map();
  for (const p of all) {
    const d = p.updatedAt || p.publishedAt;
    if (!d) continue;
    const cur = newest.get(p.category);
    if (!cur || d > cur) newest.set(p.category, d);
  }

  const categories = (await getCategories()).map((c) => ({
    slug: c.slug,
    lastModified: newest.get(c.slug),
  }));

  return { posts, categories };
}

/**
 * Old-slug resolution, for 301s after a rename.
 *
 * A post carries `oldSlugs: []` when it has been renamed. WordPress does this
 * automatically via _wp_old_slug; here it is manual, and the reason to support
 * it at all is that a renamed post with no redirect silently 404s every inbound
 * link and every already-indexed result pointing at it.
 */
export async function resolveOldSlug(oldSlug) {
  for (const p of rawPosts) {
    if ((p.oldSlugs || []).includes(oldSlug)) return p.slug;
  }
  return null;
}

/** Term renames. Same reasoning; no history to resolve in a static set yet. */
export async function resolveTermRedirect() {
  return null;
}
