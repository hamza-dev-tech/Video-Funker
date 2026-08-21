import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * Comparison page: traditional video agencies as a category, against the
 * intake-call model.
 *
 * No product is named or rated. The reader here is not shopping for a tool
 * subscription, they are already spending money on video and asking whether the
 * agency shape is the right one for what they need next year. That reader can
 * be argued with honestly, which is why the strengths section is real and the
 * decision section names the cases where an agency is plainly the better buy.
 *
 * Sibling page /b2b-video-agency answers a different question: how to evaluate
 * agencies against each other. This one answers whether to use one at all.
 */

const PATH = '/vs/video-agencies';
const TITLE = 'Video agency alternative: what you gain and what you give up';
const DESCRIPTION =
  'A video agency is the right buy for two or three set pieces a year and wrong for weekly volume. The mechanism behind that, and when an agency still wins.';

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
 * Cost per published video rather than monthly retainer, because that is the
 * number that decides whether a team tests a format or defends it. Ranges are
 * typical market figures, not our own client data. The last row is arithmetic
 * on our published monthly price divided by our published monthly output.
 */
const MODELS = [
  {
    model: 'Production agency, monthly retainer',
    unit: '£400 to £3,000',
    speed: '3 to 6 weeks',
    volume: '24 to 96',
    best: 'A consistent look, and anything that has to be photographed.',
  },
  {
    model: 'Production company, project by project',
    unit: '£1,200 to £6,000',
    speed: '4 to 8 weeks',
    volume: '3 to 12',
    best: 'The two or three set pieces that get used a hundred times.',
  },
  {
    model: 'In-house, one hire plus kit',
    unit: '£150 to £400',
    speed: '1 to 2 weeks',
    volume: '96 to 240',
    best: 'Voice. They sit in your sales calls and hear the real objections.',
  },
  {
    model: 'Founder films it on a phone',
    unit: 'Near zero, plus 8 to 14 founder hours a month',
    speed: 'Same day',
    volume: '0 to 240, depending on the quarter',
    best: 'Proof that a real person is behind the account.',
  },
  {
    model: 'One intake call plus a presenter',
    unit: '£10 to £45',
    speed: 'Days, approved in a monthly batch',
    volume: '240 to 480',
    best: 'Volume at a fixed cost, so a format can be tested four times.',
  },
];

export default function VideoAgenciesComparisonPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'Video agencies vs AI video' }];

  /**
   * WebPage plus breadcrumb only. `isPartOf` and `about` point at the WebSite
   * and Organization nodes the root layout emits into every page, so neither is
   * a dangling reference. The Service entity lives on /b2b-video-agency and is
   * not duplicated here with a second, competing description.
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
            <span aria-current="page">Video agencies vs AI video</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            B2B video agency vs AI video from one intake call
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            These are not competing suppliers. They are two different products that happen to arrive
            as video files, and most companies that get this right end up buying a little of both.
          </Reveal>

          <div className="vf-page-prose">
            <h2>What a B2B video agency is genuinely good at</h2>
            <p>
              A comparison page that cannot name a real strength of the alternative is an advert, so
              here are five, and every one of them is something we cannot do.
            </p>
            <ul>
              <li>
                <strong>Direction.</strong> A good director gets a nervous founder to say the thing
                they actually meant on take seven. That is a human skill, performed in the room, and
                it is the largest quality gap between agency footage and everything else on this page.
                No amount of scripting substitutes for someone saying &quot;again, but tell me like I
                am a customer&quot;.
              </li>
              <li>
                <strong>Anything that has to be photographed.</strong> The factory floor. The product
                in a customer&apos;s hands. The team in a room. If the argument depends on something
                existing in the physical world, only a camera can make it, and no generated presenter
                changes that.
              </li>
              <li>
                <strong>Set pieces.</strong> The funding announcement film, the conference opener, the
                brand piece a company keeps for two years. These cost thousands because they get used
                hundreds of times, and that maths works out.
              </li>
              <li>
                <strong>Accountability.</strong> A named producer, a contract, insurance, cleared
                music, released talent, a signoff trail. If a launch date is fixed and there is six
                figures of paid media behind it, you want a supplier with professional indemnity
                cover.
              </li>
              <li>
                <strong>Invention.</strong> A strong agency invents a look and a format you keep using
                after they have gone. That is a creative act, and there is no other way to buy it.
              </li>
            </ul>
            <p>
              Notice what those five have in common. They are all jobs where one video carries a lot
              of weight. That is the shape an agency is built for, and it is a real shape.
            </p>

            <h2>Where the video agency model stops working</h2>
            <p>
              Four failures, and they are structural rather than a matter of finding a better
              supplier. Picking a nicer agency does not move any of them.
            </p>
            <p>
              <strong>Crew-day economics price out weekly publishing.</strong> A shoot day costs
              nearly the same whether you make one video or twelve: crew call, kit hire, location,
              travel, insurance, an edit suite. Agencies staff for utilisation and price for the day.
              That pricing is entirely rational for them and it is structurally hostile to a weekly
              cadence, which is why the honest agency answer to &quot;can we publish three times a
              week&quot; is a bigger retainer rather than a different process.
            </p>
            <p>
              <strong>A fixed price per video turns publishing into procurement.</strong> When one
              video costs £1,200, three people approve it, and everything three people approve is
              hedged. Hedged is the exact quality the feed ignores. So per-video pricing does not make
              your content expensive so much as it makes it safe, and safe is the actual failure. Cost
              per idea is the number to watch, not cost per video.
            </p>
            <p>
              <strong>The shoot day is a single point of failure on the busiest diary you have.</strong>{' '}
              It moves once for a customer and once for a board meeting, and now the month has no
              content while the retainer has already been paid. Two reschedules ends most programmes.
              In our experience budget almost never kills them. The calendar does.
            </p>
            <p>
              <strong>Latency turns everything evergreen.</strong> Brief on the 3rd, scripts on the
              12th, shoot on the 24th, cuts back on the 5th. Six weeks from idea to feed is normal and
              nobody is doing anything wrong. But anything tied to your market this month is stale on
              arrival, so the work drifts towards material nobody argues with, which is the first
              failure again by a different route.
            </p>
            <p>
              There is a quieter fifth. Delivery is a folder. Posting, hooks, the first comment,
              replies and follow-up sit with you, and that is where the meetings come from. If you are
              currently comparing providers rather than models, the{' '}
              <Link href="/b2b-video-agency">questions to ask a B2B video agency before you sign</Link>{' '}
              covers how to get that written into a scope of work.
            </p>

            <h2>Video agency alternatives compared on cost per published video</h2>
            <p>
              Five ways to get B2B video made, measured on the unit that decides behaviour. Figures
              are typical market ranges rather than our own client data, and the volume column is a
              year, not a month.
            </p>
            <figure
              className="wp-block-table"
              tabIndex={0}
              role="region"
              aria-label="Table comparing five video production models, scroll sideways to see all columns"
            >
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Cost per published video</th>
                    <th>Decision to feed</th>
                    <th>Videos a year</th>
                    <th>Best at</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((row) => (
                    <tr key={row.model}>
                      <td>{row.model}</td>
                      <td>{row.unit}</td>
                      <td>{row.speed}</td>
                      <td>{row.volume}</td>
                      <td>{row.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              The missing column is craft, and it is missing because we cannot score it honestly. On
              craft the top two rows win, and they win by a distance nobody should pretend away. What
              the table does show is that craft and volume are bought separately, at prices two orders
              of magnitude apart, and that most content plans quietly assume one budget will deliver
              both.
            </p>

            <h2>Which video model to choose for the next twelve months</h2>
            <p>Four questions about your own company. The answers decide this, not the table.</p>
            <ul>
              <li>
                <strong>How many videos does next year actually need?</strong> Under about fifteen,
                each carrying a launch or an event, and an agency is the better purchase. A fixed
                monthly model is priced for volume and is poor value below it. At ten videos a year we
                are the wrong thing to buy and we would rather say that now.
              </li>
              <li>
                <strong>Does the argument depend on something being filmed?</strong> Real product on
                screen, real premises, a real customer. Then it is a camera, ours or anyone
                else&apos;s, and this is not negotiable.
              </li>
              <li>
                <strong>How many people sign off each frame?</strong> If a compliance function reviews
                everything, buy the model that assumes review: an agency with a producer whose job is
                chasing approvals. Thirty scripts a month through a legal queue is a bad plan and it
                will fail in month two.
              </li>
              <li>
                <strong>Is the goal recognition across a named list, or one film used a hundred
                times?</strong> Recognition is a volume problem: a buyer forms an impression at the
                fourth or fifth sighting, not the first. One excellent film does not get you there and
                sixty adequate ones do. If your goal is the other one, buy the film.
              </li>
            </ul>

            <h3>When the answer is not us</h3>
            <ul>
              <li>
                The founder already films weekly and enjoys it. Keep filming. Their own face beats a
                presenter and we would be selling you something worse.
              </li>
              <li>
                It is a personal brand play, where the whole point is that this specific person builds
                in public.
              </li>
              <li>
                Demos, walkthroughs, customer stories and anything with the interface on screen. A
                presenter cannot show your software working.
              </li>
              <li>
                Regulated categories where synthetic presentation is restricted, or where the required
                disclosure would undercut the piece. Disclosure is not optional for us, on the ethics
                and on the platform rules, so if it breaks the format then the format is wrong.
              </li>
              <li>
                No settled positioning yet. Volume publishes vagueness faster than anything else on
                this page. Fix that first, with whoever you already trust to help.
              </li>
              <li>
                Total budget under about three hundred pounds a month. Buy a tripod and a decent
                microphone instead.
              </li>
            </ul>
            <p>
              The arrangement that works for most of our clients keeps both. An agency or a producer
              for the two or three set pieces a year that need a camera and a director. A presenter
              carrying the weekly volume from one intake call of about forty-five minutes. And one
              unpolished clip a week filmed on the founder&apos;s phone, which costs roughly twenty
              minutes and carries the proof that a real person is behind all of it. The hour-by-hour
              version of that trade-off is on the{' '}
              <Link href="/founder-led-video">founder-led video page</Link>, and what a month of
              output looks like is set out on the{' '}
              <Link href="/linkedin-video-content">LinkedIn video content page</Link>.
            </p>
          </div>

          {/* vf-pagecta, not vf-blogcta: the blog defines its own .vf-blogcta in
              app/blog/blog.css, which only the blog layout imports. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-agencies-cta">
            <div>
              <h2
                id="vf-agencies-cta"
                style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}
              >
                See the volume half before you commit
              </h2>
              <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
                Your first video is free. One intake call, and a finished video comes back. No crew,
                no studio, and no shoot day to reschedule twice.
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
