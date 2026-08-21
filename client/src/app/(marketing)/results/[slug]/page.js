import Link from 'next/link';
import { notFound } from 'next/navigation';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { getStudy, getStudySlugs, studies, studyIsTemplate } from '@/content/results';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * /results/[slug], one case study.
 *
 * ─── NOINDEX, SAME REASON AS THE INDEX ──────────────────────────────────────
 * Every factual field on every entry is a placeholder. Nothing here may be
 * indexed until a client has signed off their name, their numbers and their
 * words in writing. See src/content/results/index.js for the checklist, which
 * includes removing the `robots` line below and adding these paths to
 * sitemap.js in the same change.
 *
 * ─── WHY generateMetadata AND NOT A STATIC OBJECT ───────────────────────────
 * Marketing pages on this site export static metadata, and /founder-led-video
 * and /b2b-video-agency both do. They can, because they are one route each.
 * This is one route serving three URLs, and `alternates.canonical` has to
 * differ per URL. A static object here would canonicalise all three studies to
 * a single path, which quietly tells Google that two of the three do not exist
 * as separate pages. That is a real defect the day the noindex comes off, so
 * the metadata is generated per slug and reads only from a local module, with
 * no fetch and no CMS behind it.
 */

const PATH = '/results';

export const dynamicParams = false;

export function generateStaticParams() {
  return getStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const study = getStudy(slug);
  if (!study) return { title: 'Case study not found', robots: { index: false, follow: true } };

  const title = `${study.client}: founder-led video case study`;
  const description =
    'One intake call, a month of published video, and the reply rate difference between contacts who saw it and contacts who did not.';

  return {
    title,
    description,
    alternates: { canonical: `${PATH}/${study.slug}` },
    // Delete this line, and the one on /results, once the placeholders are gone.
    robots: { index: false, follow: true },
    openGraph: {
      type: 'article',
      url: `${PATH}/${study.slug}`,
      siteName: site.name,
      title: `${title} | ${site.name}`,
      description,
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${site.name}`, description },
  };
}

export default async function ResultsStudyPage({ params }) {
  const { slug } = await params;
  const study = getStudy(slug);

  /**
   * `dynamicParams = false` already makes an unlisted slug a 404 in production,
   * so in practice this branch is the guard rather than the mechanism. It stays
   * because the two are not the same thing: the export is a routing setting
   * somebody could change, and this is the page refusing to render a study it
   * does not have.
   */
  if (!study) notFound();

  const template = studyIsTemplate(study);
  const others = studies.filter((s) => s.slug !== study.slug);
  const studyPath = `${PATH}/${study.slug}`;
  const trail = [
    { name: 'Home', href: '/' },
    { name: 'Results', href: PATH },
    { name: study.client },
  ];

  /**
   * No structured data while the entry is a template.
   *
   * JSON-LD is a set of claims about entities, written for machines that will
   * not pause to notice the square brackets. An Article node whose headline
   * names "[[STUDY 1 CLIENT NAME]]", or a breadcrumb whose last crumb does, is
   * an assertion about a company that does not exist. `JsonLd` renders nothing
   * for a null graph, so the finished code path simply switches itself on the
   * day real values land.
   */
  const graph = template
    ? null
    : buildGraph(
        {
          '@type': 'Article',
          '@id': `${SITE}${studyPath}#article`,
          headline: `${study.client}: founder-led video case study`,
          about: study.industry,
          author: { '@id': ID.org },
          publisher: { '@id': ID.org },
          mainEntityOfPage: { '@id': ID.webpage(studyPath) },
          inLanguage: 'en',
        },
        {
          '@type': 'WebPage',
          '@id': ID.webpage(studyPath),
          url: `${SITE}${studyPath}`,
          name: `${study.client}: founder-led video case study`,
          isPartOf: { '@id': ID.site },
          inLanguage: 'en',
          breadcrumb: { '@id': ID.breadcrumb(studyPath) },
        },
        breadcrumbNode(studyPath, trail)
      );

  return (
    <>
      <a href="#main" className="vf-skip">
        Skip to content
      </a>
      <Nav base="/" />
      <JsonLd graph={graph} />

      <main id="main" tabIndex={-1} className="vf-page" style={{ outline: 'none' }}>
        <div className="vf-page-shell">
          <nav aria-label="Breadcrumb" className="vf-crumbs-plain">
            <Link href="/">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link href={PATH}>Results</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{study.client}</span>
          </nav>

          {/* Repeated from the index on purpose. A study page is what gets sent
              in a message or pasted into a deck, and it arrives with none of
              the index page's context attached to it. */}
          {template && (
            <p
              role="note"
              style={{
                marginTop: 20,
                padding: '16px 20px',
                border: `1px solid ${c.lineStrong}`,
                borderLeft: `4px solid ${c.orange}`,
                borderRadius: 14,
                background: c.panel,
                font: `400 15px/1.6 ${font.body}`,
                color: c.ink,
              }}
            >
              <strong style={{ fontWeight: 700 }}>Template page.</strong> Every name, figure and
              quote below is a placeholder written in double square brackets. This page does not
              describe a real client, and it is set to noindex until one has signed off their
              results. The writing around the placeholders is real.
            </p>
          )}

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '22px 0 0' }}
          >
            {study.client}
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            {study.industry}. {study.companySize}. One intake call, then a month of published video
            and the outreach that ran alongside it.
          </Reveal>

          <div className="vf-page-prose">
            <h2>Why this company had no founder-led video</h2>
            <p>{study.challenge}</p>
            <p>
              The shape underneath this is usually the same one. The founder already believes video
              works, often because a post of their own did better than a quarter of paid ads. The
              blocker is never the camera and it is rarely the editing. It is that a month of
              consistent video quietly assumes ten to fourteen hours of the one person who is also
              running the company, so the channel runs for six weeks, stops, and the buyers who had
              started to recognise a face stop seeing it.
            </p>

            <h2>How one intake call replaced the filming day</h2>
            <p>{study.approach}</p>
            <p>
              The mechanism is the same for every account. One call of about forty-five minutes
              captures the positioning, the objections that come up on sales calls, and the opinions
              this company holds that the rest of the market disagrees with. That last part is the
              one that decides whether the month is any good. A vague call produces forty vague
              videos faster than any other method produces forty vague videos.
            </p>
            <p>
              Scripts are drafted from that call in the founder&apos;s own phrasing, a human reviews
              them, and a lifelike presenter delivers them on camera. The founder&apos;s remaining
              job is approving scripts in a batch, which is where the one to two hours a month goes.
              There is no shoot date to reschedule, which matters more than it sounds: two
              reschedules is what ends most programmes, not budget.
            </p>
            <p>
              Volume is the uncomfortable part and it is not optional. One good video does close to
              nothing. The mechanism starts working when a buyer has seen this company four or five
              times across a few weeks and has already formed an impression before anyone contacts
              them.
            </p>

            <h2>The results after one month of B2B video</h2>
            <p>
              Measured on the client&apos;s own account over the period stated, not modelled and not
              extrapolated from a sample. Views are deliberately absent: a video that reaches two
              thousand of the wrong people beats one that reaches two hundred of the right ones on
              every dashboard and loses on every measure that pays.
            </p>
            <figure
              className="wp-block-table"
              tabIndex={0}
              role="region"
              aria-label={`Outcome measurements for ${study.client}, scroll sideways to see both columns`}
            >
              <table>
                <thead>
                  <tr>
                    <th>Measurement</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {study.outcomes.map((outcome) => (
                    <tr key={outcome.label}>
                      <td>{outcome.label}</td>
                      <td>{outcome.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              The two reply rate rows are the pair that matters, and they are reported as a pair
              rather than as a single lift figure on purpose. A lift with no base rate underneath it
              cannot be checked by the person reading it, and a percentage can triple while the
              actual count moves from one meeting to three.
            </p>

            <h2>How the videos fed LinkedIn outreach</h2>
            <p>
              The videos and the outreach are one system, and running either half alone is what makes
              both look weak. Content with no outreach reaches whoever the feed decides to show it
              to. Outreach with no content arrives from a stranger.
            </p>
            <p>
              So the target list is served the videos first, and the message that follows refers to
              the specific thing that was published rather than opening with a compliment about their
              company. By the time it lands, the name is one the contact has already seen take a
              position on something they care about. That is the entire difference between a cold
              message and a warm one, and it is measurable: the two reply rate rows in the table
              above are the same list, split by whether the contact was served the content.
            </p>
            <p>
              Expect that gap to appear in weeks four to seven. Anything faster is usually one video
              that travelled, which is pleasant and not repeatable.
            </p>

            <h2>What this case study does not prove</h2>
            <p>
              One company, one category, one period. It is evidence, not a controlled trial, and
              anyone presenting a single client as proof of a general result is selling something.
            </p>
            <ul>
              <li>
                The contact groups are matched by seniority, company size and category, and they are
                not randomised. That is the honest limit of the comparison.
              </li>
              <li>
                It is not the founder&apos;s own face. For a personal brand play, where the point is
                that this specific person is building in public, run the presenter on the company
                channel and film the founder separately.
              </li>
              <li>
                Nothing here covers demos, walkthroughs or customer stories. Anything with the real
                product or a real customer on screen should be filmed, and we say so.
              </li>
              <li>
                No reaction content. Anything responding to what happened yesterday needs a real
                person and a phone.
              </li>
              <li>Disclosure is not optional, on the ethics and on the platform rules.</li>
            </ul>
          </div>

          {/* Outside the prose block: a pull quote is not body copy, and the
              prose rules have no blockquote of their own to inherit. */}
          <figure
            style={{
              marginTop: 56,
              padding: '34px 36px',
              borderRadius: 22,
              background: c.panel,
              borderLeft: `4px solid ${c.blue}`,
            }}
          >
            <blockquote
              style={{
                font: `500 clamp(20px, 2vw, 25px)/1.45 ${font.display}`,
                color: c.ink,
                letterSpacing: '-0.01em',
              }}
            >
              {study.quote}
            </blockquote>
            <figcaption style={{ font: `500 15px/1.5 ${font.body}`, color: c.soft, marginTop: 18 }}>
              {study.quoteAttribution}
            </figcaption>
          </figure>

          {others.length > 0 && (
            <section aria-labelledby="vf-study-others" style={{ marginTop: 64 }}>
              <h2
                id="vf-study-others"
                style={{
                  font: `700 clamp(20px, 1.7vw, 24px)/1.25 ${font.display}`,
                  letterSpacing: '-0.02em',
                  color: c.ink,
                }}
              >
                Other B2B video case studies
              </h2>
              <ul style={{ listStyle: 'none', display: 'grid', gap: 12, marginTop: 18 }}>
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`${PATH}/${other.slug}`}
                      style={{
                        display: 'block',
                        padding: '16px 20px',
                        border: `1px solid ${c.line}`,
                        borderRadius: 14,
                        background: c.white,
                        font: `600 16px/1.4 ${font.body}`,
                        color: c.ink,
                      }}
                    >
                      {other.client}{' '}
                      <span style={{ font: `400 15px ${font.body}`, color: c.muted }}>
                        {other.industry}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p style={{ font: `500 15px ${font.body}`, color: c.blueDeep, marginTop: 18 }}>
                <Link href={PATH}>Back to all results</Link>
              </p>
            </section>
          )}

          {/* vf-pagecta, not vf-blogcta. The blog defines its own .vf-blogcta in
              app/blog/blog.css, which only the blog layout imports. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-study-cta">
            <div>
              <h2
                id="vf-study-cta"
                style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}
              >
                Run the same month on your own feed
              </h2>
              <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
                Your first video is free. One intake call, and you see a finished video before you
                decide anything. No crew, no studio, no shoot day to reschedule.
              </p>
            </div>
            <a href={appLinks.signup} className="vf-btn-cta vf-press">
              Start free
            </a>
          </section>
        </div>
      </main>

      <Footer base="/" />
    </>
  );
}
