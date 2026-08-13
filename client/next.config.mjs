/** @type {import('next').NextConfig} */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.videofunker.ai';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

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
  async redirects() {
    return [
      { source: '/app', destination: APP_URL, permanent: false },
      { source: '/app/:path*', destination: `${APP_URL}/:path*`, permanent: false },
      { source: '/login', destination: `${APP_URL}/login`, permanent: false },
      { source: '/signup', destination: `${APP_URL}/signup`, permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
