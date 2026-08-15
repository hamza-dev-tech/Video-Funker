/**
 * Bylines.
 *
 * `url` is null on every author here and that is deliberate: /blog/author/*
 * does not exist. A byline that links to a 404 is worse than a byline that does
 * not link, and in the article's structured data an author @id pointing at a
 * missing page is a dangling reference that no validator will flag for you.
 * Give an author a `url` in the same change that ships the page it points at.
 */
export const authors = {
  editorial: {
    key: 'editorial',
    name: 'The Video Funker team',
    title: 'Editorial',
    // A team is an Organization, not a Person. The article graph reads this and
    // references the company instead of inventing a human with a job title.
    type: 'Organization',
    avatar: null,
    bio: 'We produce founder-led video for B2B teams and write up what we learn from the campaigns we run.',
    url: '/blog/author/editorial',
  },
  elena: {
    key: 'elena',
    name: 'Elena Marsh',
    title: 'Head of Content',
    avatar: null,
    bio: 'Elena runs the scripting side of Video Funker. She has written for founders in security, fintech and devtools, and has strong opinions about the first four seconds of a video.',
    url: '/blog/author/elena',
  },
  marcus: {
    key: 'marcus',
    name: 'Marcus Adeyemi',
    title: 'Head of Distribution',
    avatar: null,
    bio: 'Marcus builds the outreach engine that carries our clients’ videos into the feed. He spends most of his week reading reply data.',
    url: '/blog/author/marcus',
  },
};

export const defaultAuthor = authors.editorial;
