import PostCard from './PostCard';
import { c, font } from '@/config/site';

/**
 * The listing grid, plus the empty state.
 *
 * The empty state is a real component concern rather than a route concern
 * because five routes can produce it (index, category, tag, search, topic) and
 * a blank <div> is indistinguishable from a rendering failure. It always says
 * what was searched for and offers a way out.
 */
export default function PostGrid({ posts, emptyTitle, emptyBody, children }) {
  if (!posts || !posts.length) {
    return (
      <div className="vf-empty">
        <p style={{ font: `700 22px ${font.display}`, color: c.ink }}>
          {emptyTitle || 'Nothing here yet'}
        </p>
        <p style={{ font: `400 16px/1.6 ${font.body}`, color: c.muted, marginTop: 8, maxWidth: 460 }}>
          {emptyBody || 'We are writing. Check back shortly, or start from the full archive.'}
        </p>
        {children}
      </div>
    );
  }

  return (
    <div className="vf-postgrid">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
