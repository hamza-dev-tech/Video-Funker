import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';

import ArticleBody from '@/components/blog/ArticleBody';
import ArticleHeader from '@/components/blog/ArticleHeader';
import AuthorBio from '@/components/blog/AuthorBio';
import BlogCTA from '@/components/blog/BlogCTA';
import JsonLd from '@/components/blog/JsonLd';
import PrevNext from '@/components/blog/PrevNext';
import RelatedPosts from '@/components/blog/RelatedPosts';
import ShareLinks from '@/components/blog/ShareLinks';
import Toc from '@/components/blog/Toc';
import {
  getAdjacentPosts,
  getAllPublishedSlugs,
  getPostBySlug,
  getRelatedPosts,
  resolveOldSlug,
} from '@/lib/blog/queries';
import { SITE, articleGraph } from '@/lib/blog/schema';
import { slugify } from '@/lib/blog/format';
import { blogAlternates } from '@/lib/blog/metadata';
import { size as ogSize } from './opengraph-image';
import { c, font } from '@/config/site';

export const revalidate = 3600;
/**
 * true, so a post published between builds renders on first request instead of
 * 404ing until the next deploy. With WordPress behind this that is the
 * difference between "publish" meaning live and meaning "live after a deploy".
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  // No `notFound()` here — metadata runs before the page body, and throwing
  // from it skips the old-slug redirect the page performs.
  if (!post) return { title: 'Article not found', robots: { index: false, follow: true } };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || '';
  const url = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: blogAlternates(post.canonicalUrl || url),
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: post.author && post.author.name ? [post.author.name] : undefined,
      section: post.category ? post.category.name : undefined,
      tags: post.tags && post.tags.length ? post.tags : undefined,
      // The route below renders this per post. Metadata's file-convention
      // detection already picks it up, but naming it explicitly keeps the OG
      // image correct if the canonical ever moves.
      images: [{ url: `${url}/opengraph-image`, width: ogSize.width, height: ogSize.height }],
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    // An editor renamed the slug. 301 to the live URL rather than 404ing every
    // inbound link and every already-indexed result pointing at the old one.
    const current = await resolveOldSlug(slug);
    if (current) permanentRedirect(`/blog/${current}`);
    notFound();
  }

  // Headings come from the same pass that sanitised the HTML, so the ids match
  // the rendered anchors exactly. Re-deriving them here would desync.
  const headings = post.headings || [];
  const [related, adjacent] = await Promise.all([
    getRelatedPosts(post, 5),
    getAdjacentPosts(post),
  ]);

  // The rail takes the two freshest neighbours and the tail section takes the
  // rest, so no card appears twice on one page. Below four the rail list is
  // dropped rather than duplicated.
  const railRelated = related.length >= 4 ? related.slice(0, 2) : [];
  const tailRelated = related.length >= 4 ? related.slice(2) : related;

  const url = `${SITE}/blog/${post.slug}`;

  /**
   * The image node.
   *
   * An ImageObject is only minted with an `@id` when its dimensions are
   * actually known — and the OG route's exported `size` is the one case where
   * they are, which is why it is imported rather than retyped. A cover image
   * from the CMS arrives with no dimensions in the post payload, so it stays a
   * bare URL string: an `@id`'d ImageObject with no width or height is
   * strictly weaker than a plain URL.
   */
  const graph = articleGraph({
    ...post,
    coverImage: post.coverImage || `${url}/opengraph-image`,
    coverAlt: post.coverAlt || post.title,
  });

  return (
    <article className="vf-article">
      <JsonLd graph={graph} />

      <div className="vf-shell vf-shell-narrow">
        <div className="vf-article-grid">
          {/* A fragment: the header lands in column one, the cover spans both. */}
          <ArticleHeader post={post} />

          <div className="vf-article-main">
            <Toc headings={headings} variant="mobile" />
            <ArticleBody body={post.body} />

            <div className="vf-article-actions">
              <ShareLinks url={url} title={post.title} />
              {/* #main is the layout's landmark and already carries tabIndex,
                  so this moves focus as well as the viewport. */}
              <a href="#main" className="vf-backtotop">
                Back to top <span aria-hidden="true">↑</span>
              </a>
            </div>

            <PrevNext prev={adjacent.prev} next={adjacent.next} />
            <AuthorBio author={post.author} />

            {post.tags && post.tags.length > 0 && (
              <div className="vf-tagcloud" style={{ marginTop: 32 }}>
                <span style={{ font: `600 13px ${font.body}`, color: c.soft, alignSelf: 'center' }}>
                  Filed under
                </span>
                {post.tags.map((tag) => (
                  // slugify, not a hand-rolled replace chain: the data layer
                  // derives tag slugs with this exact function, and a second
                  // copy that drifts turns every tag link into a 404.
                  <Link key={tag} href={`/blog/tag/${slugify(tag)}`} className="vf-chip">
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="vf-article-rail">
            <div className="vf-article-rail-inner">
              <Toc headings={headings} />

              {railRelated.length > 0 && (
                <nav className="vf-rail-card" aria-labelledby="vf-rail-related">
                  <p id="vf-rail-related" className="vf-rail-heading">
                    Related
                  </p>
                  {railRelated.map((p) => (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="vf-rail-link">
                      {p.title}
                    </Link>
                  ))}
                </nav>
              )}

              <div className="vf-rail-card vf-rail-card-accent">
                <p style={{ font: `700 17px/1.35 ${font.display}`, color: c.white }}>
                  Your first video is free.
                </p>
                <p style={{ font: `400 14px/1.6 ${font.body}`, color: c.blueText, marginTop: 8 }}>
                  One call in, a month of feed-ready video out.
                </p>
                <a
                  href="/signup"
                  className="vf-btn-cta vf-press"
                  style={{
                    display: 'inline-flex',
                    marginTop: 16,
                    background: c.orange,
                    color: c.orangeInk,
                    font: `700 14px ${font.body}`,
                    padding: '11px 22px',
                    borderRadius: 100,
                  }}
                >
                  Start free
                </a>
              </div>
            </div>
          </aside>
        </div>

        <RelatedPosts posts={tailRelated} category={post.category ? post.category.name : null} />

        <BlogCTA
          heading="Ready to put this on your own feed?"
          body="One intake call becomes a month of video, scripts and outreach. The first video is free, and there is nothing to install."
        />
        <div style={{ height: 88 }} />
      </div>
    </article>
  );
}
