/** @type {import('next').NextConfig} */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.videofunker.ai';

/** One year in seconds, the ceiling every HTTP cache respects. */
const YEAR = 31536000;

/**
 * `next dev` serves /_next/static with `no-store` so a chunk edited by HMR is
 * actually re-fetched. Forcing an immutable year onto it in development would
 * pin stale JavaScript into the browser and make every edit look like it did
 * nothing, so the long-lived headers below are production-only. In production
 * they are the correct answer: /_next/static filenames carry a content hash,
 * and the files under /shots, /art, /brand and /icons are only ever replaced by
 * a deploy.
 */
const isProd = process.env.NODE_ENV === 'production';

const IMMUTABLE = [{ key: 'Cache-Control', value: `public, max-age=${YEAR}, immutable` }];

/**
 * Headless WordPress hands back an absolute cover-image URL on the CMS host,
 * and next/image rejects any host that is not declared here. The host is only
 * knowable from the environment, so it is read rather than hard-coded, and a
 * malformed value returns an empty list instead of throwing: a typo in an env
 * var should cost the blog its cover images, not stop the config loading.
 */
function cmsImagePatterns() {
  const raw = process.env.WP_PUBLIC_ORIGIN || process.env.WP_API_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port,
        pathname: '/**',
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * AVIF first, WebP second, original format last. The screenshots under
   * /shots are 2794px wide and the wall art under /art is 1788px wide, so
   * every one of them is resized by the optimiser before it reaches a browser
   * and the source format never ships.
   *
   * `minimumCacheTTL` is how long an optimised variant stays in the on-disk
   * cache. A year is safe here because the cache key is the source path, and
   * these sources only change on a deploy. If a source file is ever replaced
   * without its path changing, the optimiser cache has to be cleared with it.
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: YEAR,
    remotePatterns: cmsImagePatterns(),
  },

  /**
   * The client is split into two route families:
   *
   *   /            → the marketing site, rendered by this Next app
   *   /app/*       → the product, which lives on its own deployment at
   *                  app.videofunker.ai
   *
   * Keeping the product behind a redirect (rather than hard-coding the
   * subdomain into every link) means the marketing site can talk about
   * "/app/login" internally and still work if the product ever moves.
   */
  /**
   * `permanent: true` on the four product routes.
   *
   * A 307 tells Google the destination is temporary, so it keeps the source
   * URL in the index, keeps re-crawling it, and passes no signal to where the
   * product actually lives. These four destinations are not going to move
   * back, so a 301 is the honest answer: it consolidates onto app.videofunker.ai
   * and stops four URLs on the marketing domain being crawled forever for
   * nothing. It is also cacheable by the browser, which the 307 was not.
   */
  async redirects() {
    return [
      { source: '/app', destination: APP_URL, permanent: true },
      { source: '/app/:path*', destination: `${APP_URL}/:path*`, permanent: true },
      { source: '/login', destination: `${APP_URL}/login`, permanent: true },
      { source: '/signup', destination: `${APP_URL}/signup`, permanent: true },
    ];
  },

  async headers() {
    const security = {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    };

    if (!isProd) return [security];

    return [
      security,
      { source: '/_next/static/:path*', headers: IMMUTABLE },
      { source: '/shots/:path*', headers: IMMUTABLE },
      { source: '/art/:path*', headers: IMMUTABLE },
      { source: '/brand/:path*', headers: IMMUTABLE },
      { source: '/icons/:path*', headers: IMMUTABLE },
    ];
  },
};

export default nextConfig;
