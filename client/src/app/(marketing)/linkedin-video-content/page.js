import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * The service page for done-for-you LinkedIn content.
 *
 * Query chosen from the SERP rather than from the product name. "Done-for-you
 * LinkedIn content", "LinkedIn content agency for founders" and "LinkedIn video
 * content service" all return the same page type: ghostwriting retainers and
 * freelancers selling two to four written posts a week. Not one of them offers
 * video at volume, and not one of them answers the founder who will not film,
 * which is the objection that ends most of those retainers by month three.
 *
 * Deliberately NOT targeted here: "AI video generator" and its neighbours. Those
 * SERPs belong to Synthesia, HeyGen, Canva and Runway, every result is a free
 * tool, and the searcher wants $0 rather than a retainer.
 */

const PATH = '/linkedin-video-content';
const TITLE = 'Done-for-you LinkedIn video content for B2B founders';
const DESCRIPTION =
  'A LinkedIn content service that ships video, not just posts. 20 to 40 videos a month from one intake call, written, delivered and sized for the feed.';

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
 * Feed signals, ordered by the stage they are tested at rather than by weight,
 * because the first two rows are decided before the rest are ever measured.
 */
const SIGNALS = [
  {
    signal: 'The first two seconds',
    testing: 'Did the scroll stop',
    weight: 'Decisive',
    cost: 'A claim on frame one. No intro card, no logo sting.',
  },
  {
    signal: 'Burned-in captions',
    testing: 'Can a muted viewer follow it',
    weight: 'High',
    cost: 'Every video captioned, with no exceptions.',
  },
  {
    signal: 'Vertical or square framing',
    testing: 'How much screen the post holds',
    weight: 'High',
    cost: 'Framing decided before the script, not cropped after.',
  },
  {
    signal: 'Watch-through past 30 seconds',
    testing: 'Whether the point arrived',
    weight: 'High',
    cost: 'One idea per video. Cut the setup.',
  },
  {
    signal: 'Comments with substance',
    testing: 'Whether it is worth arguing with',
    weight: 'High',
    cost: 'A stated position some of your market disagrees with.',
  },
  {
    signal: 'Saves',
    testing: 'Whether it is worth keeping',
    weight: 'High, and under-reported',
    cost: 'Something reusable: a number, a checklist, a script.',
  },
  {
    signal: 'Reactions',
    testing: 'Very little on their own',
    weight: 'Low',
    cost: 'Nearly free, and worth about that.',
  },
  {
    signal: 'A link in the post body',
    testing: 'Whether you send people off the feed',
    weight: 'Suppressed',
    cost: 'Move it to the first comment.',
  },
];

export default function LinkedInVideoContentPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'LinkedIn video content' }];

  const graph = buildGraph(
    {
      '@type': 'Service',
      '@id': `${SITE}${PATH}#service`,
      name: 'Done-for-you LinkedIn video content',
      serviceType: 'LinkedIn content production',
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
            <span aria-current="page">LinkedIn video content</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            Done-for-you LinkedIn video content for B2B founders
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            Every other content retainer on your shortlist ships words. Words stopped separating
            anybody the month your competitors started drafting from the same model you do.
          </Reveal>

          <div className="vf-page-prose">
            <h2>Why LinkedIn ghostwriting stopped working</h2>
            <p>
              A ghostwriting retainer used to buy something scarce. Three good posts a week in
              somebody else&apos;s voice took a skilled human several hours, and most founders could
              not produce them at all. That scarcity is gone. Your competitors, their agencies and
              the intern all draft from the same handful of models, using prompt patterns copied
              from the same threads, tuned against the same corpus of posts that performed well two
              years ago.
            </p>
            <p>
              You can watch the result by scrolling for ninety seconds. The one-line opener. The
              break after every sentence. The turn at the fourth paragraph. The question at the end
              that nobody answers. Four companies, one voice. A buyer comparing vendors reads two of
              those posts and stops reading the third, because the shape of the thing now announces
              that no particular person is behind it.
            </p>
            <p>
              That is the actual loss, and it is bigger than style. Text used to carry a small
              guarantee: somebody sat down and thought about this before you read it. It carries no
              such guarantee now, and buyers worked that out faster than the agencies selling it did.
            </p>
            <p>
              Written posts still have a job. They are skimmable, quotable and easy to forward to the
              colleague who signs off, which is why one ships with every video we produce. What
              changed is that words alone no longer tell a buyer which of four vendors has done the
              work. A face does, saying something specific, often enough that your name is familiar
              before the first conversation. It is harder to produce, which is why it still separates
              people.
            </p>
            <p>
              The services you will compare this against sell two to four written posts a week and a
              call once a month. None of them sell video at volume, because volume is where the
              founder&apos;s calendar breaks, and the usual answer to that is animation or stock
              footage, which throws away the face and keeps the cost. There is a longer version of
              that argument in{' '}
              <Link href="/founder-led-video">founder-led video without the filming day</Link>.
            </p>

            <h2>What a month of LinkedIn video content includes</h2>
            <p>
              Volume first, because it is the number every buyer tries to negotiate down and the one
              that decides whether the rest works. A single strong video does close to nothing.
              Recognition starts at roughly the fourth or fifth time the same face turns up in a few
              weeks, so the month is sized to clear that bar for a named list of people rather than
              to produce something to be proud of once.
            </p>
            <ul>
              <li>
                Twenty to forty short videos, thirty to sixty seconds each, one idea per video,
                captioned and framed for a phone.
              </li>
              <li>
                Two or three longer pieces of two to three minutes, for the arguments that genuinely
                do not fit in a minute.
              </li>
              <li>
                A written post for every video, in your phrasing, so the post still works for the
                reader who never presses play.
              </li>
              <li>
                Four to six carousels, which turn one argument into something a reader swipes through
                and saves.
              </li>
              <li>
                One long article a month on your own site, for the buyer who watches, gets
                interested, and then wants to read before booking anything.
              </li>
              <li>
                Outreach angles mapped to what was published, so the sales side is not writing cold
                messages from a blank page.
              </li>
            </ul>
            <p>
              Cadence is five posting days a week: one video most days, two on the days there is
              something worth doubling up on. A month is approved in one pass, in one document,
              before any of it goes out. The founder spends about forty-five minutes on the intake
              call at the start and roughly an hour reviewing each month after that. That is the
              whole ask on their calendar, and it is the reason the programme is still running in
              month six.
            </p>

            <h3>What a month of video content does not include</h3>
            <ul>
              <li>
                Product demos, or anything with the real interface on screen. A presenter cannot show
                your software working. Record those yourself.
              </li>
              <li>Customer stories with the customer in them. Those need the customer.</li>
              <li>
                Reaction content tied to something that happened yesterday. A monthly batch is the
                wrong shape for it. Keep one slot a week for a clip filmed on a phone.
              </li>
              <li>
                Opinions the intake call never gave us. Forty vague videos are worse than four sharp
                ones, and they are worse faster.
              </li>
            </ul>

            <h2>How the LinkedIn feed decides whether anyone sees your video</h2>
            <p>
              Volume only pays if the posts survive the first test the feed runs. LinkedIn shows a
              new video to a small slice of your network and measures one thing: whether the scroll
              stopped. Dwell, not likes. That is settled inside about two seconds, which is why the
              opening carries more weight than the rest of the video put together.
            </p>
            <p>
              It is also why an intro card is the most expensive habit on this list. A logo sting, a
              title slide, a slow zoom onto somebody who is about to start talking: every one of them
              spends the window being measured. Open on a face already mid-sentence, on a claim, with
              the caption already on screen.
            </p>
            <p>
              Captions are not an accessibility footnote here, though they are that as well. Most
              feed video is watched muted. A silent video with no text on it is a box the viewer
              cannot read, so they scroll, and the scroll is the measurement.
            </p>
            <p>
              The last row catches almost everybody. An outbound link in the post body suppresses
              reach, because a click off the feed is the outcome the feed is built to avoid. Put the
              link in the first comment.
            </p>
            <figure className="wp-block-table">
              <table>
                <thead>
                  <tr>
                    <th>Signal</th>
                    <th>What the feed is testing</th>
                    <th>Weight</th>
                    <th>What it costs you to get it right</th>
                  </tr>
                </thead>
                <tbody>
                  {SIGNALS.map((row) => (
                    <tr key={row.signal}>
                      <td>{row.signal}</td>
                      <td>{row.testing}</td>
                      <td>{row.weight}</td>
                      <td>{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              None of this is published by LinkedIn, so treat the weights as what we read off client
              analytics rather than as documentation. The order of the rows has been stable for us.
              The full sequence, including what changes between the first push and the second, is in{' '}
              <Link href="/blog/linkedin-video-ranking-2026">
                how the LinkedIn feed ranks video in 2026
              </Link>
              .
            </p>

            <h2>How LinkedIn video content makes outreach land</h2>
            <p>
              Posting on its own is slow. It works on the timescale of quarters, because you are
              waiting for the right buyer to happen past the right post. It gets quick when the
              people being posted at and the people being contacted are the same list.
            </p>
            <p>
              The order matters. Build the target list first. Run three or four weeks of video while
              those accounts are being connected with, so the face is in their feed before anything
              is asked of them. Then send the message. Same words, entirely different reception: a
              stranger asking for thirty minutes is an interruption, while a name the recipient half
              recognises reads as the next step in something that already started. They rarely
              remember which video they saw. They remember that they have seen you.
            </p>
            <p>
              Measure the difference rather than the volume. Views are the worst metric available and
              the one every agency reports, because a video that reaches two thousand of the wrong
              people looks identical on a dashboard to one that reaches two hundred of the right ones.
              The number that has predicted pipeline for us is the gap in positive reply rate between
              contacts who were served the videos and contacts who were not. Expect it to move in
              weeks four to seven.
            </p>
            <p>
              Two honest limits. This does nothing for you if replies land in an inbox nobody reads
              within a day, because the whole advantage is a warm recipient and warmth expires. And
              if your positioning is genuinely the same as three competitors, video will publish that
              fact at higher resolution than text ever did. The intake call is where that gets found,
              and it is better found there than in month two.
            </p>
          </div>

          {/* vf-pagecta, not vf-blogcta: the blog defines its own .vf-blogcta in
              app/blog/blog.css, which only the blog layout imports. */}
          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-lvc-cta">
            <div>
              <h2
                id="vf-lvc-cta"
                style={{ font: `700 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}
              >
                See one before you commit
              </h2>
              <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
                One intake call, and your first video comes back finished. No crew, no studio, no
                filming day, and nothing to decide until you have watched it.
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
