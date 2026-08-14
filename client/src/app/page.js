import CTA from '@/components/marketing/CTA';
import CursorRing from '@/components/marketing/CursorRing';
import Deliverables from '@/components/marketing/Deliverables';
import Footer from '@/components/marketing/Footer';
import Hero from '@/components/marketing/Hero';
import HowItWorks from '@/components/marketing/HowItWorks';
import Nav from '@/components/marketing/Nav';
import Proof from '@/components/marketing/Proof';
import WhyVideo from '@/components/marketing/WhyVideo';

export default function HomePage() {
  return (
    <>
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
        <CTA />
      </main>
      <Footer />
    </>
  );
}
