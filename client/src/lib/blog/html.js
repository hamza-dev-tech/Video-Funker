/**
 * The one place article HTML is sanitised, and the one place table-of-contents
 * headings are collected.
 *
 * Both happen in a SINGLE unified pass, on purpose. The obvious alternative —
 * sanitise here, then run a separate slugger over the output to build the TOC —
 * desynchronises the moment two headings share a title: github-slugger is
 * stateful, so a second pass restarts its counter and mints `overview-1` while
 * the rendered anchor says `overview`. Every TOC link past the duplicate then
 * scrolls nowhere. Collecting the ids from the same tree that produced the
 * anchors makes that impossible rather than unlikely.
 *
 * Order inside the pipeline is also load-bearing: sanitize BEFORE slug. Slugging
 * first writes `id` attributes that the sanitizer would then strip, producing a
 * TOC whose every target is missing.
 */

import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { visit, SKIP } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';

import { SITE_URL } from '@/config/site';

/** The CMS origin, when one is configured. Used to relativise internal links. */
const CMS = process.env.WP_PUBLIC_ORIGIN || '';

/**
 * Embeds are allowlisted by HOST, never left open.
 *
 * An unrestricted iframe src on the marketing domain is a phishing surface: an
 * attacker who gets one post published (a compromised editor account, a
 * plugin's REST endpoint) can frame a credential form that appears to live on
 * videofunker.ai. The list is video hosts because this is a video company's
 * blog and embedding a demo is the legitimate use.
 */
const IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'fast.wistia.net',
  'fast.wistia.com',
  'www.loom.com',
]);

/**
 * Tags permitted to keep their class attribute.
 *
 * hast-util-sanitize only honours `className` in a PER-TAG allowlist. Listing
 * it under `*` looks like it works and silently empties every class attribute
 * instead — it renders `class=""`. Without this, Gutenberg's own layout classes
 * (wp-block-image, alignwide, is-style-*) are stripped and every block style the
 * editor picked stops applying the moment the post goes through here.
 */
const CLASS_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'div', 'span',
  'figure', 'figcaption', 'blockquote', 'cite',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'pre', 'code', 'details', 'summary', 'strong', 'em', 'img', 'a', 'hr',
];

const perTagClass = Object.fromEntries(
  CLASS_TAGS.map((tag) => {
    // defaultSchema ships RESTRICTED className tuples for a few tags — h2 is
    // `['className', 'sr-only']`, meaning "allow the class attribute, but only
    // if its value is exactly sr-only". hast-util-sanitize matches that entry
    // first, so appending a plain 'className' after it changes nothing and
    // every real class is still filtered out. The restrictive entry has to be
    // removed, not out-voted.
    const existing = ((defaultSchema.attributes && defaultSchema.attributes[tag]) || []).filter(
      (a) => !(a === 'className' || (Array.isArray(a) && a[0] === 'className'))
    );
    return [tag, [...existing, 'className', 'id']];
  })
);

const schema = {
  ...defaultSchema,
  /**
   * Default is 'user-content-', which silently rewrites every heading id.
   * That prefix exists to stop DOM clobbering from untrusted markup, but the
   * cost here is real and immediate: it leaks into TOC anchors and into every
   * `#section` link anyone has ever shared or that any other site links to.
   * Article HTML on this blog is editor-authored and has already had its tags
   * and attributes filtered by the time ids are minted, so the clobbering
   * vector is closed by the allowlist above rather than by mangling anchors.
   */
  clobberPrefix: '',
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'figure',
    'figcaption',
    'iframe',
    'details',
    'summary',
    'mark',
  ],
  attributes: {
    ...defaultSchema.attributes,
    ...perTagClass,
    '*': [...((defaultSchema.attributes && defaultSchema.attributes['*']) || []), 'id'],
    img: [
      ...((defaultSchema.attributes && defaultSchema.attributes.img) || []),
      'className', 'loading', 'decoding', 'width', 'height', 'srcSet', 'sizes',
    ],
    // `rel` is allowed through so an editor's own rel="sponsored" survives —
    // see the link handling below, which reads it rather than overwriting it.
    a: [...((defaultSchema.attributes && defaultSchema.attributes.a) || []), 'className', 'target', 'rel'],
    iframe: ['src', 'width', 'height', 'allow', 'allowFullScreen', 'title', 'loading', 'className'],
    // Not `*`: an inline style on an arbitrary element is a layout-injection
    // and click-jacking surface. Nothing in the editor needs it.
  },
};

/**
 * How outbound links are treated.
 *
 * NOT blanket nofollow. That is cargo cult on an editorial blog: Google has
 * never asked publishers to nofollow ordinary citations, linking out to the
 * research you are quoting is a normal quality signal, and stripping the
 * follow from every source makes the piece look like it is hoarding equity
 * rather than reporting. Blanket nofollow is the right call for user-generated
 * content and for paid placements — neither of which exists here, because
 * every post is editor-authored.
 *
 * So: an editor's OWN rel is respected (mark a paid mention `sponsored` in
 * WordPress and it stays sponsored), and everything else gets the security
 * treatment only.
 *
 * `noopener noreferrer` is not optional on any target="_blank" link. Without
 * noopener the opened page gets a live `window.opener` handle and can navigate
 * this tab somewhere else — reverse tabnabbing, and it works even cross-origin.
 */
const REL_KEYWORDS = new Set(['nofollow', 'sponsored', 'ugc']);

function relFor(existingRel) {
  const kept = String(existingRel || '')
    .split(/\s+/)
    .filter((token) => REL_KEYWORDS.has(token.toLowerCase()));
  return ['noopener', 'noreferrer', ...kept].join(' ');
}

/** Collect headings, fix links, drop foreign iframes, lazy-load images. */
function transform(headings) {
  return () => (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      const props = node.properties || (node.properties = {});

      // Gutenberg lets an editor choose "Heading 1". A second <h1> inside the
      // article competes with the page title for the document outline, and
      // Google picks one of them to show. Demote BEFORE the TOC test below so
      // the section still lands in the contents rather than disappearing.
      if (node.tagName === 'h1') node.tagName = 'h2';

      if (node.tagName === 'h2' || node.tagName === 'h3') {
        headings.push({
          id: String(props.id || ''),
          text: toString(node),
          level: node.tagName === 'h2' ? 2 : 3,
        });
        return;
      }

      if (node.tagName === 'a' && typeof props.href === 'string') {
        const href = props.href;

        // Links an editor wrote while inside WordPress point at the CMS host.
        // Left alone they bounce a reader off the public site and onto an
        // origin that should never be user-facing — and, worse, they leak the
        // CMS hostname into the public HTML for anyone probing for it.
        if (CMS && href.startsWith(CMS)) {
          props.href = href.slice(CMS.length) || '/';
        } else if (href.startsWith(SITE_URL)) {
          props.href = href.slice(SITE_URL.length) || '/';
        } else if (/^https?:/i.test(href)) {
          props.target = '_blank';
          props.rel = relFor(props.rel);
        } else if (/^(javascript|data|vbscript):/i.test(href.trim())) {
          // Belt and braces. defaultSchema's protocol allowlist already covers
          // this; leaving the check here means a future schema edit that widens
          // protocols cannot quietly reopen a script-URL injection.
          delete props.href;
        }
        return;
      }

      if (node.tagName === 'img') {
        // Body images are never the LCP element — the cover image above them
        // is — so deferring them is a straight win and costs nothing visually.
        if (!props.loading) props.loading = 'lazy';
        if (!props.decoding) props.decoding = 'async';
        // An <img> with no alt at all is announced by screen readers as its
        // filename, which is worse than announcing nothing. Empty alt marks it
        // decorative, which is the correct default for an unlabelled image.
        if (props.alt == null) props.alt = '';
        return;
      }

      if (node.tagName === 'iframe' && parent && typeof index === 'number') {
        let host = '';
        try {
          host = new URL(String(props.src || '')).hostname;
        } catch {
          /* unparseable src: treat as not allowlisted */
        }
        if (!IFRAME_HOSTS.has(host)) {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }
        if (!props.loading) props.loading = 'lazy';
        if (!props.title) props.title = 'Embedded video';
      }
    });
  };
}

/**
 * Give every table and every <pre> a keyboard-operable scroll container.
 *
 * The block editor wraps its tables in `<figure class="wp-block-table">` and
 * the blog CSS makes that figure scroll sideways. Tables pasted from a document
 * or written in the classic editor have no wrapper, therefore no scroll
 * container — and because `body` carries `overflow-x: clip`, the trailing
 * columns are then AMPUTATED with no scrollbar to hint that they exist. A
 * reader on a phone simply never learns there was a fourth column.
 *
 * The fix is a wrapper rather than `display: block` on the table itself:
 * display:block strips the table role, and screen readers stop announcing rows
 * and columns and read out a wall of text instead.
 *
 * `tabIndex` is what makes it a scrollable region a keyboard user can actually
 * reach (WCAG 2.1.1) — a mouse wheel is not the only way people scroll.
 * Runs AFTER sanitize so these attributes survive the filter.
 */
function wrapScrollables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'pre') {
        node.properties = { ...(node.properties || {}), tabIndex: 0 };
        return;
      }
      if (node.tagName !== 'table' || !parent || typeof index !== 'number') return;

      const parentClasses = (parent.properties && parent.properties.className) || [];
      if (parent.tagName === 'figure' && parentClasses.includes('wp-block-table')) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: {
          className: ['wp-block-table'],
          tabIndex: 0,
          role: 'region',
          'aria-label': 'Table, scroll sideways to see all columns',
        },
        children: [node],
      };
      // Skip past the node we just wrapped, or the visitor walks straight back
      // into the same table and wraps it again on every pass.
      return [SKIP, index + 1];
    });
  };
}

/**
 * Sanitise article HTML and return it with the headings it contains.
 *
 * @param {string} raw Untrusted HTML from the CMS.
 * @returns {Promise<{ html: string, headings: import('./types').Heading[] }>}
 */
export async function renderPostHtml(raw) {
  const headings = [];
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    .use(transform(headings))
    .use(wrapScrollables)
    .use(rehypeStringify)
    .process(raw || '');

  return {
    html: String(file),
    // A heading with no id cannot be linked to, so it must not appear in the
    // contents — a TOC entry that scrolls nowhere is worse than a missing one.
    headings: headings.filter((h) => h.id),
  };
}
