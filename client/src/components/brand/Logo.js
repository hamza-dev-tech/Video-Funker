import Image from 'next/image';

/**
 * The Video Funker lockup, as supplied.
 *
 * The brand file arrived as an SVG wrapper around a masked bitmap rather than
 * real vector paths, so it is stored as a trimmed RGBA PNG (see
 * public/brand/logo.png) and served through next/image, which emits WebP at
 * whatever density the device asks for.
 */

const LOCKUP = { src: '/brand/logo.png', ratio: 1113 / 267 };
const MARK = { src: '/brand/mark.png', ratio: 300 / 267 };

export default function Logo({ height = 36, markOnly = false, priority = false, title = 'Video Funker' }) {
  const art = markOnly ? MARK : LOCKUP;

  return (
    <Image
      src={art.src}
      alt={title}
      height={height}
      width={Math.round(height * art.ratio)}
      priority={priority}
      // width/height already carry the exact ratio, so no CSS sizing is needed.
      style={{ display: 'block' }}
    />
  );
}
