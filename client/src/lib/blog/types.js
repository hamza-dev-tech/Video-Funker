/**
 * The contract between the data layer and everything that renders it.
 *
 * This project is plain JavaScript, so these are JSDoc typedefs rather than
 * real types — editors and `tsc --checkJs` both read them, and more importantly
 * they are the written-down shape that every source adapter must produce.
 * `local.js` and `wordpress.js` are only interchangeable because they both
 * return exactly this.
 *
 * A note on `body`: it is HTML, and it is only ever produced by
 * `renderPostHtml()` in html.js. Nothing else in the codebase may assign it.
 * JavaScript cannot enforce that the way TypeScript's branded types can, so it
 * is enforced by convention plus a single choke point — there is exactly one
 * `dangerouslySetInnerHTML` in the blog, in ArticleBody, and it takes this
 * field and nothing else.
 *
 * @typedef {Object} Author
 * @property {string} name
 * @property {string|null} [title]     Job title, e.g. "Head of Content".
 * @property {string|null} [bio]
 * @property {string|null} [avatar]    Absolute or site-relative image URL.
 * @property {string|null} [url]       A real profile page, or null. Never a 404.
 *
 * @typedef {Object} Term
 * @property {string} slug
 * @property {string} name
 *
 * @typedef {Object} TermInfo
 * @property {number} id
 * @property {string} slug
 * @property {string} name
 * @property {string} description      Plain text. WordPress stores this as HTML.
 * @property {number} count            Published posts carrying this term.
 * @property {number} parent           0 for a root term.
 *
 * @typedef {Object} Heading
 * @property {string} id               Matches the id on the rendered anchor.
 * @property {string} text
 * @property {2|3} level
 *
 * @typedef {Object} PostCard
 * A post as a listing needs it: no body, no headings, nothing expensive.
 * @property {string} slug
 * @property {string} title
 * @property {string|null} excerpt
 * @property {string|null} coverImage
 * @property {string|null} coverAlt
 * @property {number|null} readingMinutes
 * @property {string|null} publishedAt  ISO 8601, UTC.
 * @property {string|null} updatedAt    ISO 8601, UTC.
 * @property {Term|null} category
 * @property {string[]} tags
 * @property {Author} author
 *
 * @typedef {PostCard & {
 *   id: string,
 *   body: string,
 *   headings: Heading[],
 *   categoryId: string|number|null,
 *   seoTitle: string|null,
 *   seoDescription: string|null,
 *   canonicalUrl: string|null,
 *   ogImageUrl: string|null,
 *   wordCount: number,
 * }} Post
 */

export {};
