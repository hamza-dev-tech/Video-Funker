import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { AWAITING_REAL_DATA, studies, studyIsTemplate } from '@/content/results';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * /results, the case study index.
 *
 * ─── WHY THIS PAGE IS NOINDEX ───────────────────────────────────────────────
 * Every client name, figure and quote under /results is a placeholder. A page
 * of invented case studies that Google indexes is worse than no page at all:
 * fabricated testimonials are a spam-policy breach, a page that ranks and then
 * gets rewritten from scratch loses whatever it earned, and the first
 * impression a buyer forms is the one that sticks.
 *
 * So the route ships complete and hidden. `robots.index: false` here and on
 * the study route, `follow: true` so the internal links still pass through to
 * pages that are real, and no entry in sitemap.js until the placeholders are
 * gone. See src/content/results/index.js for the full checklist.
 *
 * The noindex is written literally rather than derived from AWAITING_REAL_DATA
 * because `metadata` is a static object evaluated at module load, and turning
 * it into generateMetadata to read a computed flag would trade a one-line
 * deletion for a permanent complication.
 */

const PATH = '/results';
const TITLE = 'Results, and how we measure them';
const DESCRIPTION =
  'What we report for every founder-led video client: videos published, founder hours, and the reply rate difference between contacts who saw the videos and contacts who did not.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  // Delete this line, and the one on /results/[slug], the day real client data
  // lands. Adding the routes to sitemap.js without removing it would ask
  // Google to crawl a URL whose own meta tag then tells it to drop the result.
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    url: PATH,
    siteName: site.name,
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: `${TITLE} | ${site.name}`, description: DESCRIPTION },
};

export default function ResultsIndexPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'Results' }];

  /**
   * The ItemList is emitted only once the studies are real.
   *
   * Structured data is a set of claims about entities. An ItemList naming
   * "[[STUDY 1 CLIENT NAME]]" asserts the existence of a company that does not
   * exist, in the one format built for machines to consume without a human
   * reading it first. The CollectionPage itself is fine, because its name and
   * description are this page's own writing rather than a client's.
   */
  const itemList = AWAITING_REAL_DATA
    ? null
    : {
        '@type': 'ItemList',
        numberOfItems: studies.length,
        itemListElement: studies.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}${PATH}/${s.slug}`,
          name: s.client,
        })),
      };

  const graph = buildGraph(
    {
      '@type': 'CollectionPage',
      '@id': ID.webpage(PATH),
      url: `${SITE}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': ID.site },
      inLanguage: 'en',
      breadcrumb: { '@id': ID.breadcrumb(PATH) },
      ...(itemList ? { mainEntity: itemList } : {}),
    },
    breadcrumbNode(PATH, trail)
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
            <span aria-current="page">Results</span>
          </nav>

          {/* The banner disappears by itself the moment the last placeholder is
              replaced. The noindex above does not, and that is on purpose: two
              switches, one of which a human has to think about. */}
          {AWAITING_REAL_DATA && (
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
              <strong style={{ fontWeight: 700 }}>These are templates, not client work.</strong>{' '}
              Every company name, figure and quote below is a placeholder written in double square
              brackets. Nothing on this route describes a real engagement, and these pages are set
              to noindex until real client data replaces the placeholders.
            </p>
          )}

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '22px 0 0' }}
          >
            Results, and how we measure them
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            This is where the case studies go. Today it holds three empty templates, because we will
            not publish a client name, a number or a quote we have not been given. What the numbers
            mean is written out below, and it will not change when the values arrive.
          </Reveal>

          <div className="vf-page-prose">
            <h2>What to demand from a video agency case study</h2>
            <p>
              Read twenty of them and they are the same three paragraphs. A company was struggling
              with visibility, a programme was put in place, engagement rose by some percentage, and
              a named person is delighted. Nothing in that can be checked, which is why it is written
              that way.
            </p>
            <p>Five questions separate a case study that means something from one that does not.</p>
            <ul>
              <li>
                <strong>What was the base rate?</strong> A reply rate that tripled tells you nothing
                without the number it tripled from. Going from one positive reply in two hundred to
                three in two hundred is a 200 percent lift and almost no pipeline.
              </li>
              <li>
                <strong>What is it being compared against?</strong> Against the same company last
                quarter, when the sales team was also smaller? Against a group of similar contacts
                who were not served the videos? Only the second one is evidence.
              </li>
              <li>
                <strong>What was the cost per published video?</strong> Not the retainer. The
                retainer divided by what actually went live, which is usually a different number from
                what was contracted.
              </li>
              <li>
                <strong>How many months ran without a gap?</strong> Almost any provider can show a
                good quarter. Very few can show that nothing stopped in month five, and month five is
                when the mechanism starts paying.
              </li>
              <li>
                <strong>Will the client take a call about it?</strong> The answer to this one is the
                whole case study. Everything above it is a formatting exercise.
              </li>
            </ul>
            <p>
              Apply those to ours when they are filled in. If one of the studies below cannot answer
              all five, it should not be published.
            </p>

            <h2>How we measure a LinkedIn video programme</h2>
            <p>
              Views are the worst available metric and the one every provider reports, because it is
              the number that is always large. A video that reaches two thousand of the wrong people
              and one that reaches two hundred of the right ones look opposite on a dashboard and are
              opposite in reality. Views are not on any study on this page and will not be added.
            </p>
            <p>Four numbers appear on every study instead, and each one is on the list for a reason.</p>
            <ul>
              <li>
                <strong>Videos published in the first month.</strong> Published, not delivered. A
                file sitting in a shared folder is not content, and the gap between the two is where
                most retainers quietly fail.
              </li>
              <li>
                <strong>Founder hours a month.</strong> The cost that actually ends programmes. If
                this number is not falling, nothing else on the list matters, because the programme
                will stop in month three whatever the reply rate is doing.
              </li>
              <li>
                <strong>Positive reply rate, contacts served the videos.</strong> Contacts who saw
                the content before the outreach message arrived.
              </li>
              <li>
                <strong>Positive reply rate, matched contacts not served.</strong> The same kind of
                contact, in the same period, who did not. This is the row that makes the row above it
                mean anything.
              </li>
            </ul>
            <p>
              The last two are reported as a pair rather than as a single lift figure. A lift with no
              base rate underneath it cannot be checked by the person reading it, and the difference
              between the two groups is the only measurement that has predicted pipeline for us.
              Expect it to move in weeks four to seven. Anything faster is usually one video that
              travelled, which is pleasant and not repeatable.
            </p>

            <h2>Why these founder-led video case studies have no numbers yet</h2>
            <p>
              We are new, and we have no client outcome that a client has signed off. That is the
              entire reason this page reads the way it does.
            </p>
            <p>
              The alternative was available and it is what most new agencies do. Write three studies
              about plausible companies, pick numbers that flatter without being absurd, attribute a
              warm sentence to a founder nobody can look up. It takes an afternoon and it converts,
              right up until a buyer searches the company name and finds nothing.
            </p>
            <p>
              It is also a fabricated testimonial, which breaches Google&apos;s spam policy on
              deceptive content and is a consumer-protection matter in the UK, the EU and most of the
              United States. The upside is a few weeks of slightly better conversion. The downside is
              the only asset a two-month-old company owns.
            </p>
            <p>
              So the shape is finished and the facts are empty. When a client agrees in writing to
              their name, their numbers and their words, this page changes the same day. Until then,
              the honest version of it is the one you are reading. In the meantime the arithmetic
              behind the offer is set out on the{' '}
              <Link href="/founder-led-video">founder-led video page</Link>, and the comparison
              against agencies and in-house hiring is on the{' '}
              <Link href="/b2b-video-agency">B2B video agency page</Link>. Both are market ranges,
              and both say so.
            </p>
          </div>

          {/* Outside .vf-page-prose on purpose. The prose rules underline every
              anchor and colour it blue, which is right for a link inside a
              sentence and wrong for a card whose whole surface is the link. */}
          <section aria-labelledby="vf-results-list" style={{ marginTop: 72 }}>
            <h2
              id="vf-results-list"
              style={{
                font: `700 clamp(24px, 2vw, 30px)/1.2 ${font.display}`,
                letterSpacing: '-0.02em',
                color: c.ink,
              }}
            >
              B2B video case studies, in template form
            </h2>
            <p
              style={{
                font: `400 17px/1.7 ${font.body}`,
                color: c.muted,
                marginTop: 12,
                maxWidth: '38em',
              }}
            >
              Three entries, one per shape of client we expect: a founder who will not film, a
              marketing lead who inherited a stalled channel, and a company that publishes already
              and cannot keep up the volume.
            </p>

            <div style={{ display: 'grid', gap: 20, marginTop: 32 }}>
              {studies.map((study) => {
                const template = studyIsTemplate(study);
                return (
                  <article
                    key={study.slug}
                    className="vf-latest-card"
                    style={{ padding: '26px 28px' }}
                  >
                    {template && (
                      <p
                        style={{
                          font: `700 11px ${font.body}`,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: c.orangeDark,
                        }}
                      >
                        Template, no real data
                      </p>
                    )}

                    <h3
                      style={{
                        font: `700 21px/1.3 ${font.display}`,
                        color: c.ink,
                        marginTop: template ? 10 : 0,
                      }}
                    >
                      <Link
                        href={`${PATH}/${study.slug}`}
                        className="vf-latest-link"
                        style={{ color: 'inherit' }}
                      >
                        {study.client}
                      </Link>
                    </h3>

                    {/* Every pair is wrapped in a div, including the first two.
                        A dl's content model allows bare dt/dd groups OR div
                        groups, and mixing the two forms in one list is invalid.
                        display:contents keeps each wrapper out of the grid so
                        the terms and values still line up as two columns. */}
                    <dl
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        gap: '10px 20px',
                        marginTop: 18,
                        font: `400 15px/1.5 ${font.body}`,
                        color: c.muted,
                      }}
                    >
                      <div style={{ display: 'contents' }}>
                        <dt>Industry</dt>
                        <dd style={{ color: c.ink, textAlign: 'right' }}>{study.industry}</dd>
                      </div>
                      <div style={{ display: 'contents' }}>
                        <dt>Company size</dt>
                        <dd style={{ color: c.ink, textAlign: 'right' }}>{study.companySize}</dd>
                      </div>
                      {study.outcomes.map((outcome) => (
                        <div key={outcome.label} style={{ display: 'contents' }}>
                          <dt>{outcome.label}</dt>
                          <dd style={{ color: c.ink, fontWeight: 700, textAlign: 'right' }}>
                            {outcome.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <p
                      aria-hidden="true"
                      style={{
                        font: `600 14px ${font.body}`,
                        color: c.blueDeep,
                        marginTop: 20,
                      }}
                    >
                      Read the case study
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* vf-pagecta, not vf-blogcta. The blog defines its own .vf-blogcta in
              app/blog/blog.css, which only the blog layout imports. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-results-cta">
            <div>
              <h2
                id="vf-results-cta"
                style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}
              >
                Be the first case study
              </h2>
              <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
                Your first video is free. One intake call, and you see a finished video before you
                decide anything. If the numbers are good, we will ask to publish them, and you get
                the final word on every one of them.
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
