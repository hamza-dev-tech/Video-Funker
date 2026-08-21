import { notFound } from 'next/navigation';

import BlogCTA from '@/components/blog/BlogCTA';
import Breadcrumbs from '@/components/blog/Breadcrumbs';
import JsonLd from '@/components/blog/JsonLd';
import Pagination from '@/components/blog/Pagination';
import PostGrid from '@/components/blog/PostGrid';
import { getPostsByTag, getTags, MIN_INDEXABLE_TAG_POSTS, POSTS_PER_PAGE } from '@/lib/blog/queries';
import { collectionGraph } from '@/lib/blog/schema';
import { blogAlternates } from '@/lib/blog/metadata';
import { c, font, site, type } from '@/config/site';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only the tags that clear the indexable threshold get prerendered. The rest
  // still render on demand — they are simply not worth build time or a slot in
  // the sitemap.
  const tags = await getTags();
  return tags.filter((t) => t.count >= MIN_INDEXABLE_TAG_POSTS).map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params, searchParams }) {
  const [{ tag: slug }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query && query.page) || 1);
  const { tag, total } = await getPostsByTag(slug, page);
  if (!tag) return { title: 'Tag not found', robots: { index: false, follow: true } };

  const base = `/blog/tag/${tag.slug}`;
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  const title = page > 1 ? `${tag.name} — page ${page}` : tag.name;
  const description = `Articles tagged ${tag.name} from the ${site.name} team.`;

  /**
   * A tag archive with one or two posts is a near-duplicate of those posts with
   * none of their content — thin content, and at scale a pile of them burns the
   * crawl budget that should be reaching articles.
   *
   * `follow: true` matters as much as `index: false`. noindex,nofollow would
   * also stop the crawler using this page to REACH the articles on it, which
   * throws away the one thing a small archive is genuinely good for.
   *
   * MIN_INDEXABLE_TAG_POSTS is imported rather than written here, because
   * sitemap.js applies the same threshold. If the two drift, the sitemap asks
   * Google to crawl a URL whose own meta tag then tells it to drop the result —
   * a self-contradiction that Search Console reports as an error.
   */
  const indexable = total >= MIN_INDEXABLE_TAG_POSTS;

  return {
    title,
    description,
    alternates: blogAlternates(canonical),
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { type: 'website', url: canonical, title: `${title} · ${site.name}`, description },
    twitter: { card: 'summary_large_image', title: `${title} · ${site.name}`, description },
  };
}

export default async function TagPage({ params, searchParams }) {
  const [{ tag: slug }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query && query.page) || 1);

  const { posts, total, tag } = await getPostsByTag(slug, page);
  if (!tag) notFound();

  const path = `/blog/tag/${tag.slug}`;
  const trail = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Topics', href: '/blog/topics' },
    { name: tag.name },
  ];

  return (
    <>
      <JsonLd
        graph={collectionGraph({
          path,
          name: tag.name,
          description: `Articles tagged ${tag.name}.`,
          posts,
          trail,
        })}
      />

      <div className="vf-shell">
        <header className="vf-blog-hero">
          <Breadcrumbs trail={trail} />
          <p style={{ font: `700 12px ${font.display}`, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.orangeDark, marginTop: 16 }}>
            Tagged
          </p>
          <h1 style={{ font: `800 ${type.h2}/1.06 ${font.display}`, color: c.ink, marginTop: 10 }}>
            {tag.name}
          </h1>
          <p style={{ font: `500 14px ${font.body}`, color: c.soft, marginTop: 14 }}>
            {total} {total === 1 ? 'article' : 'articles'}
          </p>
        </header>

        <PostGrid
          posts={posts}
          emptyTitle={`Nothing tagged ${tag.name}`}
          emptyBody="Nothing carries this tag yet."
        >
          <a href="/blog/topics" className="vf-chip is-active" style={{ marginTop: 20 }}>
            Browse all topics
          </a>
        </PostGrid>

        <Pagination page={page} total={total} perPage={POSTS_PER_PAGE} basePath={path} />

        <BlogCTA />
        <div style={{ height: 88 }} />
      </div>
    </>
  );
}
