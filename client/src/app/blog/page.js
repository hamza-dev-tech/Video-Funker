import BlogCTA from '@/components/blog/BlogCTA';
import BlogToolbar from '@/components/blog/BlogToolbar';
import FeaturedPost from '@/components/blog/FeaturedPost';
import JsonLd from '@/components/blog/JsonLd';
import Pagination from '@/components/blog/Pagination';
import PostGrid from '@/components/blog/PostGrid';
import { getCategories, getPublishedPosts, POSTS_PER_PAGE } from '@/lib/blog/queries';
import { collectionGraph } from '@/lib/blog/schema';
import { blogAlternates } from '@/lib/blog/metadata';
import { c, font, site, type } from '@/config/site';

/**
 * Revalidated hourly as a floor. On the WordPress source the publish webhook
 * invalidates the `wp:list` tag immediately, so this only ever binds when that
 * webhook is broken — which is the one case where a stale index is better than
 * a frozen one.
 */
export const revalidate = 3600;

const DESCRIPTION =
  'How founder-led video actually gets made, distributed and measured. Written by the team that produces it.';

/**
 * Paginated metadata, which is where most blogs quietly lose their archive.
 *
 * Page 2 SELF-canonicalises. The common alternative — canonical to /blog on
 * every page — tells Google that pages 2..n are duplicates of page one, so it
 * drops them, and every article that only appears on page 3 loses its
 * discovery path. Each page is a genuinely different list and says so.
 *
 * The title carries the page number for the same reason: without it every page
 * of the archive competes for one query with an identical title, which is the
 * duplicate-title warning in Search Console.
 */
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params && params.page) || 1);
  const canonical = page > 1 ? `/blog?page=${page}` : '/blog';
  const title = page > 1 ? `Blog — page ${page}` : 'Blog';

  return {
    title,
    description: DESCRIPTION,
    alternates: blogAlternates(canonical),
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${title} · ${site.name}`,
      description: DESCRIPTION,
    },
    twitter: { card: 'summary_large_image', title: `${title} · ${site.name}`, description: DESCRIPTION },
  };
}

export default async function BlogIndex({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params && params.page) || 1);

  const [{ posts, total }, categories] = await Promise.all([
    getPublishedPosts(page),
    getCategories(),
  ]);

  // The lead card is the newest post, and only on page one. Repeating it at the
  // top of every page would show the same article five times in one archive.
  const featured = page === 1 ? posts[0] : null;
  const rest = featured ? posts.slice(1) : posts;

  const graph = collectionGraph({
    path: '/blog',
    name: `${site.name} blog`,
    description: DESCRIPTION,
    posts,
    trail: [{ name: 'Home', href: '/' }, { name: 'Blog' }],
  });

  return (
    <>
      <JsonLd graph={graph} />

      <div className="vf-shell">
        <header className="vf-blog-hero">
          <p style={{ font: `700 12px ${font.display}`, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.orangeDark }}>
            The Video Funker blog
          </p>
          <h1 style={{ font: `800 ${type.h2}/1.05 ${font.display}`, color: c.ink, marginTop: 14 }}>
            Video that books meetings.
          </h1>
          <p style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, marginTop: 18 }}>
            {DESCRIPTION}
          </p>
        </header>

        <BlogToolbar categories={categories} />

        {featured && <FeaturedPost post={featured} />}

        <div style={{ marginTop: featured ? 0 : 36 }}>
          <PostGrid
            posts={rest}
            emptyTitle={page > 1 ? 'Nothing on this page' : 'The first articles are on their way'}
            emptyBody={
              page > 1
                ? 'This page is past the end of the archive. Start again from the beginning.'
                : 'We publish what we learn from the campaigns we run. Check back shortly.'
            }
          >
            <a href="/blog" className="vf-chip is-active" style={{ marginTop: 20 }}>
              Back to the blog
            </a>
          </PostGrid>
        </div>

        <Pagination page={page} total={total} perPage={POSTS_PER_PAGE} basePath="/blog" />

        <BlogCTA />
        <div style={{ height: 88 }} />
      </div>
    </>
  );
}
