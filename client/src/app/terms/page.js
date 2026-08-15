import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { c, font, site, type } from '@/config/site';

/**
 * The terms of service.
 *
 * Same rule as /privacy: every bracketed value is a real unknown. The legal
 * entity, the governing law, the fee, the notice period and the liability cap
 * were not available when this was written. A terms page that guesses a
 * liability cap is not a placeholder problem, it is a number a court would
 * read back to somebody.
 *
 * One clause here is a genuine trade-off rather than a gap, and it is written
 * out in full under intellectual property: the words and the rendered files can
 * transfer, the presenter likeness cannot, because it is licensed to us rather
 * than owned by us. Softening that would be the easiest sentence on this page
 * to get wrong.
 *
 * The date is a constant. new Date() at render time gives the server and the
 * client different values, which React reports as a hydration mismatch.
 */

const PATH = '/terms';
const LAST_UPDATED = '2026-08-16';
const TITLE = 'Terms of service';
const DESCRIPTION =
  'The terms behind a Video Funker month: what is delivered, who owns the finished video, how approval and revisions work, payment, and cancellation.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  // Explicit, because the root layout ships no robots directive by design.
  robots: { index: true, follow: true },
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
 * Counts live in the order form, not here, because they differ per plan. The
 * placeholders exist so nobody reads a fixed number off a terms page and then
 * argues about it later.
 */
const INCLUDED = [
  {
    item: 'Intake call',
    detail: 'One call, roughly forty-five minutes, recorded with your agreement',
  },
  { item: 'Short videos', detail: '[[VIDEOS PER MONTH]], scripted, delivered by a presenter, captioned and sized for the feed' },
  { item: 'Written posts', detail: 'One per video, in your voice' },
  { item: 'Carousels', detail: '[[CAROUSELS PER MONTH]]' },
  { item: 'Long-form articles', detail: '[[ARTICLES PER MONTH]]' },
  { item: 'Outreach angles', detail: 'Tied to what you published that month' },
];

export default function TermsPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'Terms of service' }];

  const graph = buildGraph(
    {
      '@type': 'WebPage',
      '@id': ID.webpage(PATH),
      url: `${SITE}${PATH}`,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': ID.site },
      publisher: { '@id': ID.org },
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
            <span aria-current="page">Terms of service</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            Terms of service
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            What we deliver in a month, what we do not, who ends up owning the video, and the two
            clauses most people only read after something has gone wrong: revisions and cancellation.
          </Reveal>

          <p style={{ font: `500 14px ${font.body}`, color: c.soft, margin: '18px 0 0' }}>
            Last updated: {LAST_UPDATED}
          </p>

          <p
            style={{
              font: `400 15px/1.6 ${font.body}`,
              color: c.muted,
              background: c.panel,
              border: `1px solid ${c.line}`,
              borderRadius: 14,
              padding: '16px 18px',
              margin: '26px 0 0',
            }}
          >
            Values written in double square brackets are not filled in yet. Until they are, the
            figures that apply to you are the ones written on your order form, and nothing on this
            page overrides it.
          </p>

          <div className="vf-page-prose">
            <h2>Who these terms are between</h2>
            <p>
              These terms are an agreement between [[COMPANY LEGAL NAME]], trading as Video Funker,
              registered at [[REGISTERED ADDRESS]], and the business named on the order form. In this
              document, we and us mean Video Funker, and you means that business.
            </p>
            <p>
              They apply from the moment you accept an order form or ask us to start work, whichever
              happens first. Where the order form and this page disagree on a number, the order form
              wins.
            </p>
            <p>
              This is a business to business agreement. Consumer cancellation rights do not apply to
              it.
            </p>

            <h2>What the service covers, and what it does not</h2>
            <p>
              We take one intake call and turn it into a month of content for your channels. We write
              the scripts, a lifelike presenter delivers them on camera, and we hand you finished
              files. You post them.
            </p>
            <p>Things we do not do, stated plainly so nobody has to guess:</p>
            <ul>
              <li>
                We do not post on your behalf. We do not need access to your LinkedIn account and we
                will not ask for it.
              </li>
              <li>
                We do not guarantee views, followers, reach, replies, meetings or revenue. Nobody
                honestly can, and any agency that does is describing a hope as a deliverable.
              </li>
              <li>
                We do not check whether a claim you ask us to make is true, legal or allowed in your
                sector. That is yours, and it matters most in regulated categories.
              </li>
              <li>
                We do not film you, your product or your customers. Anything that needs a real camera
                is outside this agreement.
              </li>
            </ul>

            <h2>What a month of video includes</h2>
            <figure className="wp-block-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>What you get</th>
                  </tr>
                </thead>
                <tbody>
                  {INCLUDED.map((row) => (
                    <tr key={row.item}>
                      <td>{row.item}</td>
                      <td>{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              Anything beyond that list is extra work, quoted before it starts. We will never do
              additional work and invoice you for it afterwards without asking first.
            </p>

            <h2>How approval and revisions work</h2>
            <p>
              Scripts go to you in batches on the schedule in [[DRAFT DELIVERY SCHEDULE]]. You then
              have [[APPROVAL WINDOW]] to approve the batch or send changes.
            </p>
            <p>
              If we hear nothing inside that window, we treat the batch as approved and move it into
              production. This is not a trick clause, it is the only way a monthly schedule survives
              a busy fortnight, and it is the single most common reason a month slips.
            </p>
            <ul>
              <li>
                [[REVISION ROUNDS]] rounds of changes are included per batch, at the script stage,
                where changes are cheap.
              </li>
              <li>
                A change asked for after a video has been produced means producing it again. That
                counts as a new item unless the problem was ours.
              </li>
              <li>
                Ours means the video does not match the script you approved, a name or figure was
                typed wrong by us, or there is a defect in the audio or the render. We fix those at
                no charge and without arguing about it.
              </li>
              <li>
                A change of mind about an approved script is not ours. It is billed at
                [[EXTRA REVISION RATE]].
              </li>
            </ul>

            <h2>Who owns the video and the scripts</h2>
            <p>
              Once the month is paid for in full, the position is this.
            </p>
            <ul>
              <li>
                <strong>The words are yours.</strong> Scripts, posts, carousels and articles are
                assigned to you outright. Use them anywhere, edit them, republish them, put them
                under someone else&apos;s name if you want to.
              </li>
              <li>
                <strong>The finished video files are yours to use.</strong> Worldwide, in any medium,
                with no time limit and no extra fee.
              </li>
              <li>
                <strong>The presenter likeness is not ours to give.</strong> It is licensed to us by
                [[PRESENTER VIDEO PROVIDER]] under that provider&apos;s own terms, set out in
                [[PRESENTER LICENCE TERMS]]. You get the right to use the videos we made for you. You
                do not get the right to generate new video with that presenter yourself, and neither
                of us can change that by agreeing to.
              </li>
              <li>
                <strong>Your material stays yours.</strong> Logos, product footage, screenshots,
                customer names, anything you send us. We use it only to do the work described here.
              </li>
            </ul>
            <p>
              Before payment clears, we keep ownership of everything we produced and your right to
              use it is suspended. The free sample video works the same way: it costs nothing and
              commits you to nothing, and it stays ours until a paid month starts.
            </p>
            <p>
              We may show finished work as an example of what we do. If you would rather we did not,
              say so in writing at any time and we will stop, including taking down anything already
              published.
            </p>

            <h2>What you are responsible for</h2>
            <ul>
              <li>Turning up to the intake call, and giving us enough to work with on it.</li>
              <li>Approving or rejecting each batch inside the approval window.</li>
              <li>
                The accuracy of every factual and performance claim in the content, and its
                compliance with the rules of your sector.
              </li>
              <li>Holding the rights to any material you send us.</li>
              <li>
                Disclosing, where you post it, that the presenter is generated. Platform rules on
                this are tightening, and a post that hides it puts your account at risk rather than
                ours.
              </li>
            </ul>

            <h2>Fees, invoicing and payment terms</h2>
            <p>
              The fee is [[MONTHLY FEE]], invoiced [[BILLING CYCLE]], payable within
              [[PAYMENT TERMS]]. Prices are stated [[TAX TREATMENT]].
            </p>
            <p>
              Late invoices carry [[LATE PAYMENT CHARGE]]. If an invoice stays unpaid past its due
              date and is still unpaid after we have asked twice, we can pause work until it is
              settled, and a paused month does not extend the schedule.
            </p>

            <h2>How to cancel, and what happens to work in progress</h2>
            <p>
              The minimum term is [[MINIMUM TERM]]. After that, either of us can end the agreement by
              giving [[CANCELLATION NOTICE]] in writing.
            </p>
            <ul>
              <li>
                Work already approved and produced is delivered and paid for. We do not refund a
                month whose scripts you have already approved.
              </li>
              <li>
                Work not yet started is not charged. Work part done is charged for the part done, and
                we will show you what that is.
              </li>
              <li>
                You get everything produced up to the last paid day, in the formats we normally
                deliver.
              </li>
            </ul>
            <p>
              We can also end the agreement immediately if you ask us to produce something we believe
              is false, unlawful, or aimed at deceiving the people who watch it. We would rather lose
              the month than make that video.
            </p>

            <h2>Limits on our liability</h2>
            <p>
              Nothing here limits liability for death or personal injury caused by negligence, for
              fraud, or for anything else that cannot be limited by law. That comes first and the
              rest of this section is read subject to it.
            </p>
            <p>
              Beyond that, our total liability for everything arising out of this agreement is capped
              at [[LIABILITY CAP]].
            </p>
            <p>We are not liable for any of the following:</p>
            <ul>
              <li>Lost profit, lost pipeline, lost opportunity or damage to reputation.</li>
              <li>
                Anything a platform does to your account, including suspension, reduced reach, or a
                rule change about generated media.
              </li>
              <li>
                Consequences of a claim you asked us to publish that turns out to be inaccurate or
                not permitted in your sector.
              </li>
              <li>Failures of a third party provider outside our reasonable control.</li>
            </ul>

            <h2>Governing law and disputes</h2>
            <p>
              This agreement is governed by the law of [[GOVERNING LAW]]. The courts of
              [[JURISDICTION]] have exclusive jurisdiction over any dispute arising from it.
            </p>
            <p>
              Before anyone files anything, both of us agree to spend thirty days trying to settle it
              in a conversation. Most disputes about creative work are disputes about expectations,
              and those are cheaper to fix by talking.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We will email you before a change takes effect. A change never applies retrospectively
              to a month you have already paid for.
            </p>

            <h2>The rest of it</h2>
            <ul>
              <li>
                These terms and your order form are the whole agreement. Anything said in a sales
                call that is not written down is not part of it.
              </li>
              <li>
                If a clause turns out to be unenforceable, the rest stays in force and that clause is
                read as narrowly as it needs to be.
              </li>
              <li>
                Not enforcing something once does not waive the right to enforce it later.
              </li>
              <li>
                We may use subcontractors and providers to do parts of the work. We stay responsible
                to you for what they do.
              </li>
              <li>
                Nothing here creates a partnership, a joint venture or an employment relationship
                between us.
              </li>
              <li>
                Nobody who is not a party to this agreement can enforce any part of it.
              </li>
            </ul>
            <p>
              Questions about any of this go to [[CONTACT EMAIL]]. For what we collect and how long we
              keep it, see our <Link href="/privacy">privacy policy</Link>.
            </p>
          </div>
        </div>
      </main>

      <Footer base="/" />
    </>
  );
}
