import { Plus_Jakarta_Sans, Hanken_Grotesk } from 'next/font/google';

import { site, SITE_URL } from '@/config/site';
import './globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} — AI video content that books meetings`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    'AI video marketing',
    'AI presenter video',
    'LinkedIn video content',
    'B2B demand generation',
    'AI video generation',
    'sales content automation',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: site.name,
    title: `${site.name} — AI video content that books meetings`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — AI video content that books meetings`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#0560be',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: site.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: site.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'First video free' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {/* Reveals start hidden and are shown by an observer. Without JS that
            observer never runs, so hand those elements straight to visible. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1 !important;transform:none !important}'}</style>
        </noscript>
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- static, build-time constant
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
