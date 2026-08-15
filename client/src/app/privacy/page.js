import Link from 'next/link';

import Footer from '@/components/marketing/Footer';
import Nav from '@/components/marketing/Nav';
import Reveal from '@/components/marketing/Reveal';
import JsonLd from '@/components/blog/JsonLd';
import { buildGraph, ID, SITE, breadcrumbNode } from '@/lib/blog/schema';
import { c, font, site, type } from '@/config/site';

/**
 * The privacy policy.
 *
 * Every bracketed value in this file is a real unknown, not a formatting
 * flourish. The legal entity, the registered address, the jurisdiction whose
 * data protection law applies and the list of processors were not available
 * when this page was written, and a privacy policy that guesses any of them is
 * a document that states false facts about where a customer's recorded voice
 * ends up. Placeholders survive review; invented vendor names do not.
 *
 * Fill them in before this page is linked from the footer.
 *
 * The date below is a constant on purpose. new Date() at render time produces a
 * server value and a client value that disagree, which React reports as a
 * hydration mismatch, and it also means the "last updated" line moves every day
 * while the text underneath it never changes.
 */

const PATH = '/privacy';
const LAST_UPDATED = '2026-08-16';
const TITLE = 'Privacy policy';
const DESCRIPTION =
  'What Video Funker collects from an intake call, why we hold it, how long for, who it reaches, and how to get a copy or have it deleted.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  // Set explicitly rather than inherited. The root layout deliberately ships no
  // robots directive, and a legal page is one a crawler should keep.
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

/** Purpose, data, lawful basis. One row per thing we actually do. */
const BASES = [
  {
    purpose: 'Running the intake call and writing scripts from it',
    data: 'Call recording, transcript, your notes and existing material',
    basis: 'Performance of our contract with you. Consent for the recording itself.',
  },
  {
    purpose: 'Producing, reviewing and delivering the content',
    data: 'Scripts, posts, articles, video files, your feedback and edits',
    basis: 'Performance of our contract with you',
  },
  {
    purpose: 'Account admin, support and invoicing',
    data: 'Name, work email, company, role, billing contact',
    basis: 'Performance of our contract, and legal obligation for tax records',
  },
  {
    purpose: 'Understanding how this website is used',
    data: 'Pages viewed, referring site, approximate location from IP, device and browser',
    basis: 'Consent, or legitimate interests where no cookie is set',
  },
  {
    purpose: 'Replying to an enquiry from someone who is not yet a client',
    data: 'Name, work email, what you asked',
    basis: 'Legitimate interests in answering people who contact us',
  },
];

/**
 * Categories, not vendors. Every provider column is a placeholder because
 * naming the wrong processor in a privacy policy is a factual misstatement
 * about who holds a customer's recorded voice.
 */
const PROCESSORS = [
  { category: 'Hosting and file storage', provider: '[[HOSTING PROVIDER]]', gets: 'Everything we hold, at rest' },
  { category: 'Video call and recording', provider: '[[CALL PLATFORM]]', gets: 'The intake call, audio and video' },
  { category: 'Transcription', provider: '[[TRANSCRIPTION PROVIDER]]', gets: 'The call audio, and the text it returns' },
  { category: 'Script and copy drafting', provider: '[[AI SCRIPTING PROVIDER]]', gets: 'Transcript extracts and briefing notes' },
  { category: 'Presenter video production', provider: '[[PRESENTER VIDEO PROVIDER]]', gets: 'The approved script text and voice settings' },
  { category: 'Website analytics', provider: '[[ANALYTICS PROVIDER]]', gets: 'Page views, referrer, truncated IP, device' },
  { category: 'Email and scheduling', provider: '[[EMAIL PROVIDER]]', gets: 'Name, work email, message content' },
  { category: 'Payments', provider: '[[PAYMENT PROVIDER]]', gets: 'Billing name, address, card details we never see' },
];

const RETENTION = [
  {
    item: 'Intake call recordings and transcripts',
    kept: '[[CALL RECORDING RETENTION]]',
    then: 'Deleted from working storage and from backups on the backup cycle',
  },
  {
    item: 'Scripts, posts, articles and finished video files',
    kept: '[[CONTENT RETENTION]]',
    then: 'Deleted, or handed to you first if you ask',
  },
  {
    item: 'Account and contact records',
    kept: '[[ACCOUNT RECORD RETENTION]] after the engagement ends',
    then: 'Deleted',
  },
  {
    item: 'Invoices and payment records',
    kept: '[[BILLING RECORD RETENTION]]',
    then: 'Kept for the statutory period, then deleted',
  },
  { item: 'Website analytics', kept: '[[ANALYTICS RETENTION]]', then: 'Deleted or aggregated beyond recovery' },
];

export default function PrivacyPage() {
  const trail = [{ name: 'Home', href: '/' }, { name: 'Privacy policy' }];

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
      // No dateModified. It would have to agree with the visible line below,
      // and two hand-maintained dates drift apart the first time one is edited.
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
            <span aria-current="page">Privacy policy</span>
          </nav>

          <Reveal
            as="h1"
            style={{ font: `600 ${type.h2}/1.06 ${font.display}`, letterSpacing: '-0.02em', margin: '18px 0 0' }}
          >
            Privacy policy
          </Reveal>

          <Reveal
            as="p"
            delay={90}
            style={{ font: `400 ${type.lead}/1.6 ${font.body}`, color: c.muted, margin: '20px 0 0', maxWidth: '38em' }}
          >
            What we collect when you work with us, why we hold it, and what you can make us do with
            it. Written to be specific about the two parts most policies skip: the intake call
            recording, and the video a presenter delivers.
          </Reveal>

          <p style={{ font: `500 14px ${font.body}`, color: c.soft, margin: '18px 0 0' }}>
            Last updated: {LAST_UPDATED}
          </p>

          {/* Not decoration. A policy with unfilled values is a draft, and
              saying so is more honest than letting a reader assume the
              bracketed lines are legal shorthand they do not recognise. */}
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
            Values written in double square brackets are not filled in yet. Until they are, treat
            this document as a draft rather than a published policy, and ask us directly for
            anything you need to know before then.
          </p>

          <div className="vf-page-prose">
            <h2>Who we are and how to contact us</h2>
            <p>
              This site and the service behind it are run by [[COMPANY LEGAL NAME]], trading as Video
              Funker, registered at [[REGISTERED ADDRESS]]. For the data described here we are the
              controller, which means we decide what is collected and why.
            </p>
            <p>
              General questions go to [[CONTACT EMAIL]]. Anything about your data specifically, a
              copy of it, a correction, a deletion, goes to [[DPO CONTACT]] and is handled by a
              person rather than a form.
            </p>

            <h2>What personal data we collect</h2>
            <p>There are five groups, and only the first is unusual.</p>
            <ul>
              <li>
                <strong>The intake call.</strong> One call, roughly forty-five minutes, recorded so
                that scripts can be written in your own phrasing rather than in ours. The recording
                contains your voice, your name and job title, and whatever you say about your
                market, your customers and your competitors. If you would rather not be recorded,
                tell us before the call starts and we will work from written notes instead.
              </li>
              <li>
                <strong>Contact and account details.</strong> Name, work email, company, role, a
                phone number if you give one, and a billing contact.
              </li>
              <li>
                <strong>Content and drafts.</strong> Scripts, posts, carousels, articles, the
                rendered video files, plus your comments and edits on all of it. Anything you send us
                to work from: brand assets, product detail, existing posts.
              </li>
              <li>
                <strong>Website analytics.</strong> Pages viewed, the site that referred you,
                approximate location from your IP address, device and browser. This is about traffic,
                not about you individually, and we do not try to attach a name to it.
              </li>
              <li>
                <strong>Contacts you ask us to work with.</strong> If the engagement covers outreach
                angles, we may handle details of people you want to reach. Those contacts are yours.
                We use them only on your instructions, we do not add them to any list of our own, and
                we do not reuse them for another client.
              </li>
            </ul>
            <p>
              We do not collect special category data, we do not ask for it, and nothing about the
              service needs it. If you volunteer something sensitive during the intake call, tell us
              and we will cut it from the transcript.
            </p>

            <h2>Why we use your data and the lawful basis</h2>
            <p>
              The lawful basis is the reason the law lets us hold something. Where the basis is
              consent you can withdraw it at any time, and withdrawing it stops that use going
              forward without affecting anything already done.
            </p>
            <figure className="wp-block-table">
              <table>
                <thead>
                  <tr>
                    <th>What we do</th>
                    <th>What it uses</th>
                    <th>Lawful basis</th>
                  </tr>
                </thead>
                <tbody>
                  {BASES.map((row) => (
                    <tr key={row.purpose}>
                      <td>{row.purpose}</td>
                      <td>{row.data}</td>
                      <td>{row.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              We do not sell personal data, we do not share it with data brokers, and we do not use
              it to build advertising profiles. Nothing here is used to make an automated decision
              that has a legal or similarly significant effect on anyone.
            </p>

            <h2>How presenter-delivered video is made, and what happens to your recording</h2>
            <p>
              This is the part worth reading twice, because it is the part that is different from an
              ordinary agency.
            </p>
            <p>
              Scripts are drafted by a language model working from your intake call, your existing
              material and a brief. A person then edits every script before you see it. The draft
              stage means extracts of your transcript are sent to [[AI SCRIPTING PROVIDER]], which is
              a third party operating under a processing agreement with us.
            </p>
            <p>
              The presenter on screen is generated video, produced by [[PRESENTER VIDEO PROVIDER]]
              from the approved script text. It is not you, it is not footage of you, and it is not
              built from your call recording. What that provider receives is the script and the voice
              settings, not the recording.
            </p>
            <p>
              If you ask us to build a presenter based on your own face or voice, that is a separate
              thing and we treat it as one. We take written permission first, we use the likeness
              only for your content, and we delete the model when you ask or when the engagement
              ends, whichever comes first. You can withdraw that permission at any point.
            </p>
            <p>
              Whether any provider in the table below may use your material to train its own models
              depends on the contract we hold with each of them. Our position on that, and the
              providers it applies to, is stated in [[MODEL TRAINING TERMS]]. If that line is still
              in brackets, assume nothing and ask.
            </p>

            <h2>Who we share your data with</h2>
            <p>
              Only the providers we need to run the service, and each one gets the narrowest slice
              that lets it do its job.
            </p>
            <figure className="wp-block-table">
              <table>
                <thead>
                  <tr>
                    <th>What it is for</th>
                    <th>Provider</th>
                    <th>What they receive</th>
                  </tr>
                </thead>
                <tbody>
                  {PROCESSORS.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{row.provider}</td>
                      <td>{row.gets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              Beyond that list, we share data only where the law requires it, where we have to defend
              a legal claim, or where a professional adviser such as an accountant needs it under a
              duty of confidence. If the business is ever sold or merged, data moves with it and we
              will tell you before that happens.
            </p>

            <h2>Where your data is stored</h2>
            <p>
              Data is stored in [[DATA STORAGE LOCATIONS]]. Where a provider above moves it outside
              [[JURISDICTION]], the safeguard we rely on for that transfer is [[TRANSFER SAFEGUARD]].
              You can ask us for a copy of the relevant terms.
            </p>

            <h2>How long we keep your data</h2>
            <figure className="wp-block-table">
              <table>
                <thead>
                  <tr>
                    <th>What</th>
                    <th>Kept for</th>
                    <th>Then</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION.map((row) => (
                    <tr key={row.item}>
                      <td>{row.item}</td>
                      <td>{row.kept}</td>
                      <td>{row.then}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
            <p>
              Deletion from live systems is immediate on request. Backups roll off on their own
              schedule, so a deleted file can sit in an encrypted backup for a short period after it
              has gone from everywhere you or we can see it.
            </p>

            <h2>Cookies and site analytics</h2>
            <p>
              This site sets the cookies it needs to work, and analytics through
              [[ANALYTICS PROVIDER]]. The names, purposes and lifetimes of each are listed in
              [[COOKIE LIST]].
            </p>
            <p>
              Analytics is about which pages get read and which get abandoned. It is not used to
              build a profile of you, and it does not follow you to other sites. You can refuse
              non-essential cookies in your browser settings, and the site works normally without
              them.
            </p>

            <h2>Your rights over your data</h2>
            <p>
              Under the data protection law of [[JURISDICTION]] you can ask us to do all of the
              following, free of charge. If you are reading this from somewhere else, your local law
              may give you more or fewer rights than these.
            </p>
            <ul>
              <li>Give you a copy of everything we hold about you.</li>
              <li>Correct anything that is wrong.</li>
              <li>Delete it, including the intake call recording and its transcript.</li>
              <li>Stop using it for a particular purpose while a dispute about it is sorted out.</li>
              <li>Hand it over in a portable format, or send it to someone else.</li>
              <li>Object to any use we have based on legitimate interests.</li>
              <li>Withdraw consent you gave earlier, including consent to record the call.</li>
            </ul>
            <p>
              Send any of these to [[DPO CONTACT]]. We answer within one month. If a request is
              complicated enough to need longer, we will tell you inside that month and say how much
              longer and why.
            </p>
            <p>
              If you are not satisfied with how we handle it, you can complain to
              [[SUPERVISORY AUTHORITY]]. We would rather you came to us first, but you are not
              required to.
            </p>

            <h2>Children</h2>
            <p>
              This is a service sold to businesses. It is not directed at anyone under 18 and we do
              not knowingly collect data about children. If you believe a child&apos;s data has
              reached us, write to [[CONTACT EMAIL]] and we will delete it.
            </p>

            <h2>Changes to this privacy policy</h2>
            <p>
              The date under the title is the only version marker, and it changes whenever the text
              does. If a change affects what we collect or who we send it to, we will email current
              clients before it takes effect rather than relying on you to check this page.
            </p>
            <p>
              For what we deliver, who owns it and how the money works, see our{' '}
              <Link href="/terms">terms of service</Link>.
            </p>
          </div>
        </div>
      </main>

      <Footer base="/" />
    </>
  );
}
