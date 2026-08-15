import { site } from '@/config/site';

/**
 * The web app manifest, served at /manifest.webmanifest.
 *
 * Next links this automatically once the file exists, so nothing in the layout
 * needs to change.
 *
 * Every icon below is a real file in public/icons, generated from the same
 * 512px source as the favicon. They are flattened onto white rather than left
 * transparent: `background_color` is the brand blue, and a transparent mark
 * whose outer ring is also blue would disappear into the splash screen.
 *
 * The maskable entry is a separate file, not the same one listed twice. Android
 * crops a maskable icon to whatever shape the launcher uses, so that copy is
 * drawn at 72% scale to keep the mark inside the safe zone. Declaring one image
 * as both "any" and "maskable" gets it padded everywhere or cropped everywhere,
 * and one of those is always wrong.
 */
export default function manifest() {
  return {
    name: site.name,
    short_name: site.name,
    description: site.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#0560be',
    theme_color: '#0560be',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
