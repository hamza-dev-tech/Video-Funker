import Image from 'next/image';

import { c, font } from '@/config/site';

/**
 * The byline block at the end of an article.
 *
 * This is an E-E-A-T surface, not decoration: it is where the page states who
 * wrote it and on what standing. It renders nothing when there is no bio,
 * because an author card containing only a name repeats the byline at the top
 * and adds no information.
 *
 * The name is NOT a link. /blog/author/* does not exist, and a byline linking
 * to a 404 is worse than a byline that does not link. Add the link in the same
 * change that ships the page.
 */
export default function AuthorBio({ author }) {
  if (!author || !author.bio) return null;

  return (
    <aside className="vf-authorbio" aria-label={`About ${author.name}`}>
      {author.avatar ? (
        <Image
          src={author.avatar}
          alt=""
          width={56}
          height={56}
          style={{ borderRadius: 999, display: 'block', flexShrink: 0 }}
        />
      ) : null}
      <div>
        <p style={{ font: `700 16px ${font.display}`, color: c.ink }}>
          {author.name}
          {author.title ? (
            <span style={{ font: `400 14px ${font.body}`, color: c.soft }}> · {author.title}</span>
          ) : null}
        </p>
        <p style={{ font: `400 15px/1.65 ${font.body}`, color: c.muted, marginTop: 6 }}>{author.bio}</p>
      </div>
    </aside>
  );
}
