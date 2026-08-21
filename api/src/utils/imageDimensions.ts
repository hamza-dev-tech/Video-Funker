/**
 * Reads the pixel dimensions of a JPEG or PNG straight from its header.
 *
 * The photo-avatar path validated exactly two things — the MIME type and a 10MB
 * ceiling — so a 200×200 thumbnail, a wide group shot, or a screenshot of a
 * screenshot all sailed through and spent a real HeyGen generation to come back
 * unusable. The customer then waited minutes to be told nothing, and tried
 * again with the same photo.
 *
 * Deliberately dependency-free. `sharp` and `image-size` both do this and more,
 * but pulling a native image library into the deploy to read four integers out
 * of a header is a large amount of weight for a small amount of work — and
 * `sharp` in particular is a platform-specific binary that turns a clean
 * install into a build step.
 *
 * Returns null when the buffer is not a readable JPEG or PNG, which callers
 * should treat as "reject this file" rather than "skip the check": a file whose
 * header cannot be parsed is not a file HeyGen will do anything useful with.
 */

export interface Dimensions {
  width: number;
  height: number;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Start-of-frame markers, which are the ones carrying the dimensions.
 *
 * The gaps matter: C4 is a Huffman table, C8 is reserved and CC is arithmetic
 * coding. Treating those three as frame headers reads the wrong bytes and
 * returns confident nonsense.
 */
const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);

function readPng(buf: Buffer): Dimensions | null {
  // Signature (8 bytes), then the IHDR chunk: length, type, width, height.
  if (buf.length < 24) return null;
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readJpeg(buf: Buffer): Dimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buf.length - 9) {
    // Markers are 0xFF followed by a type byte; padding 0xFF bytes are legal
    // between segments, so skip them rather than giving up.
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xff) {
      offset++;
      continue;
    }

    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const length = buf.readUInt16BE(offset + 2);
    if (length < 2) return null;

    if (SOF_MARKERS.has(marker)) {
      // segment: length(2) precision(1) height(2) width(2)
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }
  return null;
}

export function readImageDimensions(buf: Buffer): Dimensions | null {
  const png = readPng(buf);
  if (png) return png;
  return readJpeg(buf);
}

/** Anything smaller and HeyGen has too little face to work with. */
export const MIN_EDGE = 512;

/**
 * Widest ratio we accept in either direction.
 *
 * 2.5:1 rejects the panoramic team photo and the wide screenshot without
 * refusing a legitimately tall phone portrait, which is what most people
 * actually upload.
 */
export const MAX_ASPECT = 2.5;

/**
 * Checks a photo is worth spending a generation on.
 *
 * Returns a sentence to show the customer, or null when the image is fine. The
 * message names the actual number, because "invalid image" gives someone no way
 * to pick a better one.
 */
export function describePhotoProblem(buf: Buffer): string | null {
  const dims = readImageDimensions(buf);
  if (!dims || !dims.width || !dims.height) {
    return "That file could not be read as a JPG or PNG. Try exporting it again.";
  }

  if (dims.width < MIN_EDGE || dims.height < MIN_EDGE) {
    return `That image is ${dims.width}×${dims.height}. Presenters need at least ${MIN_EDGE}×${MIN_EDGE} to come out sharp.`;
  }

  const aspect = Math.max(dims.width / dims.height, dims.height / dims.width);
  if (aspect > MAX_ASPECT) {
    return `That image is very ${dims.width > dims.height ? 'wide' : 'tall'} (${dims.width}×${dims.height}). Use a photo where the face fills most of the frame.`;
  }

  return null;
}
