import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BlogCTA from '@/components/blog/BlogCTA';
import Breadcrumbs from '@/components/blog/Breadcrumbs';
import JsonLd from '@/components/blog/JsonLd';
import PostCard from '@/components/blog/PostCard';
import { authors } from '@/content/blog';
import { getRecentPosts } from '@/lib/blog/queries';
import { blogAlternates } from '@/lib/blog/metadata';
import { ID, SITE, breadcrumbNode, buildGraph } from '@/lib/blog/schema';
import { c, font, site, type } from '@/config/site';

/**
 * The author page.
 *
 * It exists so a byline can be a link. Until this route shipped, every author
 * in content/blog/authors.js carried `url: null` and every article emitted an
 * author with a name and no identity anywhere on the web, which is the weakest
 * possible standing a blog can claim for the person who wrote the thing.
 *
 * This route reaches past lib/blog/queries into the content module for the
 * author record, which no other route does. The reason is that queries.js
 * exposes no author-scoped read: bylines are attached to a post by the source
 * adapter and are never queryable on their own. Adding a `getAuthor` to the
 * layer would need a matching implementation in wordpress.js, where authors are
 * whatever the CMS puts in `p.vf.author` and have no keys at all.
 */

export const revalidate = 3600;

/**
 * false, unlike the post and category routes.
 *
 * Those two have to serve a slug the CMS created after the last build. The
 * author set is not a CMS read: it is a constant in this repo, enumerated
 * exhaustively below, so any slug outside it has no record to render and should
 * be a 404 rather than a render attempt. The `notFound()` in the body is still
 * required, because dev renders every route on demand regardless of this flag.
 */
export const dynamicParams = false;

/** Nothing to await: the author list is a build-time constant. */
export function generateStaticParams() {
  return Object.keys(authors).map((slug) => ({ slug }));
}

/**
 * How far back the post scan reaches.
 *
 * There is no author-scoped query in either source, so the list is filtered out
 * of a recent-posts read. 100 is the ceiling the WordPress REST API enforces on
 * per_page, so asking for more would quietly return 100 anyway. Past 100 posts
 * this needs a real query in both sources rather than a bigger number here.
 */
const SCAN_LIMIT = 100;

/** First sentence only, so a long bio does not become a truncated description. */
function firstSentence(text) {
  const t = String(text || '').trim();
  const stop = t.indexOf('. ');
  return stop === -1 ? t : t.slice(0, stop + 1);
}

/** Word-boundary clamp, so a future long bio cannot ship an over-length tag. */
function clamp(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[,.;:]$/, '')}…`;
}

/**
 * The title carries the role as well as the name, because the name on its own
 * is the only thing on the page a stranger cannot judge. The team entry is an
 * Organization and "The Video Funker team, Editorial" reads as a job title
 * hung on a group, so it keeps the plain name.
 */
function pageTitle(author) {
  return author.type === 'Organization' || !author.title
    ? author.name
    : `${author.name}, ${author.title}`;
}

function pageDescription(author) {
  return clamp(`Posts by ${author.name}. ${firstSentence(author.bio)}`.trim(), 155);
}

/**
 * Static in shape, not in syntax.
 *
 * A dynamic segment cannot export a literal metadata object, so this is a
 * function. It performs no fetch and awaits nothing but `params`: every value
 * comes out of the same build-time constant `generateStaticParams` reads, which
 * is what the "static metadata" rule is actually protecting.
 *
 * The canonical is set here and nowhere else. The root layout deliberately sets
 * none, and the blog layout sets only the feed alternate, so a route that omits
 * its own canonical ships without one. `blogAlternates` restates the feed
 * because Next merges `alternates` shallowly and this object replaces the
 * layout's entirely.
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const author = authors[slug];
  if (!author) return { title: 'Author not found', robots: { index: false, follow: true } };

  const path = `/blog/author/${author.key}`;
  const title = pageTitle(author);
  const description = pageDescription(author);

  return {
    title,
    description,
    alternates: blogAlternates(path),
    openGraph: {
      // `profile` for a human, `website` for the team byline. The type is the
      // one place Open Graph lets a page say which of the two it is.
      type: author.type === 'Organization' ? 'website' : 'profile',
      url: path,
      title: `${title} · ${site.name}`,
      description,
      images: author.avatar ? [{ url: author.avatar }] : undefined,
    },
    twitter: { card: 'summary', title: `${title} · ${site.name}`, description },
  };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const author = authors[slug];
  if (!author) notFound();

  /**
   * Matched on the byline name, not on the key.
   *
   * A post card carries the resolved author (name, title, bio, avatar) and not
   * the key it was looked up by, in either source. Name is therefore the only
   * field the two sides share. The consequence is worth stating plainly: with
   * WordPress behind the blog, a CMS byline spelled differently from the record
   * in authors.js produces an author page with an empty list rather than an
   * error, so the two spellings have to be kept identical by hand.
   */
  const posts = (await getRecentPosts(SCAN_LIMIT)).filter(
    (post) => post.author && post.author.name === author.name
  );

  const path = `/blog/author/${author.key}`;
  const isOrg = author.type === 'Organization';
  const personId = `${SITE}${path}#person`;
  const title = pageTitle(author);
  const description = pageDescription(author);

  /**
   * Home / Blog / name, with no "Authors" level in between.
   *
   * There is no /blog/author index. A crumb pointing at a URL that does not
   * resolve is the same mistake as a byline linking to a 404, and an unlinked
   * middle crumb only invites someone to link it later.
   */
  const trail = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: author.name }];

  /**
   * ProfilePage for a person, AboutPage for the team.
   *
   * The team entry is typed as an Organization in authors.js, and the company
   * is already described by the root layout on this very page, so this page
   * points at that node by @id instead of inventing a human being with a job
   * title to hang the byline on. Every @id below resolves to a node something
   * on this page describes: Organization and WebSite from the root layout,
   * Person and BreadcrumbList from the graph immediately underneath.
   */
  const pageNode = {
    '@type': isOrg ? 'AboutPage' : 'ProfilePage',
    '@id': ID.webpage(path),
    url: `${SITE}${path}`,
    name: title,
    description,
    isPartOf: { '@id': ID.site },
    inLanguage: 'en',
    breadcrumb: { '@id': ID.breadcrumb(path) },
    mainEntity: { '@id': isOrg ? ID.org : personId },
  };

  const personNode = isOrg
    ? null
    : {
        '@type': 'Person',
        '@id': personId,
        name: author.name,
        jobTitle: author.title || undefined,
        description: author.bio || undefined,
        url: `${SITE}${path}`,
        // A plain URL string rather than an ImageObject with an @id. The avatar
        // file's real dimensions are not known here, and an @id'd ImageObject
        // carrying no width or height is weaker than the bare URL it replaces.
        image: author.avatar ? `${SITE}${author.avatar}` : undefined,
        worksFor: { '@id': ID.org },
        mainEntityOfPage: { '@id': ID.webpage(path) },
      };

  const graph = buildGraph(pageNode, personNode, breadcrumbNode(path, trail));

  return (
    <>
      <JsonLd graph={graph} />

      <div className="vf-shell">
        <header className="vf-blog-hero">
          <Breadcrumbs trail={trail} />

          <div
            style={{
              display: 'flex',
              gap: 22,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 16,
            }}
          >
            {author.avatar ? (
              // alt="" on purpose: the h1 beside it already states the name, and
              // an alt repeating it makes a screen reader say it twice.
              <Image
                src={author.avatar}
                alt=""
                width={96}
                height={96}
                style={{
                  borderRadius: 999,
                  display: 'block',
                  flexShrink: 0,
                  border: `1px solid ${c.line}`,
                }}
              />
            ) : null}

            <div>
              <h1 style={{ font: `800 ${type.h2}/1.06 ${font.display}`, color: c.ink }}>
                {author.name}
              </h1>
              {author.title ? (
                <p
                  style={{
                    font: `700 13px ${font.body}`,
                    color: c.blue,
                    marginTop: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {author.title}
                </p>
              ) : null}
            </div>
          </div>

          {author.bio ? (
            <p style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, marginTop: 22 }}>
              {author.bio}
            </p>
          ) : null}
        </header>

        <section aria-labelledby="vf-author-posts">
          <h2
            id="vf-author-posts"
            style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink }}
          >
            Articles by {author.name}
          </h2>
          <p
            style={{
              font: `400 15px/1.6 ${font.body}`,
              color: c.muted,
              marginTop: 10,
              maxWidth: '40em',
            }}
          >
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}, newest first. One byline
            per post, so this list covers writing and not editing, research or review.
          </p>

          <div style={{ marginTop: 28 }}>
            {posts.length === 0 ? (
              <div className="vf-empty">
                <p style={{ font: `700 22px ${font.display}`, color: c.ink }}>
                  Nothing published under this byline yet
                </p>
                <p
                  style={{
                    font: `400 16px/1.6 ${font.body}`,
                    color: c.muted,
                    marginTop: 8,
                    maxWidth: 460,
                  }}
                >
                  This page exists because the byline does. The rest of the blog is not empty.
                </p>
                <Link href="/blog" className="vf-chip is-active" style={{ marginTop: 20 }}>
                  Read everything
                </Link>
              </div>
            ) : (
              <div className="vf-postgrid">
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="vf-author-more" style={{ marginTop: 56 }}>
          <h2
            id="vf-author-more"
            style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink }}
          >
            More from the {site.name} blog
          </h2>
          <p
            style={{
              font: `400 15px/1.6 ${font.body}`,
              color: c.muted,
              marginTop: 10,
              maxWidth: '40em',
            }}
          >
            Everything we publish sits under two indexes: the archive in date order, and the topic
            hub, which lists every section and every tag with the count next to it.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/blog" className="vf-chip">
              Read the archive
            </Link>
            <Link href="/blog/topics" className="vf-chip">
              Browse topics
            </Link>
          </div>
        </section>

        <BlogCTA
          heading="Want a month of video with your own name on it?"
          body="One intake call becomes a month of feed-ready video, scripts and outreach. The first video is free, and there is nothing to install."
        />
        <div style={{ height: 88 }} />
      </div>
    </>
  );
}
