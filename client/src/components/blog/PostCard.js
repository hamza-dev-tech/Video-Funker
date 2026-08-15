import Image from 'next/image';
import Link from 'next/link';

import { formatDate, isoDate, readingLabel } from '@/lib/blog/format';
import { c, font } from '@/config/site';

/**
 * One post in a listing.
 *
 * The whole card is NOT wrapped in an anchor. A card-sized link makes the
 * accessible name the entire contents — a screen reader announces title, date,
 * reading time, category and excerpt as one enormous link label, and it makes
 * selecting the excerpt text with a mouse impossible. Instead the title is the
 * link and it carries a pseudo-element that covers the card, so the whole
 * surface is still clickable. `.vf-postcard a::after` in globals.css.
 *
 * The category pill sits ABOVE that overlay (z-index) so it stays its own
 * separate link rather than being swallowed by the title's hit area.
 */
export default function PostCard({ post, priority = false, sizes }) {
  if (!post) return null;
  const href = `/blog/${post.slug}`;

  return (
    <article className="vf-postcard">
      {post.coverImage ? (
        <Link href={href} tabIndex={-1} aria-hidden="true" className="vf-postcard-media">
          <Image
            src={post.coverImage}
            alt=""
            fill
            /**
             * Measured against the real grid, not guessed.
             *
             * `.vf-postgrid` is `repeat(auto-fill, minmax(300px, 1fr))` with a
             * 28px gap inside the shell's 1080px content box, which resolves to
             * three columns of 341px — confirmed in the browser at 341.3px.
             * Below 720px it collapses to one column inside 20px padding.
             *
             * The old value said 33vw, which reads as 422px at a 1280 viewport
             * against a slot that is never wider than 341. An overstated
             * `sizes` is not harmless rounding: it makes every card in the grid
             * fetch the next candidate up, so the page pays for pixels it will
             * only throw away when it scales the image down.
             */
            sizes={sizes || '(max-width: 720px) calc(100vw - 40px), (max-width: 1240px) 31vw, 341px'}
            priority={priority}
            style={{ objectFit: 'cover' }}
          />
        </Link>
      ) : (
        // Not an empty box: a card with no image next to cards with images
        // reads as a broken image rather than a deliberate absence.
        <div className="vf-postcard-media vf-postcard-media-empty" aria-hidden="true">
          <span>{post.category ? post.category.name : 'Video Funker'}</span>
        </div>
      )}

      <div className="vf-postcard-body">
        <div className="vf-postcard-meta">
          {post.category && (
            <Link href={`/blog/category/${post.category.slug}`} className="vf-pill">
              {post.category.name}
            </Link>
          )}
          {post.readingMinutes ? (
            <span style={{ color: c.soft, font: `500 12px ${font.body}` }}>
              {readingLabel(post.readingMinutes)}
            </span>
          ) : null}
        </div>

        <h3 className="vf-postcard-title">
          <Link href={href}>{post.title}</Link>
        </h3>

        {post.excerpt && <p className="vf-postcard-excerpt">{post.excerpt}</p>}

        <div className="vf-postcard-foot">
          {post.author && post.author.avatar ? (
            <Image
              src={post.author.avatar}
              alt=""
              width={24}
              height={24}
              style={{ borderRadius: 999, display: 'block' }}
            />
          ) : null}
          <span style={{ color: c.muted, font: `500 13px ${font.body}` }}>
            {post.author ? post.author.name : 'Video Funker'}
          </span>
          {post.publishedAt && (
            <>
              <span aria-hidden="true" style={{ color: c.lineStrong }}>·</span>
              <time dateTime={isoDate(post.publishedAt)} style={{ color: c.soft, font: `400 13px ${font.body}` }}>
                {formatDate(post.publishedAt)}
              </time>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
