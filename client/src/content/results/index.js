/**
 * Case study data for /results.
 *
 * ─── READ THIS BEFORE YOU TOUCH THE ENTRIES ─────────────────────────────────
 * There is not one real client outcome in this file. Every factual value is a
 * placeholder written in double square brackets and capitals, and that is the
 * whole point of the file existing in this state.
 *
 * A case study is the single highest-trust asset a service company publishes.
 * An invented client name, an invented number or an invented quote is a
 * fabricated testimonial: it breaches Google's spam policy on deceptive
 * content, it is a consumer-protection problem in the UK, the EU and most US
 * states, and on a domain with no history it is the fastest way to lose the
 * only thing a new brand has. So the route, the data shape and the writing are
 * finished, and the facts are left empty on purpose.
 *
 * ─── WHAT TO DO WHEN A REAL CLIENT SIGNS OFF ────────────────────────────────
 *  1. Replace every [[PLACEHOLDER]] on that entry with the value the client
 *     has agreed to in writing. Get the quote and the numbers approved by the
 *     person named in quoteAttribution, by email, and keep the email.
 *  2. Rename the slug from template-study-* to something a human would type,
 *     usually the client name in lower case with hyphens.
 *  3. Delete any entry still carrying placeholders. Three studies with one real
 *     one is worse than one study.
 *  4. Only then: remove `robots: { index: false, follow: true }` from
 *     src/app/results/page.js and src/app/results/[slug]/page.js, and add
 *     /results plus each study path to src/app/sitemap.js.
 *
 * Step 4 is not optional and it is not automatic. `AWAITING_REAL_DATA` below
 * drives the visible banner on the pages, but Next.js metadata is a static
 * object evaluated at module load, so the noindex cannot read a computed flag
 * without turning into generateMetadata. The two have to be changed together.
 */

/**
 * The placeholder pattern.
 *
 * Deliberately NOT a global regex. A /g regex carries `lastIndex` between
 * calls, so `.test()` on the same regex object alternates true and false as it
 * walks a list, and this one is called across every field of every study. That
 * bug would report half the placeholders as real data, which is exactly the
 * failure this file exists to prevent.
 */
const PLACEHOLDER = /\[\[[^\]]+\]\]/;

/** True when a string still carries a [[PLACEHOLDER]] rather than a real value. */
export function isPlaceholder(value) {
  return typeof value === 'string' && PLACEHOLDER.test(value);
}

/**
 * The studies.
 *
 * Field set, and what each one is for:
 *
 *   slug              URL segment. The one field that is NOT a placeholder,
 *                     because it is a routing key rather than a claim about a
 *                     client. Rename it when the entry becomes real.
 *   client            Company name, exactly as the client wants it written.
 *   industry          Their category in the words their buyers use.
 *   companySize       Headcount band or ARR band. Agree which with the client.
 *   challenge         One paragraph on the state of things before the first
 *                     intake call. Written from what they said, not inferred.
 *   approach          One paragraph on what we actually did for this account,
 *                     including anything unusual about it.
 *   outcomes          Ordered list of { label, value }. Label is the
 *                     measurement, value is the result.
 *   quote             Their words. Never edited beyond removing filler, and
 *                     never written for them.
 *   quoteAttribution  Name, role, company. All three, or the quote is worth
 *                     nothing.
 *
 * On the outcome labels: the first three are the same on every study on
 * purpose, because they are the three numbers we report for every account and
 * a reader comparing two studies should be comparing the same measurements.
 * The array is still free-form, so a study can carry a fourth or fifth
 * measurement that only applies to that account. Both renderers walk the array
 * as given and neither assumes a length.
 *
 * On the reply rate pair: it is two rows rather than one percentage lift
 * because a lift figure with no base rate is unfalsifiable, and because the
 * difference between served and not served contacts is the only measurement
 * that has predicted pipeline for us. Views are not on this list and will not
 * be added.
 */
export const studies = [
  {
    slug: 'template-study-one',
    client: '[[STUDY 1 CLIENT NAME]]',
    industry: '[[STUDY 1 INDUSTRY]]',
    companySize: '[[STUDY 1 COMPANY SIZE]]',
    challenge: '[[STUDY 1 CHALLENGE PARAGRAPH]]',
    approach: '[[STUDY 1 APPROACH PARAGRAPH]]',
    outcomes: [
      { label: 'Videos published in the first month', value: '[[STUDY 1 VIDEOS PUBLISHED]]' },
      { label: 'Founder hours a month', value: '[[STUDY 1 FOUNDER HOURS]]' },
      {
        label: 'Positive reply rate, contacts served the videos',
        value: '[[STUDY 1 REPLY RATE SERVED]]',
      },
      {
        label: 'Positive reply rate, matched contacts not served',
        value: '[[STUDY 1 REPLY RATE CONTROL]]',
      },
    ],
    quote: '[[STUDY 1 CLIENT QUOTE]]',
    quoteAttribution: '[[STUDY 1 QUOTE ATTRIBUTION]]',
  },
  {
    slug: 'template-study-two',
    client: '[[STUDY 2 CLIENT NAME]]',
    industry: '[[STUDY 2 INDUSTRY]]',
    companySize: '[[STUDY 2 COMPANY SIZE]]',
    challenge: '[[STUDY 2 CHALLENGE PARAGRAPH]]',
    approach: '[[STUDY 2 APPROACH PARAGRAPH]]',
    outcomes: [
      { label: 'Videos published in the first month', value: '[[STUDY 2 VIDEOS PUBLISHED]]' },
      { label: 'Founder hours a month', value: '[[STUDY 2 FOUNDER HOURS]]' },
      {
        label: 'Positive reply rate, contacts served the videos',
        value: '[[STUDY 2 REPLY RATE SERVED]]',
      },
      {
        label: 'Positive reply rate, matched contacts not served',
        value: '[[STUDY 2 REPLY RATE CONTROL]]',
      },
      { label: 'Meetings booked in the first quarter', value: '[[STUDY 2 MEETINGS BOOKED]]' },
    ],
    quote: '[[STUDY 2 CLIENT QUOTE]]',
    quoteAttribution: '[[STUDY 2 QUOTE ATTRIBUTION]]',
  },
  {
    slug: 'template-study-three',
    client: '[[STUDY 3 CLIENT NAME]]',
    industry: '[[STUDY 3 INDUSTRY]]',
    companySize: '[[STUDY 3 COMPANY SIZE]]',
    challenge: '[[STUDY 3 CHALLENGE PARAGRAPH]]',
    approach: '[[STUDY 3 APPROACH PARAGRAPH]]',
    outcomes: [
      { label: 'Videos published in the first month', value: '[[STUDY 3 VIDEOS PUBLISHED]]' },
      { label: 'Founder hours a month', value: '[[STUDY 3 FOUNDER HOURS]]' },
      {
        label: 'Positive reply rate, contacts served the videos',
        value: '[[STUDY 3 REPLY RATE SERVED]]',
      },
      {
        label: 'Positive reply rate, matched contacts not served',
        value: '[[STUDY 3 REPLY RATE CONTROL]]',
      },
      { label: 'Consecutive weeks published without a gap', value: '[[STUDY 3 WEEKS PUBLISHED]]' },
    ],
    quote: '[[STUDY 3 CLIENT QUOTE]]',
    quoteAttribution: '[[STUDY 3 QUOTE ATTRIBUTION]]',
  },
];

/**
 * True while any field on a study is still a placeholder.
 *
 * Checks the outcome labels as well as the values, because a study that
 * carries a client-specific measurement will have written its own label, and a
 * half-filled entry must not be able to read as finished.
 */
export function studyIsTemplate(study) {
  if (!study) return false;
  const fields = [
    study.client,
    study.industry,
    study.companySize,
    study.challenge,
    study.approach,
    study.quote,
    study.quoteAttribution,
  ];
  if (fields.some(isPlaceholder)) return true;
  return (study.outcomes || []).some((o) => isPlaceholder(o.label) || isPlaceholder(o.value));
}

/**
 * Site-wide flag: is anything on this route still a template?
 *
 * `some`, not `every`. One finished study alongside two templates still means
 * the route as a whole is not publishable, and the index page still has to say
 * so, because a reader cannot tell which of three cards is the real one.
 */
export const AWAITING_REAL_DATA = studies.some(studyIsTemplate);

/** Exact slug lookup. Returns null rather than undefined so the caller's check reads as a decision. */
export function getStudy(slug) {
  return studies.find((s) => s.slug === slug) || null;
}

/** Every slug, for generateStaticParams. */
export function getStudySlugs() {
  return studies.map((s) => s.slug);
}
