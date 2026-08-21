import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * Comparison page: AI writing tools and ghostwriting, against video.
 *
 * Deliberately NOT a tool-versus-tool page. No product is named or rated here.
 * The research was explicit about why: a reader comparing two named writing
 * subscriptions is comparing a 20 pound plan with a 40 pound plan, and nobody
 * who arrives at that comparison ever buys a retainer. The reader who does buy
 * is comparing APPROACHES, has already tried writing at volume, and wants to
 * know why it flattened out.
 *
 * So the axis is category against category. The strengths section is real, not
 * a straw man: a page that cannot name a genuine advantage of the alternative
 * reads as an advert, and the reader has already discounted it by the table.
 */

const PATH = '/vs/ai-writing-tools';
const TITLE = 'LinkedIn ghostwriting vs video: which one still separates you';
const DESCRIPTION =
  'AI writing tools made good LinkedIn posts free to produce, which is why they stopped separating anyone. Where writing still wins, and where video does.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: 'website',
    url: PATH,
    siteName: site.name,
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: `${TITLE} | ${site.name}`, description: DESCRIPTION },
};

/**
 * Four approaches, not four products. Costs are typical market ranges rather
 * than our own client figures, and the founder-hours column is the one that
 * decides most of these arguments in practice.
 */
const APPROACHES = [
  {
    approach: 'AI writing tool, run in-house',
    cost: '£20 to £60 a month',
    hours: '12 to 20',
    ships: '8 to 20 written posts',
    stops: 'The week a buyer reads the same shape from three of your competitors.',
  },
  {
    approach: 'Human ghostwriting retainer',
    cost: '£1,500 to £4,000 a month',
    hours: '2 to 4',
    ships: '8 to 12 written posts',
    stops: 'Month five, when the founder quietly stops reading the drafts.',
  },
  {
    approach: 'Founder films video themselves',
    cost: '£150 to £400 in kit and editing',
    hours: '8 to 14',
    ships: '12 to 20 videos in a good month',
    stops: 'Month three. The calendar wins, not the camera.',
  },
  {
    approach: 'One intake call plus a presenter',
    cost: '£400 to £900 a month',
    hours: '1 to 2',
    ships: '20 to 40 videos, each with a written post',
    stops: 'Anything needing the real person or the real product on screen.',
  },
];

export default function AiWritingToolsComparisonPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'AI writing tools vs video' }];

  /**
   * WebPage plus breadcrumb only. `isPartOf` and `about` resolve to the WebSite
   * and Organization nodes the root layout emits into every page, so neither
   * reference dangles. No Service node here: this page describes a comparison,
   * not a distinct service offering, and /founder-led-video already carries
   * that entity.
   */
  const graph = buildGraph(
    {
      '@type': 'WebPage',
      '@id': ID.webpage(PATH),
      url: `${SITE}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': ID.site },
      about: { '@id': ID.org },
      inLanguage: 'en',
      breadcrumb: { '@id': ID.breadcrumb(PATH) },
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
            <span aria-current="page">AI writing tools vs video</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            LinkedIn ghostwriting and AI writing tools vs video
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            Two ways to be visible to the same buyer. This compares the approaches rather than the
            products, because the interesting difference is not which tool writes better sentences.
          </Reveal>

          <div className="vf-page-prose">
            <h2>What AI writing tools for LinkedIn are genuinely good at</h2>
            <p>
              More than the people selling video usually admit, so start here.
            </p>
            <p>
              The blank page is the expensive part of writing, and a tool removes it. Producing eight
              hundred words you disagree with takes a different kind of effort from producing eight
              hundred words from nothing, and most people can edit when they cannot start. A founder
              with a real opinion and forty minutes now ships something that used to take an afternoon.
            </p>
            <p>
              The unit cost is the other advantage and it is not close. A writing subscription is
              twenty to sixty pounds a month. Cheap output buys something more useful than savings: it
              buys testing. You can run the same format four times in a fortnight to find out whether
              it works, which is the only way anything gets good, and it is exactly what a per-piece
              price makes impossible.
            </p>
            <p>
              Speed is the third, and it is permanent. Something happens in your market on a Tuesday
              morning and the post is live before lunch. Nothing that involves scripting, delivery and
              captioning will beat that, ours included. If a real share of your content is a reaction
              to this week, writing is the format for it and you should keep doing it.
            </p>
            <p>
              Written posts also do a job video does not. They are skimmable, quotable and easy to
              forward. The person who signs off your invoice reads a paragraph between meetings.
              Almost nobody forwards a forty-five second video to their finance director. That is why
              a written post ships alongside every video we produce rather than instead of one.
            </p>
            <p>
              And these tools are at their best held by someone who already knows something. Used as a
              shaping layer over a person with strong opinions and a scarred memory of the market, the
              output is good. The failure below is not the tool being bad at writing.
            </p>

            <h2>Where LinkedIn ghostwriting and AI writing tools stop working</h2>
            <p>
              The problem is not quality. It is that the thing a written post used to prove is no
              longer true.
            </p>
            <p>
              Text carried a quiet guarantee: somebody sat down for forty minutes and thought about
              this before you read it. Buyers were never grading the prose, they were reading the cost
              of producing it. A signal works only while it is expensive to fake, and the cost of
              plausible B2B text fell to roughly zero in about eighteen months. The signal went with
              the cost. Better prompting does not reverse that, because better prompting is available
              to your competitors at the same price on the same afternoon.
            </p>
            <p>
              The visible symptom is convergence. Four companies drafting from the same handful of
              models, prompted with patterns copied from the same threads, tuned against the same
              corpus of posts that performed well two years ago. The outputs collapse into a narrow
              band and the band is recognisable on sight. The one-line opener. The break after every
              sentence. The turn at the fourth paragraph. The question at the end that nobody answers.
            </p>
            <p>
              There is a second failure with nothing to do with models, and it is the one that ends
              ghostwriting retainers. Review decays. In month one the founder edits every draft
              properly. By month three they skim. By month five posts go out unread, the voice drifts
              a few degrees a week, and then somebody quotes one of those posts back at them at a
              conference and they do not recognise it. That is usually the week the retainer ends.
            </p>
            <p>
              The third one costs pipeline. Text does not tell a buyer who is behind it. At the
              shortlist stage the buyer is not persuading themselves, they are eliminating, and
              anonymous competent writing neither gets you cut nor keeps you in. It is neutral, and
              neutral is a loss when three other vendors are on the page. There is a longer version of
              this argument on the{' '}
              <Link href="/linkedin-video-content">done-for-you LinkedIn video content page</Link>.
            </p>

            <h2>LinkedIn ghostwriting vs video: cost, hours and what ships</h2>
            <p>
              Four approaches to the same twelve weeks of being visible. Costs are typical market
              ranges rather than our own client numbers, because a single figure would be a statistic
              we cannot source and the spread is the honest answer anyway.
            </p>
            <figure
              className="wp-block-table"
              tabIndex={0}
              role="region"
              aria-label="Table comparing four approaches to LinkedIn content, scroll sideways to see all columns"
            >
              <table>
                <thead>
                  <tr>
                    <th>Approach</th>
                    <th>Monthly cost</th>
                    <th>Founder hours a month</th>
                    <th>What ships</th>
                    <th>Where it stops</th>
                  </tr>
                </thead>
                <tbody>
                  {APPROACHES.map((row) => (
                    <tr key={row.approach}>
                      <td>{row.approach}</td>
                      <td>{row.cost}</td>
                      <td>{row.hours}</td>
                      <td>{row.ships}</td>
                      <td>{row.stops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              Read the third column before the second. Cash is the number people negotiate and hours
              are the number that actually ends programmes. A writing tool that costs forty pounds a
              month still costs three to five hours a week of the one person who cannot spare them,
              because somebody has to supply the opinions and correct the drafts, and that person is
              also running the company.
            </p>
            <p>
              The last column is the one to argue with. Every row on this table stops somewhere, and
              the useful question is not which approach is best but which failure you can live with
              for a year.
            </p>

            <h2>Which to choose for your own LinkedIn content</h2>
            <p>Four questions, answered about your company rather than in general.</p>
            <ul>
              <li>
                <strong>Is most of your content a reaction to this week?</strong> Then writing wins
                outright. A monthly batch is the wrong shape for commentary, and we will say the same
                thing on a sales call.
              </li>
              <li>
                <strong>How many people do you actually need to reach?</strong> If your market is two
                hundred named accounts, you do not have a content problem. You have a list you could
                contact individually this month, and writing plus a real sequence beats any publishing
                programme at that size.
              </li>
              <li>
                <strong>Does your buyer read or watch?</strong> Some do read. Procurement-led,
                documentation-heavy, technical sales where the evaluation is a spreadsheet: those
                buyers want text they can paste into an internal case. Video helps them recognise you
                and will not do the arguing.
              </li>
              <li>
                <strong>Is there anything in your positioning your market would argue with?</strong>{' '}
                If there is not, neither format saves you. Video simply publishes the fact at higher
                resolution and faster.
              </li>
            </ul>

            <h3>When the answer is not us</h3>
            <ul>
              <li>
                The founder already films weekly and is comfortable doing it. Keep filming. Their own
                face beats ours, and we would be selling you a worse version of what you have.
              </li>
              <li>
                It is a personal brand play, where the point is that this specific person is building
                in public. Run the presenter on the company channel and film the founder separately.
              </li>
              <li>
                The content is demos, customer stories or anything with the real product on screen.
                That needs a camera and we will tell you so.
              </li>
              <li>
                Total budget is under about three hundred pounds a month. At that level a phone, a
                tripod and a writing subscription is the correct answer, honestly.
              </li>
              <li>
                Replies land in an inbox nobody opens within a day. The whole advantage is a warm
                recipient, and warmth expires.
              </li>
            </ul>
            <p>
              For most companies this is not an either-or, which is the reason the writing tools are
              not really the competitor. They compete with the writing layer, and we keep that layer:
              every video ships with a post in your phrasing, so the reader who never presses play
              still gets the argument. What changes is that one of the two now carries a face. The
              full cost breakdown of getting that face on screen is on the{' '}
              <Link href="/founder-led-video">founder-led video page</Link>, and if you are also
              weighing a production company, the{' '}
              <Link href="/b2b-video-agency">B2B video agency comparison</Link> covers what to ask
              before signing anything.
            </p>
          </div>

          {/* vf-pagecta, not vf-blogcta: the blog defines its own .vf-blogcta in
              app/blog/blog.css, which only the blog layout imports. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-writing-cta">
            <div>
              <h2
                id="vf-writing-cta"
                style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}
              >
                Compare it against your own posts
              </h2>
              <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
                Your first video is free. One intake call, and you see a finished video next to the
                text you are already publishing before you decide anything.
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
