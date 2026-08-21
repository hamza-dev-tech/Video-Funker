import type { PresenterSpec } from "@product/lib/heygen-api";

/**
 * Starting points, because a blank prompt box is the wrong question.
 *
 * Asking a B2B founder to describe a photorealistic human in a way an image
 * model responds well to is asking them to be good at something that is not
 * their job, and the results showed it — one vague sentence, ten minutes of
 * waiting, and a generic stock face.
 *
 * Each recipe is a complete, opinionated presenter that renders well on the
 * first attempt. People pick the closest one and adjust, which is a far easier
 * task than writing from nothing, and it means the floor on quality is set by
 * us rather than by how much prompting practice the customer has had.
 *
 * The wardrobe and setting phrases are written the way the prompt builder
 * expects to consume them: one clause each, no repetition, no camera direction
 * (the style handles that).
 */

export interface Recipe {
  id: string;
  label: string;
  /** What this presenter is for, in the customer's terms. */
  blurb: string;
  /*
    The two or three traits that decide what this presenter LOOKS like.

    A name like "Analyst" is opaque — nobody can picture it, so choosing feels
    like a guess that costs a real generation to check. These are written by
    hand rather than derived from the spec because the spec phrases are prompt
    fragments ("a charcoal suit with a crisp white shirt"), and a chip has room
    for two words, not eleven.
  */
  chips: string[];
  spec: PresenterSpec;
}

export const RECIPES: Recipe[] = [
  {
    id: "founder",
    label: "Founder",
    blurb: "Warm and credible. The face of the company talking to its market.",
    chips: ["Realistic", "Waist up", "Navy blazer"],
    spec: {
      style: "Realistic",
      pose: "half_body",
      orientation: "vertical",
      expression: "warm",
      wardrobe: "a well-fitted navy blazer over a plain white shirt",
      setting: "a softly lit modern office, background thrown gently out of focus",
    },
  },
  {
    id: "analyst",
    label: "Analyst",
    blurb: "Precise and calm. For data, teardowns and anything that must feel rigorous.",
    chips: ["Realistic", "Head and shoulders", "Charcoal suit"],
    spec: {
      style: "Realistic",
      pose: "close_up",
      orientation: "vertical",
      expression: "calm and focused",
      wardrobe: "a charcoal suit with a crisp white shirt",
      setting: "a clean mid-grey studio backdrop",
    },
  },
  {
    id: "consultant",
    label: "Consultant",
    blurb: "Approachable and plain-spoken. Good for explainers and how-to content.",
    chips: ["Realistic", "Waist up", "Light knit"],
    spec: {
      style: "Realistic",
      pose: "half_body",
      orientation: "square",
      expression: "friendly and open",
      wardrobe: "a light knit sweater over a collared shirt",
      setting: "a bright neutral studio with soft daylight",
    },
  },
  {
    id: "executive",
    label: "Executive",
    blurb: "Composed and authoritative. For announcements and positioning.",
    chips: ["Cinematic", "Head and shoulders", "Dark suit"],
    spec: {
      style: "Cinematic",
      pose: "close_up",
      orientation: "vertical",
      expression: "composed and assured",
      wardrobe: "a tailored dark suit",
      setting: "a deep neutral backdrop with a soft rim light",
    },
  },
  {
    id: "creative",
    label: "Creative",
    blurb: "Bold and modern. For brand-led content that should not look corporate.",
    chips: ["Cinematic", "Waist up", "Black turtleneck"],
    spec: {
      style: "Cinematic",
      pose: "half_body",
      orientation: "vertical",
      expression: "confident",
      wardrobe: "a black turtleneck",
      setting: "a dark studio with a single soft key light",
    },
  },
  {
    id: "scratch",
    label: "Start from scratch",
    blurb: "Set every option yourself.",
    chips: ["You choose everything"],
    spec: {
      style: "Realistic",
      pose: "half_body",
      orientation: "vertical",
    },
  },
];

/** The option lists, mirrored from the API's validation so the two cannot drift. */
export const GENDER_OPTIONS = ["Unspecified", "Man", "Woman"] as const;

export const AGE_OPTIONS = [
  { value: "Unspecified", label: "Any age" },
  { value: "Young Adult", label: "Late twenties" },
  { value: "Early Middle Age", label: "Late thirties" },
  { value: "Late Middle Age", label: "Early fifties" },
  { value: "Senior", label: "Late sixties" },
] as const;

export const ETHNICITY_OPTIONS = [
  "Unspecified", "White", "Black", "South Asian", "South East Asian",
  "East Asian", "Middle Eastern", "Hispanic", "Pacific",
] as const;

export const STYLE_OPTIONS = [
  { value: "Realistic", label: "Realistic", hint: "Natural skin, even light. The safe default." },
  { value: "Cinematic", label: "Cinematic", hint: "Graded colour, soft key with a rim light." },
  { value: "Vintage", label: "Vintage", hint: "Warm film grain, seventies studio." },
  { value: "Noir", label: "Noir", hint: "High-contrast black and white." },
  { value: "Pixar", label: "Animated", hint: "Stylised 3D character, not photoreal." },
  { value: "Cyberpunk", label: "Cyberpunk", hint: "Neon rim light, dark background." },
] as const;

export const POSE_OPTIONS = [
  { value: "close_up", label: "Head and shoulders" },
  { value: "half_body", label: "Waist up" },
  { value: "full_body", label: "Full length" },
] as const;

export const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical", hint: "9:16 — the LinkedIn and Reels shape" },
  { value: "square", label: "Square", hint: "1:1 — feed posts" },
  { value: "horizontal", label: "Wide", hint: "16:9 — landing pages, YouTube" },
] as const;
