import Image from 'next/image';
import Link from 'next/link';

import Reveal from '@/components/marketing/Reveal';
import { formatDate, isoDate, readingLabel } from '@/lib/blog/format';
import { getRecentPosts } from '@/lib/blog/queries';
import { c, font, space, type } from '@/config/site';

/**
 * Three recent articles, on the homepage.
 *
 * This exists for two reasons, and the second one is the important one.
 *
 * The obvious reason is that a reader who is not ready to book still has
 * somewhere to go, which is the entire point of having written the articles.
 *
 * The real reason is internal linking. Before this, the homepage linked to
 * `/blog` and to nothing beneath it, so every article's only route in was the
 * blog index. The homepage is the page that will accumulate whatever authority
 * this domain earns, and passing none of it to the articles wastes it. Three
 * direct links from the strongest page on the site is the cheapest internal
 * linking win available.
 *
 * It renders nothing when there are no posts, and it swallows a data-layer
 * failure. The marketing page must never fail to render because a blog query
 * threw, which is a real possibility once WordPress is behind this.
 */
export default async function LatestPosts() {
  let posts = [];
  try {
    posts = await getRecentPosts(3);
  } catch {
    return null;
  }
  if (!posts.length) return null;

  return (
    <section
      id="writing"
      className="vf-pad"
      style={{ background: c.bg, padding: `${space.section}px 48px` }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="vf-how-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <Reveal
              as="h2"
              style={{
                font: `600 ${type.h3}/1.1 ${font.display}`,
                letterSpacing: '-0.02em',
                margin: 0,
                maxWidth: 620,
              }}
            >
              How founder-led video actually works
            </Reveal>
            <Reveal
              as="p"
              delay={90}
              style={{ font: `400 17px/1.6 ${font.body}`, color: c.muted, margin: '14px 0 0', maxWidth: 560 }}
            >
              What we learn running these campaigns, written up in full.
            </Reveal>
          </div>
          <Reveal delay={140}>
            <Link
              href="/blog"
              className="vf-btn-ghost vf-press"
              style={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
                border: `1px solid ${c.lineStrong}`,
                color: c.ink,
                font: `600 15px ${font.body}`,
                padding: '12px 24px',
                borderRadius: 100,
              }}
            >
              Read the blog
            </Link>
          </Reveal>
        </div>

        <div className="vf-latest" style={{ marginTop: 40 }}>
          {posts.map((post, i) => (
            <Reveal key={post.slug} variant="scale" delay={i * 80} style={{ display: 'flex' }}>
              <article className="vf-latest-card">
                {post.coverImage && (
                  <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true" className="vf-latest-media">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      /* Three-up inside the 1184px content box, so ~373px each
                         once it caps. Measured, not guessed. */
                      sizes="(max-width: 900px) 100vw, (max-width: 1376px) 31vw, 373px"
                      loading="lazy"
                      style={{ objectFit: 'cover' }}
                    />
                  </Link>
                )}
                <div className="vf-latest-body">
                  {post.category && (
                    <span style={{ font: `700 11px ${font.body}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.orangeDark }}>
                      {post.category.name}
                    </span>
                  )}
                  <h3 style={{ font: `600 19px/1.32 ${font.display}`, color: c.ink, margin: '10px 0 0' }}>
                    <Link href={`/blog/${post.slug}`} className="vf-latest-link">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p className="vf-latest-excerpt" style={{ font: `400 15px/1.6 ${font.body}`, color: c.muted, margin: '10px 0 0' }}>
                      {post.excerpt}
                    </p>
                  )}
                  <p style={{ font: `500 13px ${font.body}`, color: c.soft, margin: '14px 0 0' }}>
                    {post.publishedAt && (
                      <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
                    )}
                    {post.readingMinutes ? ` · ${readingLabel(post.readingMinutes)}` : ''}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
