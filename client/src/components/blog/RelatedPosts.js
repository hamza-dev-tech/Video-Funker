import PostCard from './PostCard';
import { c, font, type } from '@/config/site';

/**
 * The tail rail.
 *
 * Renders nothing when empty rather than a "no related posts" placeholder —
 * the absence is not information a reader needs, and the placeholder is a
 * template tell.
 */
export default function RelatedPosts({ posts, category }) {
  if (!posts || !posts.length) return null;

  return (
    <section className="vf-related" aria-labelledby="vf-related-heading">
      <h2 id="vf-related-heading" style={{ font: `800 ${type.h3}/1.15 ${font.display}`, color: c.ink, letterSpacing: '-0.02em' }}>
        {category ? `More on ${category.toLowerCase()}` : 'Keep reading'}
      </h2>
      <div className="vf-postgrid" style={{ marginTop: 28 }}>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
