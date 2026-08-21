import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * The comparison page for "B2B video agency".
 *
 * Chosen for the same reason /founder-led-video was: the SERP has no defender.
 * Synthesia and HeyGen do not rank on it at all, because the query is not
 * tool-shaped. The results are small production-company domains with no
 * authority moat, and the person searching is already spending money and is
 * choosing between providers rather than looking for a free generator.
 *
 * So this page is written as an evaluation aid, not a pitch. The honest
 * comparison table and the "what it will not do" list are the point: a buyer
 * this far down the funnel has read four decks that all claim everything, and
 * the page that names a limit is the one they believe.
 */

const PATH = '/b2b-video-agency';
const TITLE = 'B2B video agency: what to compare before you sign';
const DESCRIPTION =
  'Most B2B video agencies price per video and take a month to deliver. Compare the three real options, and the questions to ask an agency before you sign.';

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
 * Cost and turnaround are market ranges, not our own client numbers. They are
 * written as ranges on purpose: a single figure would be a statistic we cannot
 * source, and the spread is the honest answer anyway.
 */
const OPTIONS = [
  {
    model: 'Traditional production agency',
    cost: '£2,500 to £12,000 a month, or £1,200 to £6,000 a video',
    speed: '3 to 6 weeks from brief to published',
    volume: '2 to 8',
    fails: 'Cost per idea. At £1,500 a video nobody tests a format twice.',
  },
  {
    model: 'In-house, hire or existing marketer',
    cost: '£3,500 to £6,000 a month fully loaded, plus founder hours',
    speed: '1 to 2 weeks once the process settles',
    volume: '8 to 20 in a good month',
    fails: "Continuity. It stops the week the founder's calendar fills.",
  },
  {
    model: 'One intake call plus a presenter',
    cost: '£400 to £900 a month',
    speed: 'Days, and scripts are approved in a batch',
    volume: '20 to 40',
    fails: 'Anything needing the real person or the real product on screen.',
  },
];

const QUESTIONS = [
  {
    q: 'Who writes the script, and can I read three of them unedited?',
    why:
      'Not the finished videos. The scripts, for a client in a category near mine. This is where an agency is either strong or hiding, and a showreel cannot answer it.',
  },
  {
    q: 'What is your cost per published video at my volume?',
    why:
      'Divide the retainer by what actually went live last month for a comparable client, not by what was contracted. The two numbers are rarely the same.',
  },
  {
    q: 'What happens when the shoot day moves twice?',
    why:
      'It will. Ask whether the retainer pauses, who pays for the crew, and what the plan is for a month with no footage. Most contracts are silent and the silence favours them.',
  },
  {
    q: 'Show me a client who has published weekly for six months.',
    why:
      'One client, one channel, six months of dates. Almost every agency can show a good quarter. Very few can show that nothing stopped.',
  },
  {
    q: 'A caption has the wrong figure in it. What does the fix cost?',
    why:
      'Small corrections reveal the real operating model. If a one-word change needs a change request and a week, you are buying projects, not a programme.',
  },
  {
    q: 'Who owns the raw files and the project files when we leave?',
    why:
      "Ask for it in writing. Footage you paid for that lives on an editor's drive under their licence is a cost you pay again the day you switch.",
  },
  {
    q: 'If nobody watches it, whose problem is that?',
    why:
      'Many agencies deliver to a Drive folder and count that as done. Decide before signing whether posting, hooks and the reply-rate question sit with you or with them.',
  },
];

export default function B2BVideoAgencyPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'B2B video agency' }];

  const graph = buildGraph(
    {
      '@type': 'Service',
      '@id': `${SITE}${PATH}#service`,
      name: 'B2B video content agency service',
      serviceType: 'B2B video marketing and content production',
      description: DESCRIPTION,
      provider: { '@id': ID.org },
      areaServed: 'Worldwide',
      audience: { '@type': 'BusinessAudience', audienceType: 'B2B founders and heads of marketing' },
    },
    {
      '@type': 'WebPage',
      '@id': ID.webpage(PATH),
      url: `${SITE}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': ID.site },
      about: { '@id': `${SITE}${PATH}#service` },
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
            <span aria-current="page">B2B video agency</span>
          </nav>

          <Reveal as="h1" style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}>
            How to choose a B2B video agency
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            You are comparing four or five providers with similar showreels and similar decks. This
            page covers the parts the showreel does not: cost per published video, turnaround, and
            what breaks in month three.
          </Reveal>

          <div className="vf-page-prose">
            <h2>What a B2B video content agency actually does</h2>
            <p>
              Take the deck away and there are four jobs. Someone decides what a video should argue.
              Someone writes it. Someone films it. Someone cuts it, captions it and sizes it for the
              feed. Agencies differ mostly in which of the four they are genuinely good at, and which
              ones they hand back to you without saying so.
            </p>
            <p>
              The first job decides the result. Editing is a commodity now and the gap between a good
              cut and a great one moves almost nothing in B2B. The gap between a video with a real
              opinion in it and a video that restates your homepage moves everything. So notice which
              of the four an agency sells you on. If the pitch is cameras, lighting and turnaround
              times, you are buying the last two jobs at the price of all four.
            </p>
            <p>
              Most firms ranking for this search are production companies that added B2B to the
              website. That is not an insult, they can shoot. It does mean they price and think in
              projects, and a project has a start and an end. Your buyers do not.
            </p>

            <h3>Where the traditional agency model breaks</h3>
            <p>
              Three failures, and they are structural rather than a matter of picking a better
              supplier.
            </p>
            <ul>
              <li>
                <strong>Per-video pricing kills testing.</strong> When one video costs £1,500, nobody
                publishes a format twice to find out whether it works. You get one careful piece a
                fortnight, each one hedged and signed off by three people, because each one had to
                justify the invoice. Careful is the exact quality the feed punishes.
              </li>
              <li>
                <strong>The turnaround is a month, minimum.</strong> Brief on the 3rd, scripts on the
                12th, shoot on the 24th, cuts back on the 5th. Six weeks from idea to feed is normal.
                Anything tied to what happened in your market this month is stale before it is
                published, so you drift towards evergreen content nobody argues with.
              </li>
              <li>
                <strong>The shoot day belongs to the busiest person you have.</strong> It is a single
                date in the founder&apos;s diary. It moves once for a customer, then once for a board
                meeting, and now the month has no content while the retainer has already been paid.
                Two reschedules ends most programmes. Not the budget, the calendar.
              </li>
            </ul>
            <p>
              There is a quieter fourth. Files land in a shared folder, the agency marks the project
              complete, and posting, hooks, comments and follow-up are yours. That work is where the
              meetings come from, and it is almost never in the scope of work.
            </p>

            <h2>B2B video marketing agency vs in-house vs a presenter model</h2>
            <p>
              Three ways to get video made, compared on what a buyer actually has to defend
              internally. Costs are typical market ranges rather than our own client figures.
            </p>
            <figure
              className="wp-block-table"
              tabIndex={0}
              role="region"
              aria-label="Table comparing three B2B video models, scroll sideways to see all columns"
            >
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Typical cost</th>
                    <th>Idea to published</th>
                    <th>Videos a month</th>
                    <th>Where it fails</th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map((row) => (
                    <tr key={row.model}>
                      <td>{row.model}</td>
                      <td>{row.cost}</td>
                      <td>{row.speed}</td>
                      <td>{row.volume}</td>
                      <td>{row.fails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              In-house is the strongest of the three on quality and it is the one most likely to
              stop. A person who sits in your sales calls hears the objection language nobody outside
              the company can invent, and that shows in the work. It fails on continuity: one person
              holds the whole process, and when they leave or get pulled onto a launch, the channel
              goes quiet for a quarter.
            </p>
            <p>
              The agency route survives the leaving problem and loses on volume and cost per idea.
              The presenter route wins on both of those and gives up something real, which is the
              next section.
            </p>

            <h2>Questions to ask a B2B video agency before you sign</h2>
            <p>
              These are the ones that change the answer. Ask them on a call, in writing afterwards,
              and treat a slide as a non-answer.
            </p>
            <ul>
              {QUESTIONS.map((item) => (
                <li key={item.q}>
                  <strong>{item.q}</strong> {item.why}
                </li>
              ))}
            </ul>
            <p>
              One more, and it is the uncomfortable one: ask how many of the clients in their case
              studies are still paying them. A firm with good retention answers it in a sentence. A
              firm that changes the subject has told you what the twelve-month experience looks like.
            </p>

            <h2>How Video Funker works differently</h2>
            <p>
              We removed the shoot day rather than trying to schedule it better. One intake call of
              about forty-five minutes captures the positioning, the objections you hear on sales
              calls and the opinions your market disagrees with. Scripts are drafted from that call
              in your own phrasing, a human reviews them, and a lifelike presenter delivers them on
              camera. Pricing is monthly and does not move with the number of videos, so testing a
              format four times costs nothing extra.
            </p>
            <p>
              The practical difference is where your hours go. A crewed month asks five to seven
              hours of the founder and a fixed date. This asks one to two hours, spent approving
              scripts, at whatever time of day suits. There is a fuller cost breakdown on the{' '}
              <Link href="/founder-led-video">founder-led video page</Link>, including what a month
              looks like when the founder films it themselves.
            </p>

            <h3>What it does not do</h3>
            <ul>
              <li>
                It is not the founder&apos;s own face. If the whole strategy is that this specific
                person is building in public, run the presenter on the company channel and film the
                founder separately.
              </li>
              <li>
                No reaction content. Anything responding to something that happened yesterday needs a
                real person and a phone.
              </li>
              <li>
                Nothing with the real product on screen, and nothing with a customer in it. Demos,
                walkthroughs and testimonials are a different job, and we will tell you to film them.
              </li>
              <li>
                It cannot hold an opinion nobody gave it. A vague intake call produces forty vague
                videos, faster than any other method produces forty vague videos.
              </li>
              <li>Disclosure is not optional, on the ethics and on the platform rules.</li>
            </ul>
            <p>
              The split that works for most clients is roughly eighty percent presenter-delivered
              content carrying the volume, plus one unpolished clip a week from the founder&apos;s
              phone carrying the proof that a real person is behind it. That second half costs about
              twenty minutes a week. We wrote up the trade-off in detail in{' '}
              <Link href="/blog/ai-presenter-vs-filming-yourself">
                the comparison of an AI presenter against filming yourself
              </Link>
              , including the point at which filming is clearly the better answer.
            </p>
          </div>

          {/* vf-pagecta, not vf-blogcta: the blog defines its own .vf-blogcta in
              app/blog/blog.css, which only the blog layout imports. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-agency-cta">
            <div>
              <h2 id="vf-agency-cta" style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}>
                Compare us on the work, not the deck
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
