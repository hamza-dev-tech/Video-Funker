# The Video Funker blog

A full editorial blog with the SEO surface built in, running today on posts
committed to this repo, and switchable to headless WordPress with one
environment variable.

---

## The one idea worth understanding first

There are two content sources behind one interface:

| | |
|---|---|
| `src/lib/blog/local.js` | Posts in `src/content/blog/`. Active now. |
| `src/lib/blog/wordpress.js` | Headless WordPress over the REST API. |

`src/lib/blog/queries.js` picks between them and is the **only** module the
routes import. The switch is the presence of `WP_API_URL` — nothing else.

That is deliberate. A separate `BLOG_SOURCE=wordpress` flag can disagree with
the URL (flag set, URL missing), and the result is a blog that throws on every
route. One control cannot contradict itself.

The local source is not a stub. Pagination, term resolution, search,
relatedness, adjacency, redirects and sitemap enumeration all behave the way
their WordPress counterparts do, because the point of a seam is that the thing
on the other side does not get to be special.

---

## Routes

| Route | Rendering | Notes |
|---|---|---|
| `/blog` | dynamic | Reads `?page`, so Next renders on demand |
| `/blog/[slug]` | SSG + ISR 1h | Prerendered from `generateStaticParams` |
| `/blog/category/[category]` | SSG page 1 | `?page=2+` on demand |
| `/blog/tag/[tag]` | on demand | Only tags with 3+ posts are prerendered |
| `/blog/topics` | static, ISR 1h | The internal-linking hub |
| `/blog/search` | dynamic | `noindex, follow` |
| `/blog/feed.xml` | dynamic | RSS 2.0 |
| `/blog/[slug]/opengraph-image` | dynamic | Per-article 1200×630 card |
| `/sitemap.xml`, `/robots.txt` | static, ISR | |
| `/api/revalidate` | POST only | HMAC-signed publish webhook |

---

## What makes it rank, and why each piece is there

**Canonicals are per-route, never inherited.** The blog layout deliberately does
not set one. Metadata inherits, so a canonical on the layout becomes the default
for every route below it — and a page carrying `noindex` *and* a canonical
pointing elsewhere can propagate that noindex to the canonical's target. A
forgotten override on `/blog/search` would have been a mechanism for
de-indexing the blog index itself.

**Paginated archives self-canonicalise.** Page 2 points at page 2, not at page
1. Canonicalising every page to the first tells Google that pages 2..n are
duplicates, so it drops them — and every article that only appears on page 3
loses its discovery path.

**One `@graph`, shared by reference.** Organization and WebSite are described
once in the root layout; the blog layout adds `Blog`; each article adds
`BlogPosting` + `WebPage` + `ImageObject` + `BreadcrumbList` and points at the
rest by `@id`. Google merges every JSON-LD block on a page into one dataset, so
the references resolve. Nothing is described twice, and nothing references a
node no page emits — a dangling `@id` is worse than an omitted property, and no
validator reports it.

**Deliberately NOT emitted** (each looks like a free win and is not):

- `FAQPage` / `HowTo` — FAQ rich results stopped appearing in May 2026, HowTo's
  desktop treatment has been gone since 2023. Valid, parsed, earns nothing.
- `potentialAction` / `SearchAction` — the sitelinks searchbox was retired in
  November 2024. The markup is inert.
- `AggregateRating` on our own Organization — self-serving review markup is
  ignored and can trigger a manual action.
- `speakable` — news publishers only, still beta.
- `priority` and `changeFrequency` in the sitemap — Google has stated it ignores
  both, and `changeFrequency` actively competes with `lastModified`, which *is*
  used.

**`robots.txt` repeats every rule in every block.** robots.txt has no
inheritance: the moment an agent matches its own `User-agent` block it ignores
the `*` block entirely. The disallow lists are constants spread into each block
rather than typed per agent, because the failure mode is invisible in review.

**Facet patterns are written as `/blog*sort=`, not `/blog/*?*sort=`.** The
second requires the path to begin literally `/blog/` and therefore misses
`/blog?sort=recent` — the single most likely facet URL on this site.

**Tag archives below 3 posts are `noindex, follow`.** A tag archive with one
post is a near-duplicate of that post with none of its content. `follow` stays
on so the crawler still uses the page to reach the articles. The threshold lives
in one exported constant (`MIN_INDEXABLE_TAG_POSTS`) that both the tag route and
`sitemap.js` import — if they drift, the sitemap asks Google to crawl a URL
whose own meta tag tells it to drop the result.

**AI crawlers are allowed, on purpose.** The vendors split their fleets into
training, search-index and live-fetch bots; blocking the wrong one removes the
site from *citations*, not just from training. For a marketing site with no
paywall, being the answer when someone asks an assistant about founder-led video
is worth more than withholding public articles. `Bytespider` is the one
exception — no citation upside, documented robots non-compliance.

**Related posts are scored, not "newest in category".** The naive version has a
failure mode that looks fine in review: for any post not among the newest few,
the "minus this one" filter removes nothing, so *every* article in the category
renders the identical three cards and the internal link graph collapses to one
hub. Scoring is `2 · sharedCategories + jaccard(tags)`, with ties broken by a
stable pair hash so different articles surface different neighbours even at zero
tag coverage — and stably, so cached HTML does not churn.

---

## The HTML pipeline

`src/lib/blog/html.js` sanitises the body and collects the table-of-contents
headings in **one** unified pass. Not two.

Sanitising and then re-slugging in a second pass desynchronises the moment two
headings share a title: `github-slugger` is stateful, so the second pass
restarts its counter and mints `overview-1` while the rendered anchor says
`overview`. Every TOC link past the duplicate then scrolls nowhere. Taking the
ids from the same tree that produced the anchors makes that impossible rather
than unlikely.

Order inside the pipeline matters too: **sanitize before slug**. Slugging first
writes `id` attributes the sanitizer then strips.

What it does to a body:

- Strips scripts, event handlers, inline `style`, and `javascript:` / `data:`
  hrefs.
- Allowlists iframes by host (YouTube, Vimeo, Wistia, Loom). An unrestricted
  iframe `src` on this domain is a phishing surface.
- Demotes a body `<h1>` to `<h2>` **before** the TOC test, so the section still
  appears in the contents instead of vanishing.
- Rewrites CMS-host and same-site absolute links to relative paths.
- Adds `target="_blank"` + `noopener noreferrer` to outbound links, and
  **preserves** an editor's own `rel="sponsored"` / `nofollow` / `ugc` rather
  than overwriting it. It does *not* blanket-nofollow: that is right for UGC and
  paid placement, neither of which exists here, and blanket nofollow on
  editorial citations signals equity-hoarding.
- Wraps bare `<table>` elements in a keyboard-operable scroll container. Without
  it, `overflow-x: clip` on the body amputates trailing columns with no
  scrollbar to hint they exist. A wrapper rather than `display: block` on the
  table, because `display: block` strips the table role and screen readers read
  a wall of text instead of rows and columns.
- Lazy-loads body images and gives an unlabelled image `alt=""`, so a screen
  reader announces nothing rather than a filename.

There is exactly **one** `dangerouslySetInnerHTML` in the blog, in
`ArticleBody.js`, and it only ever takes the output of this pipeline. Reviewing
the safety of the whole blog is reviewing one file.

---

## Switching to WordPress

1. Provision WordPress. Install `wordpress/vf-headless.php` as a **mu-plugin**
   (`wp-content/mu-plugins/`) — mu-plugins cannot be deactivated by accident,
   and an accidental deactivation would silently drop the `vf` field so covers,
   reading times and bylines vanish while WordPress still looks healthy.

2. In `wp-config.php`:

   ```php
   define('VF_REVALIDATE_URL', 'https://videofunker.ai/api/revalidate');
   define('VF_REVALIDATE_SECRET', '<same value as REVALIDATE_SECRET>');
   ```

3. In the client environment (see `.env.example`):

   ```
   WP_API_URL=https://cms.videofunker.ai/wp-json
   WP_PUBLIC_ORIGIN=https://cms.videofunker.ai
   REVALIDATE_SECRET=<openssl rand -hex 32>
   ```

4. Recreate the three categories with their descriptions (the term description
   is what stops an archive being treated as thin), then migrate or rewrite the
   seed posts.

Nothing in `src/app/blog/` or `src/components/blog/` changes.

### The cache-tag contract

| Tag | Covers |
|---|---|
| `wp:list` | anything rendering a list of posts |
| `wp:sitemap` | sitemap and slug enumeration |
| `wp:redirects` | the old-slug index |
| `wp:taxonomies` | the term vocabulary |
| `wp:post:{slug}` | one article body |
| `wp:category:{slug}` | one category archive |
| `wp:tag:{slug}` | one tag archive |

Every tag subscribed to in `wordpress.js` is purged by `/api/revalidate`, and
every tag that route purges is subscribed to. Break it in either direction and
the failure is silent — a tag nothing purges is a surface frozen forever.

There is deliberately **no** global "purge everything" tag. It looks like cheap
insurance and it is the opposite: it masks exactly that mismatch, because every
surface gets swept up by accident until the day someone removes it.

The webhook signs `"{timestamp}.{body}"`, not the body alone. Signing the body
alone gives anyone who captures one valid request a token they can replay
forever; binding the timestamp into the signature bounds the replay window to
five minutes. It returns **503 when unconfigured** rather than failing open — an
unauthenticated purge endpoint is a free denial-of-service against this app and
the WordPress box behind it.

---

## Adding a post without WordPress

1. Create `src/content/blog/posts/<slug>.js`. Copy the shape of an existing one.
2. Register it in `src/content/blog/index.js`.

Everything else derives itself: reading time, word count, excerpt fallback,
category counts, tag vocabulary, related posts, sitemap entry, RSS item, OG
image.

`oldSlugs: ['previous-slug']` on a post makes the old URL 301 instead of 404.

---

## Verified behaviour

Checked against a running server, not assumed:

- Every route returns its correct status, including real 404s (not soft 404s).
- Article `@graph` has no dangling `@id` and no duplicate `@id`.
- A body `<h1>` is demoted and still appears in the contents.
- Duplicate headings produce `overview` / `overview-1`, and the TOC targets
  match the rendered anchors exactly.
- A bare table is wrapped with `role="region"` and `tabindex="0"`; an
  editor-authored `wp-block-table` figure is left alone rather than
  double-wrapped.
- Scripts, `onerror`, `javascript:`, `data:`, inline `style`, `<form>`, and
  foreign iframes are all stripped; an editor's `rel="sponsored"` survives.
- `/blog/search` is `noindex, follow` with a self-canonical.
- The sitemap lists zero tag URLs, exactly matching the zero tags currently at
  or above the indexable threshold.
- The webhook accepts a valid signature and rejects replay, tampering, a wrong
  secret, an empty signature and a missing timestamp.
- Desktop article grid resolves to 656 + 56 + 256 = 968px, with the `h1` the
  same width as the body column.
- At 375px: no page-level horizontal overflow, the table scrolls inside its own
  container, and every tap target clears the WCAG 2.2 AA 24px minimum.
