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
