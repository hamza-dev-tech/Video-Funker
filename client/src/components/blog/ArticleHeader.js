import Image from 'next/image';
import Link from 'next/link';

import Breadcrumbs from './Breadcrumbs';
import { formatDate, isoDate, readingLabel } from '@/lib/blog/format';
import { c, font, type } from '@/config/site';

/**
 * Returns a FRAGMENT, not a wrapper.
 *
 * The article page is a two-column grid on desktop, and the header needs to
 * land in column one while the cover image spans both. A wrapping <div> here
 * would make the whole header one grid item and the cover could never break
 * out of the text column, so the pieces are emitted as siblings and placed by
 * the parent grid.
 */
export default function ArticleHeader({ post }) {
  const trail = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    ...(post.category ? [{ name: post.category.name, href: `/blog/category/${post.category.slug}` }] : []),
    { name: post.title },
  ];

  // Only surface "Updated" when it is a genuinely different day. A cosmetic
  // edit that bumps the timestamp by an hour should not present itself to a
  // reader as new information.
  const published = post.publishedAt;
  const updated =
    post.updatedAt && published && isoDate(post.updatedAt).slice(0, 10) !== isoDate(published).slice(0, 10)
      ? post.updatedAt
      : null;

  return (
    <>
      <header className="vf-article-head">
        <Breadcrumbs trail={trail} />

        <h1 style={{ font: `800 ${type.h3}/1.12 ${font.display}`, color: c.ink, letterSpacing: '-0.02em', marginTop: 18 }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ font: `400 ${type.lead}/1.55 ${font.body}`, color: c.muted, marginTop: 16, maxWidth: '38em' }}>
            {post.excerpt}
          </p>
        )}

        <div className="vf-article-byline">
          {post.author && post.author.avatar ? (
            <Image
              src={post.author.avatar}
              alt=""
              width={40}
              height={40}
              style={{ borderRadius: 999, display: 'block' }}
            />
          ) : null}
          <div>
            <p style={{ font: `600 15px ${font.body}`, color: c.ink }}>
              {post.author ? post.author.name : 'Video Funker'}
              {post.author && post.author.title ? (
                <span style={{ color: c.soft, fontWeight: 400 }}> · {post.author.title}</span>
              ) : null}
            </p>
            <p style={{ font: `400 14px ${font.body}`, color: c.soft, marginTop: 2 }}>
              {published && <time dateTime={isoDate(published)}>{formatDate(published)}</time>}
              {updated && (
                <>
                  {' · '}
                  {/* Says what changed, not just when. "Updated" alone reads as
                      a cache timestamp; naming it as a revision is the claim
                      actually being made. */}
                  <time dateTime={isoDate(updated)}>Revised {formatDate(updated)}</time>
                </>
              )}
              {post.readingMinutes ? ` · ${readingLabel(post.readingMinutes)}` : ''}
            </p>
          </div>

          {post.category && (
            <Link href={`/blog/category/${post.category.slug}`} className="vf-pill" style={{ marginLeft: 'auto' }}>
              {post.category.name}
            </Link>
          )}
        </div>
      </header>

      {post.coverImage && (
        <figure className="vf-article-cover">
          <Image
            src={post.coverImage}
            // A cover image is content, not decoration, so it gets a real alt.
            // Falling back to the title is better than an empty string here: it
            // is at least an accurate description of what the picture is of.
            alt={post.coverAlt || post.title}
            width={1284}
            height={684}
            priority
            /* The cover occupies column one of `.vf-article-grid`, which is
               656px wide. It previously spanned both columns and this said
               968px; that overstated the slot by 312px AND collided with the
               rail, which lives in column two of the same row.
               The sizing itself lives in blog.css (`aspect-ratio: 16/9` plus
               `object-fit: cover`), so no height is set here. */
            sizes="(max-width: 1100px) 100vw, 656px"
          />
        </figure>
      )}
    </>
  );
}
