/**
 * Structured data for the blog.
 *
 * One @graph per page, with stable @ids so nodes can reference each other
 * instead of repeating themselves. Google merges every JSON-LD block on a page
 * into a single dataset, so an @id emitted in the root layout resolves from a
 * block emitted deeper in the tree — which is why the Organization and WebSite
 * nodes live in one place and everything else points at them.
 *
 * ─── DELIBERATELY NOT EMITTED ────────────────────────────────────────────────
 * Each of these looks like an easy SEO win and is not. Do not add them back
 * without a reason that survives the note next to it.
 *
 *  · FAQPage / HowTo — FAQ rich results stopped appearing in May 2026 and the
 *    HowTo desktop treatment has been gone since 2023. Still valid schema, still
 *    parsed, earns nothing. Pure page weight.
 *
 *  · potentialAction / SearchAction — the sitelinks searchbox was retired
 *    globally in November 2024. The markup is now inert.
 *
 *  · AggregateRating / Review on the Organization — self-serving review markup
 *    on your own entity is ignored and can trigger a manual action. Risk with
 *    no upside.
 *
 *  · speakable — news-publisher-only and still beta.
 *
 *  · Any @id pointing at a node no page actually emits. A dangling reference is
 *    worse than an omitted property, and no validator will catch it for you.
 */

import { SITE_URL, site } from '@/config/site';

export const SITE = SITE_URL;

/**
 * Every @id the site can mint. Centralised because a typo'd @id does not fail
 * loudly — it silently produces two unrelated entities.
 */
export const ID = {
  org: `${SITE}/#organization`,
  site: `${SITE}/#website`,
  logo: `${SITE}/#logo`,
  blog: `${SITE}/blog#blog`,
  article: (path) => `${SITE}${path}#article`,
  webpage: (path) => `${SITE}${path}#webpage`,
  image: (path) => `${SITE}${path}#primaryimage`,
  breadcrumb: (path) => `${SITE}${path}#breadcrumb`,
};

/**
 * Serialise for embedding in a <script> tag.
 *
 * The escaping is not decoration. `</script>` inside any string value ends the
 * block early and drops the rest of the page's markup into script context —
 * that is XSS, and blog bodies are the one place on this site where third-party
 * text reaches the page. U+2028/2029 are escaped because they are literal line
 * terminators in JavaScript, which breaks the parse even though JSON allows
 * them raw.
 */
export function ldJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/[\u2028\u2029]/g, (ch) => (ch === '\u2028' ? '\\u2028' : '\\u2029'));
}

/**
 * Flatten nodes into a single @graph, dropping falsy entries and de-duplicating
 * anything carrying an @id (first one wins). Nodes without an @id pass straight
 * through — ListItem, Person and inline ImageObject legitimately have none.
 *
 * undefined values need no stripping: JSON.stringify already drops them, which
 * is why optional properties below are written as `?? undefined` rather than
 * being conditionally spread.
 */
export function buildGraph(...nodes) {
  const seen = new Set();
  const graph = [];
  for (const node of nodes) {
    if (!node) continue;
    const id = node['@id'];
    if (typeof id === 'string') {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    graph.push(node);
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Organization, not SoftwareApplication.
 *
 * Video Funker sells a produced service — a person is filmed, content is
 * written — with software behind it. The root layout already carries the
 * product/offer markup for the app itself; duplicating a different primary type
 * here would put two competing claims about what this entity is into one
 * dataset.
 *
 * `sameAs`, `address` and `contactPoint` are absent rather than invented. Add
 * them when there are real, verifiable values — a wrong sameAs actively merges
 * your entity with someone else's.
 */
export const organizationNode = {
  '@type': 'Organization',
  '@id': ID.org,
  name: site.name,
  legalName: site.legalName,
  url: `${SITE}/`,
  logo: {
    '@type': 'ImageObject',
    '@id': ID.logo,
    url: `${SITE}/brand/logo.png`,
    contentUrl: `${SITE}/brand/logo.png`,
    caption: site.name,
  },
  image: { '@id': ID.logo },
  description: site.description,
};

export const websiteNode = {
  '@type': 'WebSite',
  '@id': ID.site,
  url: `${SITE}/`,
  name: site.name,
  publisher: { '@id': ID.org },
  inLanguage: 'en',
};

/** The blog as a thing in its own right, so articles have a parent to belong to. */
export const blogNode = {
  '@type': 'Blog',
  '@id': ID.blog,
  url: `${SITE}/blog`,
  name: `${site.name} blog`,
  description:
    'How founder-led video actually gets made, distributed and measured — written by the team that produces it.',
  publisher: { '@id': ID.org },
  isPartOf: { '@id': ID.site },
  inLanguage: 'en',
};

/**
 * Who emits what, and why it is split this way.
 *
 * `siteGraph` goes in the ROOT layout, so Organization and WebSite exist on
 * every page of the site — including the homepage, where the SoftwareApplication
 * node references the Organization as its publisher. If these lived only in the
 * blog layout, that homepage reference would be a dangling `@id`: a pointer to
 * a node no page in the crawl actually describes. Nothing validates that for
 * you, which is exactly why it has to be decided rather than assumed.
 *
 * `blogGraph` adds only the Blog node, from the blog layout. It does not repeat
 * Organization or WebSite, because the root layout above it already emitted
 * them into the same page and Google merges every block on a page into one
 * dataset.
 */
export const siteGraph = buildGraph(organizationNode, websiteNode);
export const blogGraph = buildGraph(blogNode);

/**
 * BreadcrumbList.
 *
 * `item` is omitted on the final crumb on purpose: the last entry is the page
 * you are already on, and Google's own guidance is to leave it unlinked. Every
 * other position carries an absolute URL, because relative ones are resolved
 * against the schema context rather than the page and silently break.
 */
export function breadcrumbNode(path, trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb(path),
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(i < trail.length - 1 && crumb.href
        ? { item: `${SITE}${crumb.href}` }
        : {}),
    })),
  };
}

/**
 * The article graph: BlogPosting + WebPage + the primary image.
 *
 * BlogPosting and WebPage are separate nodes rather than one merged blob
 * because they answer different questions — "what is this text" and "what is
 * this URL" — and properties like `reviewedBy` are scoped by schema.org to
 * WebPage. Putting them on a CreativeWork is out of domain and strict consumers
 * drop them.
 */
export function articleGraph(post) {
  const path = `/blog/${post.slug}`;
  const canonical = post.canonicalUrl || `${SITE}${path}`;

  const image = post.coverImage
    ? {
        '@type': 'ImageObject',
        '@id': ID.image(path),
        url: absolute(post.coverImage),
        contentUrl: absolute(post.coverImage),
        caption: post.coverAlt || post.title,
      }
    : null;

  /**
   * Person or Organization, decided by the data rather than assumed.
   *
   * "The Video Funker team" is not a Person, and typing it as one puts a claim
   * in the graph that is simply false — with `jobTitle: "Editorial"` hung off a
   * human being who does not exist. Google accepts either type for `author`; it
   * does not accept a byline that contradicts itself.
   *
   * A team byline resolves to the Organization already described elsewhere in
   * the graph, by reference, so the company is never described twice.
   *
   * A named Person is emitted INLINE with no @id: /blog/author/* does not
   * exist, and an @id pointing at a URL that 404s is worse than an anonymous
   * node — it asserts an entity page that cannot be crawled.
   */
  const author =
    post.author?.type === 'Organization' || !post.author?.name
      ? { '@id': ID.org }
      : {
          '@type': 'Person',
          name: post.author.name,
          ...(post.author.title ? { jobTitle: post.author.title } : {}),
          ...(post.author.url ? { url: post.author.url } : {}),
        };

  const articleNode = {
    '@type': 'BlogPosting',
    '@id': ID.article(path),
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: image ? { '@id': ID.image(path) } : undefined,
    datePublished: post.publishedAt,
    // Falls back to publishedAt: an article that has never been edited was last
    // modified when it was written, and omitting dateModified entirely makes
    // some consumers treat the page as undated.
    dateModified: post.updatedAt || post.publishedAt,
    author,
    publisher: { '@id': ID.org },
    isPartOf: { '@id': ID.blog },
    mainEntityOfPage: { '@id': ID.webpage(path) },
    inLanguage: 'en',
    ...(post.category?.name ? { articleSection: post.category.name } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    ...(post.readingMinutes
      ? { timeRequired: `PT${post.readingMinutes}M` }
      : {}),
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
  };

  const webPageNode = {
    '@type': 'WebPage',
    '@id': ID.webpage(path),
    url: canonical,
    name: post.seoTitle || post.title,
    isPartOf: { '@id': ID.site },
    primaryImageOfPage: image ? { '@id': ID.image(path) } : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    inLanguage: 'en',
    breadcrumb: { '@id': ID.breadcrumb(path) },
  };

  const trail = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    ...(post.category
      ? [{ name: post.category.name, href: `/blog/category/${post.category.slug}` }]
      : []),
    { name: post.title },
  ];

  return buildGraph(articleNode, webPageNode, image, breadcrumbNode(path, trail));
}

/** A listing page: the collection plus its breadcrumb. */
export function collectionGraph({ path, name, description, posts = [], trail = [] }) {
  const collection = {
    '@type': 'CollectionPage',
    '@id': ID.webpage(path),
    url: `${SITE}${path}`,
    name,
    description: description || undefined,
    isPartOf: { '@id': ID.site },
    inLanguage: 'en',
    ...(trail.length ? { breadcrumb: { '@id': ID.breadcrumb(path) } } : {}),
    // The list is the page's reason to exist, so it is described rather than
    // left for the crawler to infer from markup.
    ...(posts.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            itemListOrder: 'https://schema.org/ItemListOrderDescending',
            numberOfItems: posts.length,
            itemListElement: posts.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${SITE}/blog/${p.slug}`,
              name: p.title,
            })),
          },
        }
      : {}),
  };

  return buildGraph(collection, trail.length ? breadcrumbNode(path, trail) : null);
}

/** Site-relative paths become absolute; anything already absolute is left alone. */
function absolute(url) {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `${SITE}${url.startsWith('/') ? '' : '/'}${url}`;
}
