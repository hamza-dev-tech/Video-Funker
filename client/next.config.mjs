/** @type {import('next').NextConfig} */

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
   * The client is split into two route families, and both are now served by
   * this Next app:
   *
   *   /            → the marketing site        (app/(marketing)/**)
   *   /app/*       → the product workspace     (app/(product)/app/page.js)
   *
   * These four routes used to 301 out to a separate deployment on
   * app.videofunker.ai. The product is in this repository now, so the redirects
   * are gone — leaving them would send every signed-in user off this origin and
   * make /app unreachable no matter what was built here.
   */

  /**
   * One rewrite is what makes deep links into the SPA work.
   *
   * The product is a react-router application: it owns /app/campaigns,
   * /app/film, /app/settings and everything else below /app on the CLIENT. The
   * server knows none of those paths, so a cold load or a refresh on any of
   * them would 404 before React ever ran. This hands all of them the one route
   * that boots the SPA, which then reads window.location and renders the right
   * screen.
   *
   * `:path+` (one or more segments) rather than `:path*` (zero or more): with
   * `*` the rule also matches /app itself and rewrites it to itself, which is a
   * no-op Next has to resolve on every request to the busiest URL in the app.
   *
   * This must agree with `BASE_PATH` in src/product/config.ts — same fact,
   * stated to two systems that cannot see each other.
   */
  async rewrites() {
    return [{ source: '/app/:path+', destination: '/app' }];
  },

  /**
   * `permanent: false` on both.
   *
   * These are 307s deliberately. A 301 is cached by the browser more or less
   * forever, and /login and /signup are exactly the URLs whose destination
   * moves — the day the product gets its own hostname, or the auth screen gets
   * its own route, a cached 301 keeps sending returning visitors to the old
   * place with no way to clear it. Neither URL carries any SEO weight worth
   * consolidating (both destinations are noindex), so the permanence buys
   * nothing and costs the ability to change our minds.
   */
  async redirects() {
    return [
      { source: '/login', destination: '/app/auth', permanent: false },
      { source: '/signup', destination: '/app/auth?mode=signup', permanent: false },
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
