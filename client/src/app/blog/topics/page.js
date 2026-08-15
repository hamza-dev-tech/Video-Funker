import Link from 'next/link';

import BlogCTA from '@/components/blog/BlogCTA';
import Breadcrumbs from '@/components/blog/Breadcrumbs';
import JsonLd from '@/components/blog/JsonLd';
import { getCategoryTree, getTags, MIN_INDEXABLE_TAG_POSTS } from '@/lib/blog/queries';
import { collectionGraph } from '@/lib/blog/schema';
import { blogAlternates } from '@/lib/blog/metadata';
import { c, font, site, type } from '@/config/site';

export const revalidate = 3600;

const DESCRIPTION = 'Every subject the Video Funker blog covers, in one place.';

export const metadata = {
  title: 'All topics',
  description: DESCRIPTION,
  alternates: blogAlternates('/blog/topics'),
  openGraph: { type: 'website', url: '/blog/topics', title: `All topics · ${site.name}`, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: `All topics · ${site.name}`, description: DESCRIPTION },
};

/**
 * The topic hub.
 *
 * It exists for internal linking, not for readers arriving from search. A blog
 * whose only paths into older material are the paginated index and a related
 * rail buries everything past page two — this gives every category and every
 * substantial tag one hop from a single indexable page.
 */
export default async function TopicsPage() {
  const [tree, tags] = await Promise.all([getCategoryTree(), getTags()]);

  const trail = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: 'Topics' }];

  return (
    <>
      <JsonLd
        graph={collectionGraph({ path: '/blog/topics', name: 'All topics', description: DESCRIPTION, trail })}
      />

      <div className="vf-shell">
        <header className="vf-blog-hero">
          <Breadcrumbs trail={trail} />
          <h1 style={{ font: `800 ${type.h2}/1.06 ${font.display}`, color: c.ink, marginTop: 16 }}>
            All topics
          </h1>
          <p style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, marginTop: 16 }}>
            {DESCRIPTION}
          </p>
        </header>

        <section aria-labelledby="vf-sections-heading" style={{ marginTop: 40 }}>
          <h2 id="vf-sections-heading" style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink }}>
            Sections
          </h2>

          {tree.length === 0 ? (
            <p style={{ font: `400 16px ${font.body}`, color: c.muted, marginTop: 16 }}>
              No sections yet.
            </p>
          ) : (
            <div className="vf-topics">
              {tree.map((cat) => (
                <article key={cat.slug} className="vf-topic-card">
                  <h3 style={{ font: `700 20px ${font.display}`, color: c.ink }}>
                    <Link href={`/blog/category/${cat.slug}`}>{cat.name}</Link>
                  </h3>
                  <p style={{ font: `500 12px ${font.body}`, color: c.soft, marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {cat.count} {cat.count === 1 ? 'article' : 'articles'}
                  </p>
                  {cat.description && (
                    <p style={{ font: `400 15px/1.6 ${font.body}`, color: c.muted, marginTop: 12 }}>
                      {cat.description}
                    </p>
                  )}
                  {cat.children.length > 0 && (
                    <ul style={{ listStyle: 'none', marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cat.children.map((child) => (
                        <li key={child.slug}>
                          <Link href={`/blog/category/${child.slug}`} className="vf-chip">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="vf-tags-heading" style={{ marginTop: 56 }}>
          <h2 id="vf-tags-heading" style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink }}>
            Tags
          </h2>
          <p style={{ font: `400 15px/1.6 ${font.body}`, color: c.muted, marginTop: 10, maxWidth: '40em' }}>
            {/* Says out loud what the noindex rule below is doing, rather than
                leaving a reader to wonder why some tags look different. */}
            Tags with at least {MIN_INDEXABLE_TAG_POSTS} articles are listed for search engines too;
            the rest are here for browsing.
          </p>

          {tags.length === 0 ? (
            <p style={{ font: `400 16px ${font.body}`, color: c.muted, marginTop: 16 }}>No tags yet.</p>
          ) : (
            <div className="vf-tagcloud">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className={`vf-chip${tag.count >= MIN_INDEXABLE_TAG_POSTS ? '' : ' vf-chip-quiet'}`}
                >
                  {tag.name}
                  <span style={{ color: c.soft, marginLeft: 8, fontWeight: 500 }}>{tag.count}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <BlogCTA />
        <div style={{ height: 88 }} />
      </div>
    </>
  );
}
