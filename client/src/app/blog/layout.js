import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import JsonLd from '@/components/blog/JsonLd';
import { blogGraph } from '@/lib/blog/schema';
import { SITE_URL, site } from '@/config/site';

import './blog.css';

/**
 * Chrome shared by every blog route.
 *
 * `base="/"` on Nav and Footer is not cosmetic: every entry in the site nav is
 * a same-page anchor (`#how`, `#proof`). On the homepage those are correct; on
 * a blog route they scroll to nothing, which silently makes the entire primary
 * navigation inert. Rebasing them to `/#how` sends a reader home and to the
 * right section.
 *
 * The Organization / WebSite / Blog nodes are emitted HERE, once. Google merges
 * every JSON-LD block on a page into one dataset, so the `@id`s minted in this
 * layout resolve from the article graph rendered inside it — which is why an
 * article can say `publisher: {"@id": ".../#organization"}` instead of
 * re-describing the company on every post. Re-describing it is how a site ends
 * up asserting forty slightly different versions of the same entity.
 */
export const metadata = {
  title: {
    default: `Blog · ${site.name}`,
    // Overrides the root template so an article title is not suffixed twice.
    template: `%s · ${site.name}`,
  },
  alternates: {
    /**
     * NO `canonical` here.
     *
     * Metadata is inherited, so a canonical on the layout becomes the default
     * for every route beneath it — and any route that forgets to override it
     * then declares itself a duplicate of /blog. That is not a cosmetic
     * mistake: a page carrying `noindex` AND a canonical pointing at a
     * different URL can propagate the noindex to the canonical target, so a
     * forgotten override on the search page is a mechanism for de-indexing the
     * blog index itself. Each route sets its own.
     *
     * The feed alternate DOES belong here: it is genuinely the same for every
     * page under /blog, and it is what makes the RSS discoverable to readers
     * and to feed crawlers from any article.
     */
    types: {
      'application/rss+xml': [{ url: `${SITE_URL}/blog/feed.xml`, title: `${site.name} blog` }],
    },
  },
};

export default function BlogLayout({ children }) {
  return (
    <>
      {/* First stop for a keyboard user; invisible until it takes focus. */}
      <a href="#main" className="vf-skip">
        Skip to content
      </a>
      <Nav base="/" />
      <JsonLd graph={blogGraph} />
      <div className="vf-blog">
        {/* tabIndex is mandatory or the skip link moves the viewport without
            moving focus, and the next Tab goes straight back into the nav. */}
        <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
          {children}
        </main>
      </div>
      <Footer base="/" />
    </>
  );
}
