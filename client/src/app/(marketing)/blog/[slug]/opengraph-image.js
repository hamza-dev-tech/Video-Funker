import { ImageResponse } from 'next/og';

import { getPostCard } from '@/lib/blog/queries';
import { site } from '@/config/site';

export const alt = 'Video Funker article';
/**
 * 1200×630 is the size every platform crops from. Exported (not inlined)
 * because the article's JSON-LD imports it to declare the image's real
 * dimensions — an ImageObject whose width and height are guesses is worse than
 * one with none.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Per-article social card, rendered at request time and cached.
 *
 * The alternative — one static OG image for the whole blog — means every link
 * anyone shares looks identical, so a reader cannot tell two shared articles
 * apart in a feed. The title is the entire value here, which is why the layout
 * is built around giving it room rather than around branding.
 *
 * getPostCard, not getPostBySlug: the card variant skips the HTML sanitisation
 * pipeline entirely. Running a full parse of the article body to render a
 * picture of its title would be the single most wasteful request on the site.
 */
export default async function OgImage({ params }) {
  const { slug } = await params;

  let post = null;
  try {
    post = await getPostCard(slug);
  } catch {
    // A CMS outage must not turn a share into a broken image. Fall through to
    // the branded card below.
  }

  const title = (post && post.title) || `${site.name} blog`;
  const category = post && post.category ? post.category.name : 'Video Funker';
  const author = post && post.author ? post.author.name : site.name;

  // Long titles need to step down or they overflow the card. Three steps, not
  // a continuous scale, so the type stays on a system.
  const titleSize = title.length > 95 ? 52 : title.length > 60 ? 62 : 74;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 72px',
          background: 'linear-gradient(135deg, #033f80 0%, #0560be 55%, #0668cc 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ff901b',
              color: '#2a1a04',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              padding: '10px 20px',
              borderRadius: 100,
            }}
          >
            {category}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: titleSize,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: -1.5,
            // Satori has no multi-line clamp, so an absurd title is cut in the
            // data rather than by CSS that will not run.
            maxWidth: 1000,
          }}
        >
          {title.length > 130 ? `${title.slice(0, 127)}…` : title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#b9d6f2', fontWeight: 500 }}>{author}</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#ffffff', fontWeight: 700 }}>
            {site.domain}
          </div>
        </div>
      </div>
    ),
    size
  );
}
