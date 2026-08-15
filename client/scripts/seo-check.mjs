#!/usr/bin/env node
/**
 * SEO invariant smoke check.
 *
 *   node scripts/seo-check.mjs http://localhost:54935
 *
 * Every rule below exists because this site has already had to fix the thing
 * once, or because the failure mode is invisible in review. No dependencies, no
 * build step: it fetches the served HTML and reads it, which is the only thing
 * a crawler ever sees.
 */

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const TIMEOUT_MS = 90000; // next dev compiles a route on first request
const CONCURRENCY = 4;

/**
 * Routes that must exist whatever the CMS says. The sitemap is crawled on top
 * of this, but a sitemap generated from the same code that broke cannot be the
 * only source of truth about which pages should be there.
 */
const FIXED_ROUTES = [
  '/',
  '/founder-led-video',
  '/b2b-video-agency',
  '/linkedin-video-content',
  '/vs/ai-writing-tools',
  '/vs/video-agencies',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/blog',
  '/blog/topics',
];

/**
 * /blog/search is deliberately excluded. It ships `noindex, follow` and is
 * disallowed in robots.txt, so it is not a page these rules describe.
 */

const BANNED_TERMS = [
  'delve\\w*', 'leverag\\w+', 'robust\\w*', 'seamless\\w*', 'unlock\\w*', 'empower\\w*',
  'harness(?:es|ed|ing)?', 'cutting-edge', 'game-chang\\w+', 'revolutionis\\w+',
  'revolutioniz\\w+', 'transformative', 'synerg\\w+', 'holistic\\w*', 'elevat(?:e|es|ed|ing)',
  'streamlin\\w+', 'supercharg\\w+', 'bespoke', 'crucial\\w*', 'pivotal', 'testament',
  'foster(?:s|ed|ing)?', 'realms?', 'myriad', 'plethora', 'tapestry', 'comprehensive\\w*',
  'meticulous\\w*', 'underscor\\w+', 'navigate the', "in today's rapidly evolving",
  'ever-evolving', 'at the forefront', 'embark\\w*', 'journeys?', 'dive into',
].map((t) => ({ label: t.replace(/\\w[*+]|\(\?:.*?\)\??|\\s\+/g, '').replace(/\?$/, ''), re: new RegExp(`\\b(?:${t.replace(/ /g, '\\s+')})\\b`, 'gi') }));

/**
 * Rule 5 is switched off on the homepage ONLY.
 *
 * The homepage renders parody LinkedIn posts, and the joke is that they are
 * written in exactly the register this rule bans: leverage, unlock, synergy,
 * game-changer. The page argues against that voice by quoting it. Linting the
 * stock phrases out of the parody would delete the point of the section, so the
 * exemption is hardcoded here rather than left to whoever next reads a red line
 * and "fixes" it. Do not remove this without reading the homepage first.
 */
const BANNED_WORDS_EXEMPT = new Set(['/']);

// ---------------------------------------------------------------- html utils

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—',
  ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“',
  rdquo: '”', pound: '£', middot: '·', times: '×', deg: '°',
};

/** Entities are decoded before scanning: `&mdash;` is an em dash to a reader. */
function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, body) => {
    if (body[0] === '#') {
      const cp = /^#x/i.test(body) ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : m;
    }
    const k = body.toLowerCase();
    return k in NAMED_ENTITIES ? NAMED_ENTITIES[k] : m;
  });
}

/**
 * Script and style blocks go first, then all tags. Order matters: strip tags
 * first and the contents of a script block become "visible text", which would
 * flag every dash inside the JSON-LD and the dev bundle.
 */
function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** A short window around a match, so a failure names the sentence to go fix. */
function quoteAt(text, index, len) {
  const from = Math.max(0, index - 45);
  const to = Math.min(text.length, index + len + 45);
  return `${from > 0 ? '...' : ''}${text.slice(from, to)}${to < text.length ? '...' : ''}`;
}

function normalisePath(href, base) {
  try {
    const p = decodeURI(new URL(href, base).pathname);
    return p.length > 1 ? p.replace(/\/+$/, '') : '/';
  } catch {
    return null;
  }
}

async function get(url) {
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'seo-check' },
    });
    return { status: res.status, body: await res.text() };
  } catch (err) {
    return { status: 0, body: '', error: err.message };
  }
}

// ---------------------------------------------------------------- json-ld

/**
 * A node with an @id and other keys DESCRIBES that id. A node whose only key is
 * @id is a REFERENCE to one. Google merges every block on the page into one
 * dataset, so a reference emitted by a page legitimately resolves against a node
 * emitted by the root layout, which is why ids are collected across all blocks
 * before anything is resolved.
 */
function walkLd(node, defined, refs, path) {
  if (Array.isArray(node)) {
    node.forEach((n, i) => walkLd(n, defined, refs, `${path}[${i}]`));
    return;
  }
  if (!node || typeof node !== 'object') return;
  const id = node['@id'];
  if (typeof id === 'string') {
    if (Object.keys(node).length === 1) refs.push({ id, path });
    else defined.push({ id, path, type: node['@type'] });
  }
  for (const [k, v] of Object.entries(node)) if (k !== '@id') walkLd(v, defined, refs, `${path}.${k}`);
}

function checkJsonLd(html, fail) {
  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const defined = [];
  const refs = [];
  blocks.forEach((m, i) => {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (err) {
      fail('jsonld', `ld+json block ${i + 1} does not parse: ${err.message}`, m[1].slice(0, 160));
      return;
    }
    walkLd(parsed, defined, refs, `block${i + 1}`);
  });

  // Two nodes claiming the same @id are two competing answers to "what is this".
  const byId = new Map();
  for (const d of defined) byId.set(d.id, [...(byId.get(d.id) || []), d]);
  for (const [id, list] of byId) {
    if (list.length > 1) fail('jsonld', `@id defined ${list.length} times: ${id}`, list.map((d) => d.path).join(', '));
  }

  // A dangling @id is silent: no validator reports it, and the reference simply
  // points at nothing forever.
  for (const r of refs) {
    if (!byId.has(r.id)) fail('jsonld', `@id reference resolves to nothing: ${r.id}`, `referenced at ${r.path}`);
  }
  return blocks.length;
}

// ---------------------------------------------------------------- page rules

function checkRoute(route, res, fail) {
  if (res.status !== 200) {
    // Stop at the status. Running the content rules over an error page emits a
    // wall of secondary failures that all share one cause and bury it.
    fail('http', `expected 200, got ${res.status}`, res.error || '');
    return;
  }
  const html = res.body;

  // 2. One h1. Zero means no stated topic, two means two competing ones.
  const h1s = (html.match(/<h1[\s/>]/gi) || []).length;
  if (h1s !== 1) fail('h1', `expected exactly 1 h1, found ${h1s}`, '');

  // 3. The canonical. The root layout sets none ON PURPOSE, and Next merges
  // metadata shallowly, so a page that forgets `alternates` ships no canonical
  // at all. The worse variant is a page canonicalising to "/", which folds it
  // into the homepage and drops it from the index with nothing looking wrong.
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /\brel\s*=\s*["']?canonical["']?/i.test(tag))
    .map((tag) => (tag.match(/\bhref\s*=\s*["']([^"']*)["']/i) || [])[1])
    .filter(Boolean)
    .map(decodeEntities);

  if (canonicals.length === 0) {
    fail('canonical', 'no canonical link on the page', '');
  } else if (canonicals.length > 1) {
    fail('canonical', `${canonicals.length} canonical links`, canonicals.join(' | '));
  } else {
    const got = normalisePath(canonicals[0], BASE);
    if (got !== route) {
      const extra = got === '/' ? ' (canonicalising to the homepage, this deindexes the page)' : '';
      fail('canonical', `canonical points at "${got}", route is "${route}"${extra}`, canonicals[0]);
    }
  }

  const text = visibleText(html);

  // 4. Em and en dashes. House style is a full stop, a comma or a colon, and
  // ranges use the word "to". Ordinary hyphens are fine and are not matched.
  for (const m of text.matchAll(/[–—]/g)) {
    fail('dashes', `${m[0] === '—' ? 'em' : 'en'} dash in visible text`, quoteAt(text, m.index, 1));
  }

  // 5. Banned vocabulary. See BANNED_WORDS_EXEMPT above for the one exemption.
  if (!BANNED_WORDS_EXEMPT.has(route)) {
    for (const { label, re } of BANNED_TERMS) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        fail('words', `banned word "${m[0]}" (rule: ${label})`, quoteAt(text, m.index, m[0].length));
      }
    }
  }

  // 6. Structured data.
  checkJsonLd(html, fail);

  // 9. Alt attributes. alt="" is correct for decoration and must pass. A
  // MISSING alt is the failure: a screen reader then reads the file name.
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=/i.test(m[0]) && !/\balt(?=[\s/>])/i.test(m[0])) {
      fail('img', 'img element with no alt attribute', m[0].slice(0, 140));
    }
  }
}

// ---------------------------------------------------------------- runner

async function pool(items, worker) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await worker(items[i]);
      }
    })
  );
  return out;
}

const failures = [];
const rows = [];

function record(label, note) {
  const mine = [];
  const fail = (rule, message, quoted) => {
    const entry = { route: label, rule, message, quoted };
    failures.push(entry);
    mine.push(rule);
  };
  return { fail, done: (status) => rows.push({ label, status, note, rules: [...new Set(mine)] }) };
}

async function main() {
  const probe = await get(`${BASE}/`);
  if (probe.status === 0) {
    console.error(`seo-check: cannot reach ${BASE} (${probe.error}). Is the dev server up?`);
    process.exit(1);
  }

  // 1b. An unknown route must 404. A soft 404 (200 with "not found" content) is
  // the version that quietly fills the index with empty pages.
  {
    const { fail, done } = record('/nope (must 404)');
    const res = await get(`${BASE}/nope`);
    if (res.status !== 404) fail('http', `unknown route returned ${res.status}, expected 404`, '');
    done(res.status);
  }

  // 7. robots.txt must exist and must point at the sitemap. Without the Sitemap
  // line, discovery depends entirely on Search Console being wired up.
  {
    const { fail, done } = record('/robots.txt');
    const res = await get(`${BASE}/robots.txt`);
    if (res.status !== 200) fail('http', `expected 200, got ${res.status}`, res.error || '');
    else if (!/^\s*Sitemap:\s*\S+/im.test(res.body)) fail('robots', 'no "Sitemap:" line in robots.txt', res.body.slice(0, 160));
    done(res.status);
  }

  // 8. The sitemap. Parameter-free URLs only, and every one of them must be a
  // real 200: a sitemap listing a 404 or a noindex URL is a Search Console error.
  let sitemapRoutes = [];
  {
    const { fail, done } = record('/sitemap.xml');
    const res = await get(`${BASE}/sitemap.xml`);
    if (res.status !== 200) {
      fail('http', `expected 200, got ${res.status}`, res.error || '');
    } else {
      const locs = [...res.body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((m) => decodeEntities(m[1].trim()));
      if (locs.length === 0) fail('sitemap', 'no <loc> entries found', res.body.slice(0, 160));
      for (const loc of locs) {
        if (loc.includes('?') || loc.includes('#')) fail('sitemap', 'sitemap URL carries a query or fragment', loc);
        const p = normalisePath(loc, BASE);
        if (p === null) fail('sitemap', 'sitemap URL does not parse', loc);
        else sitemapRoutes.push(p);
      }
    }
    done(res.status);
  }

  const routes = [...new Set([...FIXED_ROUTES.map((r) => normalisePath(r, BASE)), ...sitemapRoutes])];
  const fromSitemap = new Set(sitemapRoutes);

  await pool(routes, async (route) => {
    const { fail, done } = record(route, fromSitemap.has(route) ? 'sitemap' : 'fixed');
    const res = await get(`${BASE}${route}`);
    checkRoute(route, res, fail);
    done(res.status);
  });

  // ------------------------------------------------------------- the report
  const w = Math.min(52, Math.max(24, ...rows.map((r) => r.label.length)));
  const line = '-'.repeat(w + 34);
  console.log(`\nseo-check  base=${BASE}\n`);
  console.log(`${'ROUTE'.padEnd(w)}  ${'HTTP'.padEnd(5)} ${'RESULT'.padEnd(6)}  RULES FAILED`);
  console.log(line);
  for (const r of rows) {
    const label = r.label.length > w ? `${r.label.slice(0, w - 3)}...` : r.label.padEnd(w);
    const ok = r.rules.length === 0;
    console.log(`${label}  ${String(r.status || 'ERR').padEnd(5)} ${(ok ? 'PASS' : 'FAIL').padEnd(6)}  ${r.rules.join(', ')}`);
  }
  console.log(line);

  if (failures.length) {
    console.log(`\nFAILURES (${failures.length})\n`);
    failures.forEach((f, i) => {
      const n = String(i + 1).padStart(3);
      console.log(`${n}. ${f.route}`);
      console.log(`     rule: ${f.rule}`);
      console.log(`     ${f.message}`);
      if (f.quoted) console.log(`     quoted: ${JSON.stringify(f.quoted.slice(0, 220))}`);
      console.log('');
    });
  }

  const failedRows = rows.filter((r) => r.rules.length).length;
  console.log(
    `\nseo-check: ${rows.length} checks, ${rows.length - failedRows} passed, ${failedRows} failed, ${failures.length} problems\n`
  );
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error('seo-check crashed:', err);
  process.exit(1);
});
