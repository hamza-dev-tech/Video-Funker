import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * The service page for founder-led video.
 *
 * This is the first page on the site built for a query rather than for the
 * brand, and the query was chosen from evidence rather than from what the
 * product is called. The SERPs for "AI video generator" and its neighbours are
 * owned end to end by Synthesia, HeyGen, Canva and Runway; every result is a
 * free-tool landing page, and the person searching wants a $0 generator rather
 * than a retainer, so even a first-place finish would convert close to nobody.
 *
 * "Founder led video" is the opposite. No AI tool appears on it at all. The
 * incumbents are small production-company domains that answer camera
 * reluctance with animation and screen recordings, and not one of them offers
 * a presenter as the alternative. That gap is exactly what this company sells.
 */

const PATH = '/founder-led-video';
const TITLE = 'Founder-led video for B2B, without the filming day';
const DESCRIPTION =
  'Founder-led video works because buyers trust a face. The cost is calendar, not camera. Here is what a month costs in hours, and how to run it when the founder will not film.';

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

const COSTS = [
  {
    approach: 'Founder films it, batched',
    hours: '8 to 14',
    cash: '£150 to £400',
    output: '12 to 20',
    breaks: 'Month three. The calendar wins.',
  },
  {
    approach: 'Crew and a monthly shoot day',
    hours: '5 to 7',
    cash: '£1,800 to £4,500',
    output: '8 to 15',
    breaks: 'Cost per idea. Nobody reshoots a weak take next week.',
  },
  {
    approach: 'Presenter, from one intake call',
    hours: '1 to 2',
    cash: '£400 to £900',
    output: '20 to 40',
    breaks: 'Anything that needs the real person on screen.',
  },
];

export default function FounderLedVideoPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'Founder-led video' }];

  const graph = buildGraph(
    {
      '@type': 'Service',
      '@id': `${SITE}${PATH}#service`,
      name: 'Founder-led video production for B2B',
      serviceType: 'Video content production',
      description: DESCRIPTION,
      provider: { '@id': ID.org },
      areaServed: 'Worldwide',
      audience: { '@type': 'BusinessAudience', audienceType: 'B2B founders and marketing leaders' },
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
            <span aria-current="page">Founder-led video</span>
          </nav>

          <Reveal as="h1" style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}>
            Founder-led video for B2B, without the filming day
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            Buyers check who you are before they take the meeting, and a face is the one thing they
            still trust. The reason most companies never keep it up has nothing to do with cameras.
          </Reveal>

          <div className="vf-page-prose">
            <h2>Why founder-led video outperforms feature marketing</h2>
            <p>
              Every B2B site in your category says the same five things. Faster, smarter, built for
              teams, trusted by leaders, book a demo. A buyer comparing four vendors is reading four
              versions of one page, and by the third they have stopped reading and started looking
              for a reason to cut somebody.
            </p>
            <p>
              That is the actual job at the shortlist stage. Not persuasion, elimination. And you do
              not get eliminated on features, because by then the features are close enough that
              nobody can separate them. You get eliminated on whether the buyer believes the people
              behind the product understand their problem.
            </p>
            <p>
              A feature page is a claim with nobody attached to it. Video answers the question a page
              cannot, in about eight seconds, because a person on camera gives away whether they have
              lived the problem or read it in a positioning document.
            </p>

            <h2>The real cost of a month of founder-led video</h2>
            <p>
              The wall everyone hits is never the camera. Editing is cheap and solved. The wall is
              calendar: a month of consistent video quietly assumes ten to fourteen hours of one
              specific, expensive person, and that person is also running the company.
            </p>
            <figure className="wp-block-table">
              <table>
                <thead>
                  <tr>
                    <th>Approach</th>
                    <th>Founder hours per month</th>
                    <th>Cash per month</th>
                    <th>Videos per month</th>
                    <th>Where it breaks</th>
                  </tr>
                </thead>
                <tbody>
                  {COSTS.map((row) => (
                    <tr key={row.approach}>
                      <td>{row.approach}</td>
                      <td>{row.hours}</td>
                      <td>{row.cash}</td>
                      <td>{row.output}</td>
                      <td>{row.breaks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              The column that decides it is the last one. Teams sustain self-filming for about two
              months. A crew shoot concentrates a month into one day, which sounds efficient until
              you learn three weeks later that one of the fifteen videos was the good one, and the
              format that worked cannot be repeated until the next shoot day.
            </p>

            <h2>What to do when the founder will not go on camera</h2>
            <p>
              This is the objection that ends most programmes, and the honest answer is that it is
              usually correct. If someone dreads it, they will not do it in month four, and a
              programme that stops does worse than one that never started, because the buyers who
              were forming an impression form a different one.
            </p>
            <p>
              The production companies ranking for this question answer it with animation, screen
              recordings and stock footage. All three lose the thing that made video work: there is
              no face, so there is nobody to trust.
            </p>
            <p>
              A lifelike presenter keeps the face and removes the filming day. One intake call,
              roughly forty-five minutes, captures the positioning, the objections and the opinions
              the market disagrees with. Scripts are drafted from that call in the founder&apos;s own
              phrasing, reviewed by a human, and delivered by a presenter. The founder spends one to
              two hours a month instead of twelve.
            </p>

            <h3>What it does not solve</h3>
            <ul>
              <li>
                It is not the founder&apos;s own face. For a personal brand play, where the whole
                point is that this specific person is building in public, use it for the company
                channel and film the founder separately.
              </li>
              <li>
                It cannot hold an opinion nobody gave it. A vague intake call produces forty vague
                videos faster than any other method produces forty vague videos.
              </li>
              <li>
                It does not do reaction content. Anything tied to yesterday, anything with the real
                product on screen, anything with a customer in it: film that.
              </li>
              <li>Disclosure is not optional, on the ethics and increasingly on the platform rules.</li>
            </ul>
            <p>
              The arrangement that works for most of our clients is neither extreme. Roughly eighty
              percent presenter-delivered content carries the volume, and one unpolished clip a week
              from the founder&apos;s phone carries the proof that a real person is behind it. That
              second half costs about twenty minutes a week.
            </p>

            <h2>What a month of founder-led video includes</h2>
            <ul>
              <li>Twenty to forty short videos, scripted, delivered, captioned and sized for the feed.</li>
              <li>A written post for every video, in your voice.</li>
              <li>Carousels that turn one idea into a swipeable argument.</li>
              <li>Long-form articles for the buyer who wants to read after they watch.</li>
              <li>Outreach angles tied to what you published, so a cold message lands warm.</li>
            </ul>
            <p>
              Volume is the uncomfortable part and it is not optional. One good video does close to
              nothing. The mechanism starts working when a buyer has seen you four or five times
              across a few weeks and has formed an impression before you ever contact them.
            </p>

            <h2>How to tell whether it is working</h2>
            <p>
              Views are the worst available metric and the one everybody reports. A video that reaches
              two thousand of the wrong people and one that reaches two hundred of the right ones look
              opposite on a dashboard and are opposite in reality.
            </p>
            <p>
              The signal that has actually predicted pipeline for us is the difference in positive
              reply rate between contacts who were served the videos and contacts who were not.
              Expect it to move in weeks four to seven. Anything faster is usually one video that
              travelled, which is pleasant and not repeatable.
            </p>
            <p>
              There is more detail on all of this in{' '}
              <Link href="/blog/founder-led-video-b2b-trust">
                why B2B buyers trust a face over a feature list
              </Link>{' '}
              and in{' '}
              <Link href="/blog/ai-presenter-vs-filming-yourself">
                the full cost breakdown of filming a month of video
              </Link>
              .
            </p>
          </div>

          {/* vf-pagecta, not vf-blogcta. The blog defines its own .vf-blogcta
              in app/blog/blog.css, which the blog layout alone imports; reusing
              the name here would either render unstyled or force a second
              definition in globals that silently competes with it. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-flv-cta">
            <div>
              <h2 id="vf-flv-cta" style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}>
                Your first video is free
              </h2>
              <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
                One intake call, and you see a finished video before you decide anything. No crew, no
                studio, no filming day.
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
