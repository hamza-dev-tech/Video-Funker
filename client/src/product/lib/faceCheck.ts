/**
 * Looks for a face in a photo before a generation is spent on it.
 *
 * WHY THIS IS ADVISORY AND NEVER BLOCKING
 *
 * Face detectors miss. They miss on hard side lighting, on unusual angles, on
 * heavy makeup, on stylised portraits — and they are documented to miss more
 * often on darker skin tones, because of what the training sets contained.
 * Hard-rejecting on a miss would turn away real customers with perfectly good
 * photos, and would do it unevenly. So a miss produces a warning the person can
 * read and overrule, never a locked button. The checks that *are* exact —
 * dimensions and aspect ratio — are the ones allowed to reject outright, and
 * those are enforced on the server too.
 *
 * A happy result is worth as much as a warning: telling someone their photo
 * looks right removes the doubt that otherwise sits there for the whole wait.
 *
 * THE THREE TIERS
 *
 * 1. The browser's own FaceDetector. Costs nothing and answers instantly, but
 *    only some browsers ship it, so it cannot be the whole answer.
 * 2. MediaPipe BlazeFace, imported only when tier 1 is missing and only when
 *    someone actually picks a photo. Around 3MB over the wire after compression,
 *    downloaded once and then cached by the browser. Most people never touch the
 *    photo path at all and never pay it.
 * 3. Neither available — return "unknown" and say nothing. No worse than before.
 *
 * Tier 3 is also where every failure lands: a decoder error, a missing asset, a
 * wasm that will not start. An optional check that breaks must never take the
 * upload down with it.
 */

/**
 * Face height below this share of the photo reads as "stood too far back".
 *
 * Measured against this detector rather than picked: a headshot that fills the
 * frame reports around 0.36, a waist-up shot around 0.18, and below about 0.10
 * the detector stops seeing a face at all. 0.20 therefore warns on anything
 * looser than head-and-shoulders while staying clear of the floor, so the
 * warning has a real band to fire in instead of being unreachable.
 */
const MIN_FACE_HEIGHT_RATIO = 0.2;

/** Above this, the detection is worth acting on. */
const MIN_CONFIDENCE = 0.5;

/**
 * "multiple" is correct whenever it fires but cannot be relied on to fire: this
 * detector is tuned for one close subject, and a group photo more often returns
 * nothing at all than it returns several faces. That case lands in "none",
 * whose wording is written to cover it.
 */
export type FaceVerdict = "ok" | "none" | "multiple" | "small" | "unknown";

export interface FaceCheck {
  verdict: FaceVerdict;
  /** A sentence to show, or null when there is nothing worth saying. */
  note: string | null;
  /** How tall the largest face is relative to the image, 0–1. */
  faceHeightRatio?: number;
  /*
    The detected face, in the padded square the detector actually saw.

    `padding` is how much was added to each side to square the image up, so a
    caller can translate back to the original photo's coordinates.
  */
  box?: FaceBox;
  padding?: { x: number; y: number };
  faces?: number;
}

/**
 * Where the face is, in the coordinate space of the image as loaded.
 *
 * Only the height was kept before, because the only question being asked was
 * "is this face big enough". Keeping the whole rectangle means a photo that
 * fails that test can be fixed rather than merely refused — see cropToFace in
 * prepareImage.ts.
 */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Box = FaceBox;

/* ── Tier 1: the browser's own detector ─────────────────────────────────── */

declare global {
  interface Window {
    FaceDetector?: new (opts?: {
      fastMode?: boolean;
      maxDetectedFaces?: number;
    }) => { detect(source: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>> };
  }
}

async function detectNative(img: CanvasImageSource): Promise<Box[] | null> {
  if (typeof window === "undefined" || !window.FaceDetector) return null;
  try {
    // fastMode off: this runs once on a still image, so accuracy is worth more
    // than the few milliseconds the thorough pass costs.
    const detector = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 10 });
    const faces = await detector.detect(img);
    return faces.map((f) => ({
      x: f.boundingBox.x,
      y: f.boundingBox.y,
      width: f.boundingBox.width,
      height: f.boundingBox.height,
    }));
  } catch {
    // Present but non-functional, which happens on platforms where the browser
    // exposes the constructor without a backing implementation.
    return null;
  }
}

/* ── Tier 2: MediaPipe, loaded on demand ────────────────────────────────── */

type MediaPipeDetector = {
  detect(source: HTMLImageElement | HTMLCanvasElement): {
    detections: Array<{
      boundingBox?: { originX: number; originY: number; width: number; height: number };
      categories?: Array<{ score: number }>;
    }>;
  };
};

// Module-level so the model is built once per page, not once per photo.
// Holds the in-flight promise as well, so two quick picks share one load.
let mediapipe: Promise<MediaPipeDetector | null> | null = null;

function loadMediaPipe(): Promise<MediaPipeDetector | null> {
  if (mediapipe) return mediapipe;

  mediapipe = (async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks("/vision/wasm");
      return (await vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/vision/blaze_face_short_range.tflite",
          // GPU where there is one; MediaPipe falls back to CPU by itself.
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: MIN_CONFIDENCE,
      })) as unknown as MediaPipeDetector;
    } catch {
      // Cache the failure too. Retrying a 9MB download that already failed once
      // would just make every later photo slow for no benefit.
      return null;
    }
  })();

  return mediapipe;
}

async function detectMediaPipe(img: HTMLImageElement | HTMLCanvasElement): Promise<Box[] | null> {
  const detector = await loadMediaPipe();
  if (!detector) return null;
  try {
    const result = detector.detect(img);
    return (result.detections || [])
      .filter((d) => (d.categories?.[0]?.score ?? 1) >= MIN_CONFIDENCE)
      .map((d) => ({
        x: d.boundingBox?.originX ?? 0,
        y: d.boundingBox?.originY ?? 0,
        width: d.boundingBox?.width ?? 0,
        height: d.boundingBox?.height ?? 0,
      }));
  } catch {
    return null;
  }
}

/* ── Squaring up before detection ───────────────────────────────────────── */

/**
 * Pads a non-square photo out to a square before it is handed to the detector.
 *
 * Both detectors resize whatever they are given to a small square input. Feeding
 * them a wide photo therefore squashes every face horizontally, and a squashed
 * face is one the model was never trained on. Measured on a 1400x620
 * photo, padding lifted the detector's confidence on the same face from 0.52
 * to 0.60.
 *
 * Padding only ever adds margin, so a face keeps its original pixel height and
 * the framing maths below can still be done against the real photo height.
 */
const SQUARE_THRESHOLD = 1.1;

function squareUp(
  img: HTMLImageElement
): { source: HTMLImageElement | HTMLCanvasElement; padding: { x: number; y: number } } {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const none = { source: img, padding: { x: 0, y: 0 } };
  if (!w || !h) return none;
  if (Math.max(w / h, h / w) < SQUARE_THRESHOLD) return none;

  const side = Math.max(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) return none;

  // Mid grey rather than white or black: a hard edge against the photo can
  // read as a feature to the detector, a neutral one does not.
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, side, side);
  const padX = (side - w) / 2;
  const padY = (side - h) / 2;
  ctx.drawImage(img, padX, padY, w, h);
  return { source: canvas, padding: { x: padX, y: padY } };
}

/* ── The verdict ────────────────────────────────────────────────────────── */

const UNKNOWN: FaceCheck = { verdict: "unknown", note: null };

function judge(
  faces: Box[],
  imageHeight: number,
  padding: { x: number; y: number }
): FaceCheck {
  if (faces.length === 0) {
    return {
      verdict: "none",
      faces: 0,
      // Deliberately covers all three things that land here. A group shot and a
      // face too small to resolve both come back as zero detections, so naming
      // only the literal result ("no face found") would send someone off to fix
      // the wrong thing.
      note: "We couldn't pick out a clear face. Use a photo of one person looking at the camera, with their face filling a good part of the frame. You can continue anyway if you're happy with it.",
    };
  }

  if (faces.length > 1) {
    return {
      verdict: "multiple",
      faces: faces.length,
      note: `We found ${faces.length} faces. Presenters are built from one person — crop to just the face you want, or the result will blend them.`,
    };
  }

  const ratio = imageHeight > 0 ? faces[0].height / imageHeight : 0;
  // Back into the original photo's coordinates, undoing the squaring pad.
  const box: FaceBox = {
    x: faces[0].x - padding.x,
    y: faces[0].y - padding.y,
    width: faces[0].width,
    height: faces[0].height,
  };

  if (ratio > 0 && ratio < MIN_FACE_HEIGHT_RATIO) {
    return {
      verdict: "small",
      faces: 1,
      faceHeightRatio: ratio,
      box,
      note: `The face fills only about ${Math.round(ratio * 100)}% of this photo. Crop in closer — a distant face gives the model very little to work with.`,
    };
  }

  return { verdict: "ok", faces: 1, faceHeightRatio: ratio, box, note: null };
}

/**
 * Runs the check. Resolves to "unknown" rather than throwing, always.
 */
export async function checkForFace(file: File): Promise<FaceCheck> {
  if (typeof document === "undefined") return UNKNOWN;

  let img: HTMLImageElement;
  const url = URL.createObjectURL(file);
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    return UNKNOWN;
  }

  try {
    const { source, padding } = squareUp(img);
    const faces = (await detectNative(source)) ?? (await detectMediaPipe(source));
    return faces ? judge(faces, img.naturalHeight, padding) : UNKNOWN;
  } catch {
    return UNKNOWN;
  } finally {
    URL.revokeObjectURL(url);
  }
}
