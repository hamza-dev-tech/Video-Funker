import type { PresenterSpec } from "@product/lib/heygen-api";

/**
 * A preview of the prompt the server will build. PREVIEW ONLY.
 *
 * The server is the authority: `POST /custom-avatars` rebuilds the prompt from
 * the spec regardless of anything sent from here, so this file can never change
 * what an avatar actually looks like. It exists so the wizard can show a person
 * what they are about to ask for, live, as they choose — which turns an opaque
 * ten-minute wait into something they had visible control over.
 *
 * It is a deliberate duplicate of api/src/utils/avatarPrompt.ts. The two
 * workspaces have separate tsconfigs and no shared package, so the honest
 * options were duplicate-and-label or a round trip to the server on every
 * keystroke. If they ever drift, the only casualty is the preview text.
 */

const AGE_PHRASE: Record<string, string> = {
  "Young Adult": "in their late twenties",
  "Early Middle Age": "in their late thirties",
  "Late Middle Age": "in their early fifties",
  Senior: "in their late sixties",
  Unspecified: "",
};

const GENDER_NOUN: Record<string, string> = {
  Man: "man",
  Woman: "woman",
  Unspecified: "person",
};

const POSE_PHRASE: Record<string, string> = {
  close_up: "head-and-shoulders framing",
  half_body: "framed from the waist up",
  full_body: "full-length framing",
};

const ORIENTATION_PHRASE: Record<string, string> = {
  vertical: "vertical composition with headroom above the subject",
  square: "square composition with the subject centred",
  horizontal: "horizontal composition with the subject slightly off-centre",
};

const STYLE_TREATMENT: Record<string, string> = {
  Realistic:
    "natural skin texture with visible pores, even key lighting, sharp focus on the eyes, shot on an 85mm lens at f/2.8",
  Cinematic:
    "cinematic colour grade, soft key light with a gentle rim, shallow depth of field, shot on an 85mm anamorphic lens",
  Pixar:
    "stylised 3D animated character in the manner of a modern animated feature, appealing readable character design, large expressive eyes with clear catchlights, soft global illumination with a warm key and gentle rim, subtle subsurface scattering on the skin, clean smooth surfacing, shallow depth of field, not photorealistic",
  Vintage:
    "shot on Kodak Portra 400, warm film grain, soft 1970s studio lighting, muted period colour",
  Noir:
    "high-contrast black and white, hard key light from one side, deep shadows, dramatic 1940s studio portrait lighting",
  Cyberpunk:
    "neon rim lighting in teal and magenta, futuristic wardrobe detailing, dark atmospheric background",
  Unspecified:
    "natural skin texture, even key lighting, sharp focus on the eyes, shot on an 85mm lens at f/2.8",
};

const PRESENTER_REQUIREMENTS =
  "Both eyes visible and looking directly into the lens, mouth closed and unobstructed, " +
  "hands away from the face, plain uncluttered background, no text or logos on clothing";

const clean = (v?: string) => (v || "").trim().replace(/\s+/g, " ");

export function previewPrompt(spec: PresenterSpec): string {
  const gender = spec.gender && spec.gender !== "Unspecified" ? GENDER_NOUN[spec.gender] : "person";
  const ethnicity = spec.ethnicity && spec.ethnicity !== "Unspecified" ? clean(spec.ethnicity) : "";
  const age = spec.age ? AGE_PHRASE[spec.age] || "" : "";
  const expression = clean(spec.expression);
  const style = spec.style || "Unspecified";

  const subject = [
    "Professional headshot of a",
    expression ? expression.toLowerCase() : "",
    ethnicity,
    gender,
    age,
  ]
    .filter(Boolean)
    .join(" ");

  const sentences: string[] = [];
  const framing = spec.pose ? POSE_PHRASE[spec.pose] : "";
  sentences.push([subject, framing, "facing the camera directly"].filter(Boolean).join(", ") + ".");

  const wardrobe = clean(spec.wardrobe);
  if (wardrobe) sentences.push(`Wearing ${wardrobe.replace(/^wearing\s+/i, "")}.`);

  const setting = clean(spec.setting);
  if (setting) sentences.push(`${setting.charAt(0).toUpperCase()}${setting.slice(1)}.`);

  const treatment = [
    STYLE_TREATMENT[style],
    spec.orientation ? ORIENTATION_PHRASE[spec.orientation] : "",
  ]
    .filter(Boolean)
    .join(", ");
  sentences.push(`${treatment.charAt(0).toUpperCase()}${treatment.slice(1)}.`);

  const details = clean(spec.details);
  if (details) sentences.push(details.endsWith(".") ? details : `${details}.`);

  sentences.push(`${PRESENTER_REQUIREMENTS}.`);
  return sentences.join(" ");
}

/**
 * The same spec as one readable line.
 *
 * This is what the wizard shows by default. A 580-character prompt full of
 * lens specifications is proof of work, not communication — useful to see once,
 * exhausting to read every time. The full text stays one click away.
 */
export function summarise(spec: PresenterSpec): string {
  const bits = [
    clean(spec.expression),
    spec.ethnicity && spec.ethnicity !== "Unspecified" ? spec.ethnicity : "",
    spec.gender && spec.gender !== "Unspecified" ? GENDER_NOUN[spec.gender] : "person",
    spec.age && spec.age !== "Unspecified" ? AGE_PHRASE[spec.age] : "",
  ].filter(Boolean);

  const tail = [
    spec.pose ? POSE_PHRASE[spec.pose] : "",
    clean(spec.wardrobe),
    clean(spec.setting),
  ].filter(Boolean);

  const head = `A ${bits.join(" ")}`;
  return tail.length ? `${head} — ${tail.join(", ")}.` : `${head}.`;
}
