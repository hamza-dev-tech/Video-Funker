import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { appLinks, c, font, site, type } from '@/config/site';

/**
 * The contact page, deliberately without a form.
 *
 * There is no endpoint on this site that a form could post to and no inbox
 * anybody watches on the other side of one, so a form here would accept
 * enquiries, show a success state, and drop them. That failure is silent by
 * design: the sender believes they have made contact and never follows up. An
 * email address that works beats a form that does not, every time. Add the
 * form the day there is a route to receive it AND a person reading what it
 * receives, not the day the first one exists.
 *
 * The primary action is the signup link rather than the email, because the
 * first video is free: the shortest honest path for a buyer is to book the
 * intake call, not to open a conversation about booking the intake call.
 *
 * [[CONTACT EMAIL]] and [[RESPONSE TIME]] are placeholders. Neither is knowable
 * from the codebase and both must be filled before this ships. The email is
 * plain text rather than a mailto link on purpose: a broken `mailto:[[...]]`
 * would be a click that fails, which is the exact failure this page exists to
 * avoid.
 */

const PATH = '/contact';
const TITLE = 'Contact Video Funker about founder-led video';
const DESCRIPTION =
  'How to reach Video Funker, what the intake call covers, and when a reply lands. No form: the shortest route is the first video, which is free.';

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

export default function ContactPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'Contact' }];

  const graph = buildGraph(
    {
      '@type': 'ContactPage',
      '@id': ID.webpage(PATH),
      url: `${SITE}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': ID.site },
      about: { '@id': ID.org },
      inLanguage: 'en',
      breadcrumb: { '@id': ID.breadcrumb(PATH) },
      /* No `contactPoint` node. It would have to carry the email, and a
         placeholder in structured data is a machine-readable lie rather than an
         obvious gap. Add one here in the same change that fills the address. */
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
            <span aria-current="page">Contact</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            Contact Video Funker
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            There is no form on this page, and that is a choice rather than an oversight. Here is how
            to reach a person, and what happens on the call if you would rather skip straight to it.
          </Reveal>

          <div className="vf-page-prose">
            <h2>How to contact Video Funker</h2>
            <p>
              Email <strong>[[CONTACT EMAIL]]</strong>. That address reaches the people who would
              actually run your account, not a routing desk.
            </p>
            <p>
              Three lines make the first reply useful rather than a request for more information:
              what your company sells and to whom, what you have already tried on LinkedIn, and
              whether the founder is willing to appear on camera at all. The last one changes the
              answer more than the other two, and there is no wrong response to it.
            </p>
            <p>
              We have not put a form here because there is nowhere honest for it to send. A form
              needs a working endpoint and a person reading what arrives, and a form missing either
              one still shows a success message. The sender believes they made contact and never
              chases it. An email address that works is worth more than a form that does not.
            </p>

            <h2>Book the intake call and get the first video free</h2>
            <p>
              If you already know roughly what this is, skip the email. The first video is free, and
              signing up books the intake call that produces it. You see a finished video before you
              agree to a retainer, which tells you more about whether this fits than any exchange of
              messages will.
            </p>
            <p>
              Booking the call does not commit you to anything beyond the call. If the video comes
              back and it does not sound like you, that is a real answer and it cost you
              forty-five minutes.
            </p>

            <h2>What happens on the intake call</h2>
            <p>
              It runs about forty-five minutes, on video, and it is the only part of the month that
              needs you. Four things get covered:
            </p>
            <ul>
              <li>
                <strong>Who you sell to and what triggers a purchase.</strong> Not the job title, the
                moment. What has to go wrong in their week before you become relevant.
              </li>
              <li>
                <strong>What you actually sell,</strong> including the parts of the offer you have
                stopped explaining because they feel obvious to you and are not obvious to a buyer.
              </li>
              <li>
                <strong>The objections you hear most often,</strong> in the words your prospects use
                rather than the words your website uses.
              </li>
              <li>
                <strong>The opinions you hold that a decent share of your market disagrees with.</strong>{' '}
                This one carries the month. The other three are largely public information. This is
                the part nobody can research on your behalf, and a call that skips it produces a
                month of content that could have been written about any company in your category.
              </li>
            </ul>
            <p>
              After the call, scripts are drafted in your phrasing, edited by a person, and delivered
              on camera by a presenter. You are not asked to write anything, and there is no filming
              day to schedule. There is more detail on how that runs in{' '}
              <Link href="/about">how we work and what we turn down</Link>.
            </p>

            <h2>When to expect a reply</h2>
            <p>
              Email is answered within [[RESPONSE TIME]] on working days. If you have not heard back
              by then, send it again rather than assuming the answer was no. Filters eat more cold
              email than people admit.
            </p>
            <p>
              Signups are handled faster than email, because the call is booked by the system rather
              than by us reading a message and replying to it.
            </p>

            <h2>When founder-led video is the wrong fit</h2>
            <p>
              We will say this on the call if it applies, and it is cheaper for both of us if you
              know it now. This is the wrong service for a personal brand play where the entire point
              is that one specific human is on screen. It is the wrong service for product demos,
              customer stories, and anything reacting to something that happened yesterday. All of
              those need a real camera pointed at a real person or a real screen.
            </p>
            <p>
              It is also the wrong service if you want one video. The mechanism depends on a buyer
              seeing you repeatedly over a few weeks, so a single clip is an expensive way to prove
              nothing. If any of that describes what you need, say so in the email and we will tell
              you straight.
            </p>
            <p>
              If you are still deciding, read{' '}
              <Link href="/founder-led-video">what a month of founder-led video costs in hours and cash</Link>{' '}
              first. It is the page most people send back to us with questions attached, which is
              exactly what it is for.
            </p>
          </div>

          <section className="vf-pagecta" style={{ marginTop: 72 }} aria-labelledby="vf-contact-cta">
            <div>
              <h2
                id="vf-contact-cta"
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
