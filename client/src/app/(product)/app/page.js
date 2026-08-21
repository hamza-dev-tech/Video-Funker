import ProductApp from './ProductApp';

/**
 * The single Next route behind the entire product app.
 *
 * Every URL under /app — /app/campaigns, /app/film, /app/settings/… — is
 * rewritten to this one route in next.config.mjs, and react-router takes it
 * from there on the client.
 *
 * The alternative was a catch-all segment (`app/[[...slug]]/page.js`). It was
 * rejected because Next keys a rendered segment by its parameters: /app/film
 * and /app/settings are two different values of `slug`, so every navigation
 * and every browser Back would tear the whole SPA down and rebuild it, losing
 * the React Query cache and every piece of component state with it. A rewrite
 * keeps the segment identical for all of them, so Next re-renders nothing and
 * react-router does the only routing that happens.
 */
export const metadata = {
  title: 'Video Funker',
  robots: { index: false, follow: false },
};

export default function ProductAppRoute() {
  return <ProductApp />;
}
