import { SITE_URL, site } from '@/config/site';
import JsonLd from '@/components/blog/JsonLd';
import { ID, SITE, buildGraph } from '@/lib/blog/schema';

import CTA from '@/components/marketing/CTA';
import CursorRing from '@/components/marketing/CursorRing';
import Deliverables from '@/components/marketing/Deliverables';
import Footer from '@/components/marketing/Footer';
import Hero from '@/components/marketing/Hero';
import HowItWorks from '@/components/marketing/HowItWorks';
import LatestPosts from '@/components/marketing/LatestPosts';
import Nav from '@/components/marketing/Nav';
import Proof from '@/components/marketing/Proof';
import WhyVideo from '@/components/marketing/WhyVideo';

/**
 * The homepage owns its own metadata now that the root layout has stopped
 * declaring a canonical for the whole site.
 *
 * The title leads with what a buyer types rather than with the brand. Nobody
 * searches "Video Funker" yet, and the previous default was a slogan
 * containing no phrase anyone looks for. "Done-for-you", "B2B video content"
 * and "LinkedIn" are the three parts of this that have real demand, and the
 * SERP research is unambiguous that the tool queries ("AI video generator")
 * are owned by Synthesia, HeyGen and Canva and would not convert for a
 * done-for-you service even if we ranked.
 *
 * Length is deliberate: ~57 characters for the title and 152 for the
 * description, both inside the width Google renders before truncating.
 */
const TITLE = 'Done-for-you B2B video content for LinkedIn';
const DESCRIPTION =
  'One intake call becomes a month of founder-led LinkedIn video, posts and outreach. AI writes it, a lifelike presenter delivers it. Your first video is free.';

export const metadata = {
  /**
   * `absolute`, so the root layout's `title.template` cannot reach this.
   *
   * The brand is appended by hand here, and this page used to be exempt from
   * the template by accident: a template applies to CHILD segments only, and
   * app/page.js sat in the same segment as app/layout.js. Moving the marketing
   * routes into the `(marketing)` group added a segment between them — a route
   * group is URL-transparent but it is still a node in the loader tree — so the
   * template started applying and the homepage shipped
   * "…for LinkedIn | Video Funker · Video Funker", 74 characters with the brand
   * twice and the tail cut off in search results.
   *
   * `absolute` states the exemption instead of depending on how deep the file
   * happens to sit. 58 characters, inside what Google renders.
   */
  title: { absolute: `${TITLE} | ${site.name}` },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: site.name,
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
  },
};

/**
 * The homepage's own graph.
 *
 * The root layout emits the site-wide entities (Organization, WebSite, the
 * SoftwareApplication) because those are true on every route. A WebPage node
 * describing "/" is true on exactly one route, so it lives here. Putting it in
 * the layout would have every blog post and service page also claiming to be
 * the homepage.
 *
 * The Service node is what states, in machine-readable form, what this company
 * actually sells. Until now the only typed claim on the site was
 * SoftwareApplication, which describes the product but not the done-for-you
 * service that is the thing being bought.
 */
const homeGraph = buildGraph(
  {
    '@type': 'WebPage',
    '@id': ID.webpage('/'),
    url: `${SITE}/`,
    name: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    isPartOf: { '@id': ID.site },
    about: { '@id': `${SITE}/#service` },
    inLanguage: 'en',
  },
  {
    '@type': 'Service',
    '@id': `${SITE}/#service`,
    name: 'Done-for-you B2B video content',
    serviceType: 'Video content production and distribution',
    description:
      'Founder-led LinkedIn video produced from a single intake call, delivered by a lifelike presenter, with matching posts and outreach.',
    provider: { '@id': ID.org },
    areaServed: 'Worldwide',
    audience: { '@type': 'BusinessAudience', audienceType: 'B2B founders and marketing leaders' },
  }
);

export default function HomePage() {
  return (
    <>
      <JsonLd graph={homeGraph} />
      {/* First stop for a keyboard user; invisible until it takes focus.
          `main` needs the tabIndex or the jump moves the viewport without
          moving focus, and the next Tab goes back into the nav. */}
      <a href="#main" className="vf-skip">
        Skip to content
      </a>
      <CursorRing />
      <Nav />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Hero />
        <HowItWorks />
        <WhyVideo />
        <Deliverables />
        <Proof />
        {/* Before the CTA on purpose: someone who is not ready to book should
            meet the writing rather than a dead end, and it gives the homepage
            three direct links into the articles. */}
        <LatestPosts />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
