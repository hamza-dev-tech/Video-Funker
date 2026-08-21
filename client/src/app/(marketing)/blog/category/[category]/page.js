import { notFound, permanentRedirect } from 'next/navigation';

import BlogCTA from '@/components/blog/BlogCTA';
import BlogToolbar from '@/components/blog/BlogToolbar';
import Breadcrumbs from '@/components/blog/Breadcrumbs';
import JsonLd from '@/components/blog/JsonLd';
import Pagination from '@/components/blog/Pagination';
import PostGrid from '@/components/blog/PostGrid';
import {
  getCategories,
  getPostsByCategory,
  POSTS_PER_PAGE,
  resolveTermRedirect,
} from '@/lib/blog/queries';
import { collectionGraph } from '@/lib/blog/schema';
import { blogAlternates } from '@/lib/blog/metadata';
import { c, font, site, type } from '@/config/site';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Non-empty categories only. Prerendering an empty archive spends build time
  // producing a page that says nothing, and it is still reachable on demand.
  const categories = await getCategories();
  return categories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params, searchParams }) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query && query.page) || 1);
  const { category } = await getPostsByCategory(slug, page);
  if (!category) return { title: 'Category not found', robots: { index: false, follow: true } };

  const base = `/blog/category/${category.slug}`;
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  const title = page > 1 ? `${category.name} — page ${page}` : category.name;
  // The term's own description, not a template. "Articles about X" on forty
  // archives is forty near-identical descriptions, which is exactly what makes
  // Google treat archives as thin.
  const description =
    category.description || `Articles on ${category.name.toLowerCase()} from the ${site.name} team.`;

  return {
    title,
    description,
    alternates: blogAlternates(canonical),
    openGraph: { type: 'website', url: canonical, title: `${title} · ${site.name}`, description },
    twitter: { card: 'summary_large_image', title: `${title} · ${site.name}`, description },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query && query.page) || 1);

  const [{ posts, total, category }, categories] = await Promise.all([
    getPostsByCategory(slug, page),
    getCategories(),
  ]);

  if (!category) {
    // The term was renamed. 301 rather than 404, or every link into the old
    // archive dies silently.
    const redirect = await resolveTermRedirect(slug, 'category');
    if (redirect && redirect.kind === 'renamed') {
      permanentRedirect(`/blog/category/${redirect.slug}`);
    }
    notFound();
  }

  const path = `/blog/category/${category.slug}`;
  const trail = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: category.name }];

  return (
    <>
      <JsonLd
        graph={collectionGraph({
          path,
          name: category.name,
          description: category.description,
          posts,
          trail,
        })}
      />

      <div className="vf-shell">
        <header className="vf-blog-hero">
          <Breadcrumbs trail={trail} />
          <h1 style={{ font: `800 ${type.h2}/1.06 ${font.display}`, color: c.ink, marginTop: 16 }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, marginTop: 16 }}>
              {category.description}
            </p>
          )}
          <p style={{ font: `500 14px ${font.body}`, color: c.soft, marginTop: 14 }}>
            {total} {total === 1 ? 'article' : 'articles'}
          </p>
        </header>

        <BlogToolbar categories={categories} active={category.slug} />

        <div style={{ marginTop: 36 }}>
          <PostGrid
            posts={posts}
            emptyTitle={`Nothing filed under ${category.name} yet`}
            emptyBody="This section exists but has no articles in it. The rest of the blog does."
          >
            <a href="/blog" className="vf-chip is-active" style={{ marginTop: 20 }}>
              Read everything
            </a>
          </PostGrid>
        </div>

        <Pagination page={page} total={total} perPage={POSTS_PER_PAGE} basePath={path} />

        <BlogCTA
          heading={`Want ${category.name.toLowerCase()} handled for you?`}
          body="One intake call becomes a month of feed-ready video, scripts and outreach. The first video is free."
        />
        <div style={{ height: 88 }} />
      </div>
    </>
  );
}
