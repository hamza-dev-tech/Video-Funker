import { ImageResponse } from 'next/og';

import { site } from '@/config/site';

export const alt = `${site.name} blog`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * The card for /blog itself and, by inheritance, for every archive route under
 * it that does not define its own. Static — a category archive's card does not
 * need to name the category badly enough to justify a per-archive render.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          background: 'linear-gradient(135deg, #033f80 0%, #0560be 55%, #0668cc 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            background: '#ff901b',
            color: '#2a1a04',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '10px 20px',
            borderRadius: 100,
            marginBottom: 40,
          }}
        >
          The blog
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 78,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 960,
          }}
        >
          Video that books meetings.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#b9d6f2', marginTop: 28 }}>
          {site.domain}
        </div>
      </div>
    ),
    size
  );
}
