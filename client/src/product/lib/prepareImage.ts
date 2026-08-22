/**
 * Checks a photo and shrinks it before it ever leaves the browser.
 *
 * Two problems this solves, both of which cost the customer real time.
 *
 * FEEDBACK. The only checks were the MIME type and a 10MB ceiling, so a small
 * or badly-shaped photo was accepted, uploaded, sent to HeyGen, billed, and came
 * back unusable minutes later with nothing said about why. Reading the
 * dimensions in the browser turns that into an immediate sentence, before
 * anything is spent. The server repeats the check — a browser can be bypassed —
 * but the browser is where the person actually is.
 *
 * SIZE. The API base64-encodes whatever it receives into a JSON body, which
 * inflates it by about a third. A 4MB phone photo becomes a 5.3MB request that
 * has to be uploaded, held in server memory and forwarded. A headshot does not
 * need twelve megapixels: capping the long edge at 1536px takes that same photo
 * to roughly 400KB with no visible loss on a face, and makes the upload feel
 * instant on a normal connection.
 */

/** Matches MIN_EDGE in api/src/utils/imageDimensions.ts. */
export const MIN_EDGE = 512;
/** Matches MAX_ASPECT there too. */
export const MAX_ASPECT = 2.5;
/** Long-edge cap after downscaling. Well above what a face needs. */
export const MAX_EDGE = 1536;

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
  /** Set when the image was resized, for showing what happened. */
  originalWidth?: number;
  originalHeight?: number;
}

export interface PrepareFailure {
  problem: string;
}

export type PrepareResult = PreparedImage | PrepareFailure;

export const isFailure = (r: PrepareResult): r is PrepareFailure =>
  (r as PrepareFailure).problem !== undefined;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });

export async function prepareImage(file: File): Promise<PrepareResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { problem: "That file could not be opened as an image. Try exporting it again." };
  }

  const { naturalWidth: width, naturalHeight: height } = img;

  if (width < MIN_EDGE || height < MIN_EDGE) {
    return {
      problem: `That image is ${width}×${height}. Presenters need at least ${MIN_EDGE}×${MIN_EDGE} to come out sharp.`,
    };
  }

  const aspect = Math.max(width / height, height / width);
  if (aspect > MAX_ASPECT) {
    return {
      problem: `That image is very ${width > height ? "wide" : "tall"} (${width}×${height}). Use a photo where the face fills most of the frame.`,
    };
  }

  // Already small enough — send the original rather than re-encoding it, which
  // would only throw away detail for nothing.
  if (width <= MAX_EDGE && height <= MAX_EDGE) {
    return { file, width, height };
  }

  const scale = MAX_EDGE / Math.max(width, height);
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { file, width, height };

  // The browser's own resampling, which is better than anything worth
  // hand-writing here and is hardware-accelerated.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    // 0.92 is the quality where JPEG artefacts stop being visible on skin;
    // higher buys file size and nothing a face model can use.
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
  );

  if (!blob) return { file, width, height };

  const resized = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: resized,
    width: outW,
    height: outH,
    originalWidth: width,
    originalHeight: height,
  };
}

/** "2.4MB" / "380KB" */
export const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;

/**
 * Crops a photo down to a presenter headshot, around a detected face.
 *
 * The real cause of a poor photo avatar is almost never the file — it is the
 * framing. A full-body shot taken in a garden gives HeyGen a face perhaps two
 * hundred pixels tall inside a twelve-hundred-pixel image, and no amount of
 * rendering engine recovers detail that was never captured. That is exactly
 * what produced an avatar the customer described as looking fake.
 *
 * Warning about it was not enough: the warning is advisory by design, and the
 * obvious thing to do when told your photo is imperfect is to use it anyway.
 * Since the detector already returns where the face is, the product can simply
 * fix the framing instead of asking someone to go and find a better photo.
 *
 * The framing rules are the ones a portrait photographer uses:
 *   - the face occupies about 42% of the frame height, which reads as
 *     head-and-shoulders rather than a passport photo or a distant figure
 *   - roughly a fifth of the frame sits above the head as headroom
 *   - 3:4 portrait, which is what a talking-head render wants
 */
const FACE_SHARE_OF_FRAME = 0.42;
const HEADROOM_ABOVE_FACE = 0.2;
const PORTRAIT_RATIO = 3 / 4;

export async function cropToFace(
  file: File,
  box: { x: number; y: number; width: number; height: number }
): Promise<PrepareResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { problem: "That file could not be opened as an image." };
  }

  const { naturalWidth: iw, naturalHeight: ih } = img;
  if (!box.height || !iw || !ih) {
    return { problem: "We couldn't work out where the face is in this photo." };
  }

  // Frame sized so the face fills the intended share of it.
  let frameH = box.height / FACE_SHARE_OF_FRAME;
  let frameW = frameH * PORTRAIT_RATIO;

  // Never ask for more pixels than the photo has.
  const scale = Math.min(1, iw / frameW, ih / frameH);
  frameW *= scale;
  frameH *= scale;

  const faceCentreX = box.x + box.width / 2;
  let left = faceCentreX - frameW / 2;
  let top = box.y - frameH * HEADROOM_ABOVE_FACE;

  // Keep the crop inside the photo rather than filling the overhang with grey.
  left = Math.max(0, Math.min(left, iw - frameW));
  top = Math.max(0, Math.min(top, ih - frameH));

  const outW = Math.min(MAX_EDGE, Math.round(frameW));
  const outH = Math.round((outW / frameW) * frameH);

  if (outW < MIN_EDGE || outH < MIN_EDGE) {
    return {
      problem: `Cropping to the face would leave only ${outW}×${outH}. Use a photo taken closer to the subject.`,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { problem: "Your browser could not process this image." };

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, left, top, frameW, frameH, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
  );
  if (!blob) return { problem: "Your browser could not process this image." };

  const cropped = new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: cropped,
    width: outW,
    height: outH,
    originalWidth: iw,
    originalHeight: ih,
  };
}

/**
 * Whether cropping to this face would leave a usable photo.
 *
 * Cropping cannot create detail that was never captured. A face 170 pixels tall
 * inside a 1152x1536 photo crops to roughly 300x400 — correctly framed and far
 * too small to render from. Upscaling it back over the minimum would pass the
 * check and produce a soft, obviously-artificial avatar, which is worse than
 * refusing, because it hides the problem behind a green tick.
 *
 * So the offer to crop is only made when it would actually help. The arithmetic
 * is the same as cropToFace: at a 42% face share, a 512px minimum edge needs a
 * face about 215 pixels tall in the original.
 */
export const MIN_FACE_HEIGHT_FOR_CROP = Math.ceil(MIN_EDGE * FACE_SHARE_OF_FRAME);

export function canCropToFace(
  box: { height: number } | undefined,
  imageWidth: number,
  imageHeight: number
): boolean {
  if (!box?.height) return false;
  const frameH = Math.min(box.height / FACE_SHARE_OF_FRAME, imageHeight);
  const frameW = Math.min(frameH * PORTRAIT_RATIO, imageWidth);
  return Math.round(frameW) >= MIN_EDGE && Math.round(frameH) >= MIN_EDGE;
}
