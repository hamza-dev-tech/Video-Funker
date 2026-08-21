import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * The about page.
 *
 * It exists for a reason the rest of the site cannot cover: every other page
 * argues that buyers decide on whether they believe the people behind a
 * product, and until now this site named nobody. A service that sells trust in
 * a face and hides its own is arguing against itself.
 *
 * The identity facts are placeholders on purpose. Founder name, founding year,
 * team size and location are not knowable from the codebase, and an invented
 * one on an E-E-A-T page is the single worst thing that could be written here.
 * Replace the [[BRACKETED]] values before this ships, or delete the sentences
 * that carry them. The rest of the page is written so that it still stands up
 * if that section is cut entirely, because the point of view is the part that
 * is actually ours.
 *
 * The schema node is AboutPage rather than a bare WebPage, and it points at the
 * Organization the root layout already describes rather than describing the
 * company a second time. Two descriptions of one entity in one dataset is how
 * you end up with two entities.
 */

const PATH = '/about';
const TITLE = 'About Video Funker and how we make founder-led video';
const DESCRIPTION =
  'Video Funker makes founder-led video for B2B teams whose founder will not film. What we believe, how a month gets made, and the work we turn down.';

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

export default function AboutPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'About' }];

  const graph = buildGraph(
    {
      '@type': 'AboutPage',
      '@id': ID.webpage(PATH),
      url: `${SITE}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': ID.site },
      // The page is about the company, and the company is described once, in
      // the root layout. A reference, never a second copy.
      mainEntity: { '@id': ID.org },
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
            <span aria-current="page">About</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            About Video Funker
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            The rest of this site argues that buyers decide on the people behind a product. So here
            is who is making that argument, what we think is actually true about it, and the work we
            turn down.
          </Reveal>

          <div className="vf-page-prose">
            <h2>What Video Funker does</h2>
            <p>
              One intake call, roughly forty-five minutes, becomes a month of video. Scripts are
              written from that call in your own phrasing, a lifelike presenter delivers them on
              camera, and you get finished clips sized for the feed, a written post for each one,
              carousels, longer articles, and outreach angles tied to what you just published.
            </p>
            <p>
              The founder spends one to two hours a month on it rather than ten to fourteen. The
              first video is free and comes back finished, so you see the thing before you agree to
              anything.
            </p>
            <p>
              The presenter is not a real person, and we say that on every page that mentions it.
              Disclosure is not a preference we hold. It is the ethics of the format, and
              increasingly it is the platform rules as well.
            </p>

            <h2>Why we build everything around founder-led video</h2>
            <p>
              Three beliefs. The third one is where people usually disagree with us, and it is the
              one that decides whether any of this works.
            </p>
            <p>
              <strong>Buyers eliminate before they choose.</strong> At the shortlist stage someone is
              reading four vendor sites that say the same five things, and the job in front of them
              is not picking a winner. It is cutting somebody. Features do not settle that, because
              by then the features are close enough that nobody can separate them. What settles it is
              whether the buyer believes the people behind the product have lived the problem. A
              page cannot answer that question. A person on camera answers it in about eight seconds,
              including when the answer is no.
            </p>
            <p>
              <strong>The constraint is calendar, not camera.</strong> Almost nobody stops because
              editing was hard. Editing is cheap and solved. They stop because a month of consistent
              video quietly assumes ten to fourteen hours of the most expensive person in the
              building, and that person is also running the company. Self-filmed programmes tend to
              hold for about two months.
            </p>
            <p>
              <strong>Volume is the mechanism, not a vanity number.</strong> One good video does close
              to nothing. The effect starts when a buyer has seen you four or five times across a few
              weeks and has already formed a view of you before you ever make contact. A plan that
              cannot survive twenty to forty videos a month will not produce the thing people are
              actually buying.
            </p>
            <p>
              Put those together and the competition is not another agency. It is the version of your
              own programme that quietly stops in month three, after the buyers who were forming an
              impression have formed a different one.
            </p>

            <h2>How a month of B2B video content gets made</h2>
            <p>
              The intake call is the only part that costs you real time, and it is the only part
              nobody can do for you. It captures who you sell to, what triggers a purchase, the
              offers, the objections you hear most, and the opinions you hold that a decent share of
              your market disagrees with. That last one carries the whole month. Everything else on
              the list is already public.
            </p>
            <p>
              Scripts are drafted from that call and then read and edited by a person before anything
              is produced. That review is not there for grammar. A model will write the strongest
              possible version of an opinion you only half hold, and it has no way of knowing which
              sentence would cost you a customer, a hire or a partner. Somebody who sat on your
              intake call does.
            </p>
            <p>
              After that it is production and packaging: the presenter delivers the script, the clip
              is captioned and sized for the feed, and the written post, carousel and article are
              built from the same idea rather than written again from scratch. One argument, four
              shapes, so a buyer who prefers to read still gets it.
            </p>

            <h2>Who is behind Video Funker</h2>
            <p>
              Video Funker was founded in [[FOUNDED YEAR]] by [[FOUNDER NAME]]. The team is
              [[TEAM SIZE]] people, working from [[LOCATION]].
            </p>
            <p>
              That is short on purpose, and it is the least useful part of this page. A list of
              credentials is the same claim every vendor makes, and you have no way to check it from
              here. Two things you can actually check: whether the argument above survives contact
              with your own market, and whether the first video sounds like you. The second one costs
              you nothing to test.
            </p>
            <p>
              If you would rather examine the reasoning than the biography, the writing is the place
              to do it.{' '}
              <Link href="/founder-led-video">Our breakdown of founder-led video</Link> puts real
              hours and cash against each way of producing a month of it, and the{' '}
              <Link href="/blog">blog</Link> goes further into the parts that are easy to get wrong.
            </p>

            <h2>What a done-for-you video service cannot do</h2>
            <p>
              This is the part most service pages leave out, which is exactly why it is worth
              reading. Every item here is something we have decided not to sell.
            </p>
            <ul>
              <li>
                <strong>It is not your own face.</strong> If the point of the channel is that one
                specific human is building in public, keep filming that human. Use us for the company
                channel and run the two side by side.
              </li>
              <li>
                <strong>No reaction content.</strong> Anything tied to yesterday, anything with the
                real product on screen, anything with a customer in it: film that. A presenter is the
                wrong tool for all three.
              </li>
              <li>
                <strong>No opinions we were not given.</strong> A vague intake call produces forty
                vague videos faster than any other method produces forty vague videos. Speed is not
                a fix for having nothing to say.
              </li>
              <li>
                <strong>No bought or traded engagement.</strong> No pods, no boosted spend behind the
                videos, no follower guarantees. The numbers those produce move the dashboard and
                nothing else.
              </li>
              <li>
                <strong>No promised meeting count.</strong> We can tell you what the mechanism is and
                what usually moves first. Nobody can promise you a pipeline figure and mean it.
              </li>
            </ul>
            <p>
              The arrangement that works for most of our clients is not one extreme or the other.
              Presenter-delivered content carries the volume, and one unpolished clip a week from the
              founder&apos;s own phone carries the proof that a real person is behind it. The second
              half costs about twenty minutes a week and it is worth protecting.
            </p>

            <h2>How we measure whether founder-led video is working</h2>
            <p>
              Views are the worst available metric and the one everybody reports. A video that
              reaches two thousand of the wrong people and one that reaches two hundred of the right
              ones look opposite on a dashboard and are opposite in reality.
            </p>
            <p>
              The number that has actually predicted pipeline for us is the gap in positive reply
              rate between contacts who were served the videos and contacts who were not. Expect it
              to move in weeks four to seven. Anything faster is usually one video that travelled,
              which is pleasant and not repeatable.
            </p>
            <p>
              If that sounds like the way you would want it measured, the next step is a call.{' '}
              <Link href="/contact">Here is how to reach us</Link>, and what the intake call covers
              before you agree to anything.
            </p>
          </div>

          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-about-cta">
            <div>
              <h2
                id="vf-about-cta"
                style={{
                  font: `700 ${type.h3}/1.12 ${font.display}`,
                  color: c.white,
                  letterSpacing: '-0.02em',
                }}
              >
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
