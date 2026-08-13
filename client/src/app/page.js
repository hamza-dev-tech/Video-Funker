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
      <CursorRing />
      <Nav />
      <main>
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
