/**
 * How lifelike the render is. HeyGen's biggest quality lever, and the one
 * Video Funker was never pulling.
 *
 * Measured against a real avatar in this account, HeyGen reported it supported
 * `avatar_v`, `avatar_iv` and `avatar_iii`. Every render went out asking for
 * none of them, because neither endpoint previously used takes an engine at
 * all — so the base pipeline rendered a face that was capable of far better.
 * That is most of the reason finished videos looked artificial.
 *
 * Named for what they do rather than by their version numbers, because
 * "avatar_v" tells a customer nothing about which one to pick.
 */

export interface VideoEngineOption {
  id: "avatar_iii" | "avatar_iv" | "avatar_v";
  label: string;
  blurb: string;
  /** Roughly what HeyGen charges, so the choice is not made blind. */
  cost: string;
}

export const VIDEO_ENGINES: VideoEngineOption[] = [
  {
    id: "avatar_v",
    label: "Highest fidelity",
    blurb: "The most lifelike render HeyGen offers. Slower, and the most expensive per second.",
    cost: "~$4/min",
  },
  {
    id: "avatar_iv",
    label: "Balanced",
    blurb: "HeyGen's default. Convincing on most faces, and a sensible place to start.",
    cost: "~$2/min",
  },
  {
    id: "avatar_iii",
    label: "Fastest",
    blurb: "Built for photo avatars. Cheapest and quickest, but visibly softer.",
    cost: "~$1/min",
  },
];

/** What a new render uses unless someone chooses otherwise. */
export const DEFAULT_ENGINE = "avatar_iv";

export const RESOLUTIONS = [
  { id: "1080p", label: "1080p", blurb: "Full HD. The right default for social and web." },
  { id: "4k", label: "4K", blurb: "For a landing page or a stage screen. Slower to render." },
  { id: "720p", label: "720p", blurb: "Smaller file. Visibly soft on a modern phone." },
] as const;

export const DEFAULT_RESOLUTION = "1080p";
