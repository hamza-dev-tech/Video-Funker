/**
 * The two values that change when this app moves.
 *
 * Both are read as full `process.env.NEXT_PUBLIC_*` expressions on purpose:
 * Next substitutes the literal text at build time, so destructuring the env
 * object or building the key dynamically yields `undefined` in the browser
 * bundle with nothing to show for it at build time.
 */

/**
 * Where the API lives.
 *
 * The Vite build had this fallback written out at four separate call sites with
 * three different values — `https://canws.in/api`, `http://localhost:3001/api`
 * and `http://localhost:5000/api` — so a developer with the env var unset had
 * three of their features talking to a stranger's production server and the
 * rest talking to two ports that were not listening. One constant, one default,
 * pointing at the port `api/` actually starts on.
 *
 * Deliberately NOT `NEXT_PUBLIC_API_URL`: that name is already taken by the
 * marketing site's lead-capture BFF (see config/site.js), which is a different
 * service on a different port with a different contract.
 */
export const API_BASE = process.env.NEXT_PUBLIC_PRODUCT_API_URL || 'http://localhost:3001/api';

/**
 * The path this SPA is mounted at, handed to react-router as its `basename`.
 *
 * Every route the app declares is written from `/` — `/auth`, `/campaigns`,
 * `/settings` — and the basename is what turns those into the /app/* URLs the
 * browser actually shows. Set NEXT_PUBLIC_PRODUCT_BASE_PATH to `/` on a
 * deployment that serves the product at the root of its own hostname
 * (app.videofunker.ai), and every link, redirect and Back button follows.
 *
 * It must agree with the rewrite in next.config.mjs. They are the same fact
 * stated to two systems that cannot see each other.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_PRODUCT_BASE_PATH || '/app';
