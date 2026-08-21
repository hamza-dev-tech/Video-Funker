/**
 * The product route family — everything under /app.
 *
 * Sibling to `(marketing)`, and the boundary is load-bearing: this layout
 * imports the product stylesheet (Tailwind preflight + the shadcn design
 * tokens) and the marketing one imports `globals.css`. Next only ships a
 * segment's CSS on the routes below it, so neither sheet ever reaches the
 * other's routes — which is the only reliable way to run two design systems out
 * of one Next app. The marketing reset alone (`* { margin:0; padding:0 }`,
 * `a:hover { opacity:.85 }`, and a deliberate refusal of border-box) would take
 * apart every shadcn control it touched.
 *
 * The two product faces are declared on <html> by the ROOT layout, not here —
 * see the comment there for why (portals).
 */
import './product.css';

/**
 * `robots: noindex` for the whole family.
 *
 * Every URL under /app is either a login wall or a signed-in workspace. Left
 * indexable, Google crawls them, gets the same client-rendered shell back for
 * all of them, and the marketing domain accumulates dozens of near-duplicate
 * thin pages competing with the ones meant to rank. Declaring it on the layout
 * covers every route in the group, including any added later.
 */
export const metadata = {
  title: 'Video Funker',
  robots: { index: false, follow: false },
};

export default function ProductLayout({ children }) {
  return <div className="vf-product">{children}</div>;
}
