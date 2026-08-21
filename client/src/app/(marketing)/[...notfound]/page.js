import { notFound } from 'next/navigation';

/**
 * The lowest-priority route on the site: it matches any path nothing else
 * claimed, and immediately 404s.
 *
 * This exists because of where `globals.css` now lives. Next renders the root
 * `app/not-found.js` OUTSIDE the normal route tree, and does not collect the
 * stylesheets that file imports — verified on a production build, where
 * `_not-found.html` linked only the font chunk no matter what the file
 * imported. With the marketing stylesheet moved off the root layout (so it
 * cannot reach /app), that left the 404 rendering the nav and footer with no
 * CSS at all: black Helvetica on white, which is exactly the bare default the
 * page was written to avoid.
 *
 * Matching the URL with a real route inside `(marketing)` puts the 404 back
 * inside the layout tree. `notFound()` then renders `(marketing)/not-found.js`
 * beneath `(marketing)/layout.js`, which brings `globals.css` with it, and
 * still sends HTTP 404 — rendering the page directly from here would style it
 * correctly and answer 200, which is far worse than an ugly 404.
 *
 * Precedence makes this safe: static and dynamic segments both beat a
 * catch-all, so every real page, every metadata route (robots.txt, sitemap.xml,
 * the icons) and the /app rewrite are matched before this is considered.
 */
export default function CatchAllNotFound() {
  notFound();
}
