import Image from 'next/image';
import Link from 'next/link';

import { formatDate, isoDate, readingLabel } from '@/lib/blog/format';
import { c, font } from '@/config/site';

/**
 * The lead card at the top of /blog.
 *
 * Its image is the LCP element of the page, so it is `priority` — which is the
 * whole reason this is a separate component rather than a variant flag on
 * PostCard. Marking a card `priority` inside a mapped grid is how sites end up
 * preloading nine images and making the metric worse.
 */
export default function FeaturedPost({ post }) {
  if (!post) return null;
  const href = `/blog/${post.slug}`;

  return (
    <article className="vf-feature">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="vf-feature-media">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            priority
            /**
             * These numbers are MEASURED, not estimated, and that distinction
             * is the whole point of this attribute.
             *
             * The layout: `.vf-shell` is max-width 1160 with 40px padding, so
             * the content box caps at 1080. `.vf-feature` splits it
             * 1.15fr / 1fr, which puts this image at 577px once the shell has
             * hit its max width — measured in the browser at exactly 576.8px.
             *
             * It previously said `60vw`, which is 768px at a 1280 viewport —
             * a third wider than the slot ever gets. Two things went wrong at
             * once. The preload scanner resolved 60vw and fetched the 828w
             * candidate, which the img element then did not use ("preloaded
             * but not used within a few seconds" in the console). And the img
             * itself resolved to the 384w candidate for a 577px slot at DPR
             * 1.25 — needing 721 device pixels and getting 384, i.e. a visibly
             * soft LCP image.
             *
             * An accurate value makes the preload and the element agree on one
             * candidate, which is the only way a priority image is worth
             * preloading at all.
             */
            sizes="(max-width: 900px) 100vw, (max-width: 1240px) 54vw, 578px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span className="vf-feature-media-empty" aria-hidden="true" />
        )}
      </Link>

      <div className="vf-feature-body">
        <div className="vf-postcard-meta">
          <span className="vf-pill vf-pill-accent">Latest</span>
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

        <h2 className="vf-feature-title">
          <Link href={href}>{post.title}</Link>
        </h2>

        {post.excerpt && <p className="vf-feature-excerpt">{post.excerpt}</p>}

        <div className="vf-postcard-foot">
          {post.author && post.author.avatar ? (
            <Image src={post.author.avatar} alt="" width={28} height={28} style={{ borderRadius: 999, display: 'block' }} />
          ) : null}
          <span style={{ color: c.ink, font: `600 14px ${font.body}` }}>
            {post.author ? post.author.name : 'Video Funker'}
          </span>
          {post.publishedAt && (
            <>
              <span aria-hidden="true" style={{ color: c.lineStrong }}>·</span>
              <time dateTime={isoDate(post.publishedAt)} style={{ color: c.soft, font: `400 14px ${font.body}` }}>
                {formatDate(post.publishedAt)}
              </time>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
