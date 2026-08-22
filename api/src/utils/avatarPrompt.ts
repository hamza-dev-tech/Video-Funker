/**
 * Turns a presenter spec into a prompt HeyGen can render well.
 *
 * This replaces `buildAvatarPrompt` in helper.ts, which produced strings like:
 *
 *   "Ultra realistic professional portrait, Man, South Asian, person in Young
 *    Adult, friendly expression, friendly, friendly, wearing friendly, standing
 *    in friendly, natural skin texture, cinematic lighting, DSLR photography,
 *    shallow depth of field, highly detailed face, photorealistic"
 *
 * Three things were wrong with that, and all three degrade the render:
 *
 *   1. One `appearance` value was piped into five separate slots, so the word
 *      appeared five times. Image models read repetition as emphasis — that
 *      prompt says "friendliness matters more than this person's age, clothing
 *      or setting combined".
 *   2. "person in Young Adult" is not English. These are language models; broken
 *      grammar produces confused output.
 *   3. `style` was accepted as a parameter and never used, while the string
 *      hard-coded "Ultra realistic … photorealistic". Choosing Pixar produced a
 *      photoreal prompt that actively contradicted the choice.
 *
 * The rules here are the opposite of that: every concept appears exactly once,
 * everything reads as a sentence, and the chosen style decides the entire visual
 * treatment rather than being appended to a fixed one.
 */

export type Gender = 'Man' | 'Woman' | 'Unspecified';
export type Age = 'Young Adult' | 'Early Middle Age' | 'Late Middle Age' | 'Senior' | 'Unspecified';
export type Ethnicity =
  | 'White' | 'Black' | 'South Asian' | 'South East Asian'
  | 'East Asian' | 'Middle Eastern' | 'Hispanic' | 'Pacific' | 'Unspecified';
export type Orientation = 'square' | 'horizontal' | 'vertical';
export type Pose = 'half_body' | 'close_up' | 'full_body';
export type Style = 'Realistic' | 'Cinematic' | 'Pixar' | 'Vintage' | 'Noir' | 'Cyberpunk' | 'Unspecified';

export interface PresenterSpec {
  gender?: Gender;
  age?: Age;
  ethnicity?: Ethnicity;
  style?: Style;
  pose?: Pose;
  orientation?: Orientation;
  /** What they are wearing. One phrase. */
  wardrobe?: string;
  /** How they hold their face. One phrase. */
  expression?: string;
  /** Where they are. One phrase. */
  setting?: string;
  /** Anything the fields above cannot express. Free text, appended once. */
  details?: string;
}

export const GENDERS: Gender[] = ['Man', 'Woman', 'Unspecified'];
export const AGES: Age[] = ['Young Adult', 'Early Middle Age', 'Late Middle Age', 'Senior', 'Unspecified'];
export const ETHNICITIES: Ethnicity[] = [
  'White', 'Black', 'South Asian', 'South East Asian',
  'East Asian', 'Middle Eastern', 'Hispanic', 'Pacific', 'Unspecified',
];
export const ORIENTATIONS: Orientation[] = ['square', 'horizontal', 'vertical'];
export const POSES: Pose[] = ['half_body', 'close_up', 'full_body'];
export const STYLES: Style[] = ['Realistic', 'Cinematic', 'Pixar', 'Vintage', 'Noir', 'Cyberpunk', 'Unspecified'];

/** HeyGen rejects prompts over 1000 characters. */
export const PROMPT_MAX = 1000;

/**
 * Ages as a person would say them, not as an enum.
 *
 * "a man in his late twenties" is a phrase the model has seen a million times
 * in captions. "person in Young Adult" is a phrase it has never seen.
 */
const AGE_PHRASE: Record<Age, string> = {
  'Young Adult': 'in their late twenties',
  'Early Middle Age': 'in their late thirties',
  'Late Middle Age': 'in their early fifties',
  Senior: 'in their late sixties',
  Unspecified: '',
};

const GENDER_NOUN: Record<Gender, string> = {
  Man: 'man',
  Woman: 'woman',
  Unspecified: 'person',
};

/** Pose as framing language, which is what a camera-facing model understands. */
const POSE_PHRASE: Record<Pose, string> = {
  close_up: 'head-and-shoulders framing',
  half_body: 'framed from the waist up',
  full_body: 'full-length framing',
};

/**
 * Orientation as composition, not as an aspect-ratio token.
 *
 * These were validated by the old controller and then thrown away — never
 * passed to the prompt builder at all. Saying "vertical composition with
 * headroom above the subject" actually changes what comes back; the string
 * "vertical" on its own does not.
 */
const ORIENTATION_PHRASE: Record<Orientation, string> = {
  vertical: 'vertical composition with headroom above the subject',
  square: 'square composition with the subject centred',
  horizontal: 'horizontal composition with the subject slightly off-centre',
};

/**
 * The whole visual treatment, chosen by style.
 *
 * Not appended to a fixed photoreal base — replacing it. A Pixar prompt that
 * also says "photorealistic, natural skin texture, DSLR" is asking for two
 * incompatible images, and the model splits the difference into something that
 * looks like neither.
 */
const STYLE_TREATMENT: Record<Style, string> = {
  Realistic:
    'natural skin texture with visible pores, even key lighting, sharp focus on the eyes, shot on an 85mm lens at f/2.8',
  Cinematic:
    'cinematic colour grade, soft key light with a gentle rim, shallow depth of field, shot on an 85mm anamorphic lens',
  Pixar:
    'stylised 3D animated character in the manner of a modern animated feature, appealing readable character design, large expressive eyes with clear catchlights, soft global illumination with a warm key and gentle rim, subtle subsurface scattering on the skin, clean smooth surfacing, shallow depth of field, not photorealistic',
  Vintage:
    'shot on Kodak Portra 400, warm film grain, soft 1970s studio lighting, muted period colour',
  Noir:
    'high-contrast black and white, hard key light from one side, deep shadows, dramatic 1940s studio portrait lighting',
  Cyberpunk:
    'neon rim lighting in teal and magenta, futuristic wardrobe detailing, dark atmospheric background',
  Unspecified:
    'natural skin texture, even key lighting, sharp focus on the eyes, shot on an 85mm lens at f/2.8',
};

/**
 * The clause that turns a portrait into a presenter.
 *
 * This is the part nobody had written, and it is the difference between a nice
 * picture and a usable asset. The output is not decoration — it gets lip-synced
 * and animated for a 47-second talking-head video. A three-quarter profile in
 * dramatic side light is a lovely photograph and a terrible presenter: the mouth
 * animates badly, the eyes never meet the viewer, and a busy background competes
 * with the message.
 *
 * Stated positively rather than as a list of don'ts, because image models handle
 * "both eyes visible" far more reliably than "no closed eyes".
 */
const PRESENTER_REQUIREMENTS =
  'Both eyes visible and looking directly into the lens, mouth closed and unobstructed, ' +
  'hands away from the face, plain uncluttered background, no text or logos on clothing';

/** Squash whitespace and drop empty segments before joining. */
const clean = (value?: string) => (value || '').trim().replace(/\s+/g, ' ');

/**
 * Builds the prompt.
 *
 * Ordering is deliberate: subject first, then framing, then wardrobe, setting
 * and treatment, with the presenter requirements last. Image models weight
 * earlier tokens more heavily, so the person leads and the camera notes trail.
 */
export function buildPresenterPrompt(spec: PresenterSpec): string {
  const gender = spec.gender && spec.gender !== 'Unspecified' ? GENDER_NOUN[spec.gender] : 'person';
  const ethnicity = spec.ethnicity && spec.ethnicity !== 'Unspecified' ? clean(spec.ethnicity) : '';
  const age = spec.age ? AGE_PHRASE[spec.age] : '';
  const expression = clean(spec.expression);
  const style = spec.style || 'Unspecified';

  // "Professional headshot of a friendly South Asian man in their late twenties"
  const subject = [
    'Professional headshot of a',
    expression ? expression.toLowerCase() : '',
    ethnicity,
    gender,
    age,
  ]
    .filter(Boolean)
    .join(' ');

  const sentences: string[] = [];

  const framing = spec.pose ? POSE_PHRASE[spec.pose] : '';
  sentences.push([subject, framing, 'facing the camera directly'].filter(Boolean).join(', ') + '.');

  const wardrobe = clean(spec.wardrobe);
  if (wardrobe) sentences.push(`Wearing ${wardrobe.replace(/^wearing\s+/i, '')}.`);

  const setting = clean(spec.setting);
  if (setting) sentences.push(`${setting.charAt(0).toUpperCase()}${setting.slice(1)}.`);

  const treatment = [
    STYLE_TREATMENT[style],
    spec.orientation ? ORIENTATION_PHRASE[spec.orientation] : '',
  ]
    .filter(Boolean)
    .join(', ');
  sentences.push(`${treatment.charAt(0).toUpperCase()}${treatment.slice(1)}.`);

  const details = clean(spec.details);
  if (details) sentences.push(details.endsWith('.') ? details : `${details}.`);

  sentences.push(`${PRESENTER_REQUIREMENTS}.`);

  const prompt = sentences.join(' ');

  /*
    Trim from the end if we run past HeyGen's ceiling, and drop whole sentences
    rather than cutting mid-clause — a prompt ending "shot on an 85mm len" is
    worse than one that simply stops earlier. The subject sentence and the
    presenter requirements are the two that must survive, so they bookend the
    list and the optional middle is what gets sacrificed.
  */
  if (prompt.length <= PROMPT_MAX) return prompt;

  const required = [sentences[0], sentences[sentences.length - 1]];
  const optional = sentences.slice(1, -1);
  let out = required.join(' ');

  for (const sentence of optional) {
    const candidate = `${required[0]} ${sentence} ${required[1]}`;
    if (candidate.length > PROMPT_MAX) break;
    required.splice(required.length - 1, 0, sentence);
    out = required.join(' ');
  }
  return out;
}

export default buildPresenterPrompt;
