/**
 * The blog's public data API. Routes and components import from here and from
 * nowhere else in this directory.
 *
 * Underneath sits one of two interchangeable sources:
 *
 *   local.js       posts committed to this repo (the state the site is in now)
 *   wordpress.js   headless WordPress over the REST API
 *
 * The switch is the presence of `WP_API_URL`. That is deliberately the only
 * control — an explicit `BLOG_SOURCE=wordpress` flag would let the two disagree
 * (flag set, URL missing) and produce a blog that throws on every route, which
 * is a strictly worse failure than the one it prevents.
 *
 * This module exists as a layer, rather than routes importing a source
 * directly, for one concrete reason: the two sources cannot have identical
 * signatures everywhere. WordPress needs a numeric category id to ask for
 * siblings; the local source needs a slug. Papering over that here keeps the
 * difference in one file instead of in nine routes.
 */

import * as local from './local';
import * as wordpress from './wordpress';

const useWordPress = Boolean(process.env.WP_API_URL);

/** @type {typeof local} */
const source = useWordPress ? wordpress : local;

/** Surfaced in the dev-only diagnostics on /blog and nowhere else. */
export const SOURCE_NAME = useWordPress ? 'wordpress' : 'local';

export const POSTS_PER_PAGE = source.POSTS_PER_PAGE;

/* ─────────────────────────── reads ─────────────────────────── */

export const getPublishedPosts = (page = 1) => source.listPosts(page);
export const getPostBySlug = (slug) => source.getPost(slug);
export const getPostCard = (slug) => source.getPostCard(slug);
export const getPostsByCategory = (slug, page = 1) => source.listByCategory(slug, page);
export const getPostsByTag = (slug, page = 1) => source.listByTag(slug, page);
export const searchPosts = (query, page = 1) => source.search(query, page);
export const getRecentPosts = (limit = 20) => source.getRecent(limit);

export const getCategories = (opts) => source.getCategories(opts);
export const getCategory = (slug) => source.getCategory(slug);
export const getCategoryTree = () => source.getCategoryTree();
export const getTags = () => source.getTags();
export const getTag = (slug) => source.getTag(slug);

export const getAllPublishedSlugs = () => source.getAllSlugs();
export const getSitemapEntries = () => source.getSitemapEntries();
export const resolveOldSlug = (slug) => source.resolveOldSlug(slug);
export const resolveTermRedirect = (slug, taxonomy) => source.resolveTermRedirect(slug, taxonomy);

/**
 * Takes the whole post rather than a slug, because WordPress needs the numeric
 * category id to fall back on and the local source needs the slug. Passing the
 * post means neither caller has to know which one it is talking to.
 */
export function getRelatedPosts(post, limit = 3) {
  if (!post) return Promise.resolve([]);
  return useWordPress
    ? wordpress.getRelated(post.slug, limit, post.categoryId)
    : local.getRelated(post.slug, limit);
}

export function getAdjacentPosts(post) {
  if (!post) return Promise.resolve({ prev: null, next: null });
  return useWordPress
    ? wordpress.getAdjacent(post.slug, post.categoryId, post.publishedAt)
    : local.getAdjacent(post.slug);
}

/**
 * Tags below this many posts are noindex.
 *
 * A tag archive with one post is a near-duplicate of that post with none of its
 * content — the textbook thin-content page, and at scale a pile of them dilutes
 * the crawl budget that should be going to articles. Three is where an archive
 * starts being a genuinely different page from any single post on it.
 *
 * Exported so /blog/tag and sitemap.js read the SAME number. When they drift,
 * the sitemap asks Google to crawl URLs whose own meta tag then tells it to
 * drop them, which is a direct self-contradiction and gets reported in Search
 * Console as an error rather than ignored.
 */
export const MIN_INDEXABLE_TAG_POSTS = 3;
