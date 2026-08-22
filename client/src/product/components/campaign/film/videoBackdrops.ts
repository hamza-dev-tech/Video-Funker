/**
 * Backdrops a presenter can stand against.
 *
 * The generated avatars come with whatever backdrop their recipe described —
 * usually a grey studio wall, which is fine and is also what every other AI
 * video on the feed looks like. A deliberate backdrop is the cheapest thing
 * that stops a talking head reading as stock footage, and HeyGen applies it at
 * render time, so it costs nothing extra and needs no new avatar.
 *
 * Named swatches rather than a colour picker, for the same reason the presenter
 * recipes are named: a hex field asks the customer to be a colour designer, and
 * the answer to "what goes here" should already be on screen. Each of these is
 * chosen to keep skin tones true and to sit behind a face without competing
 * with it — mid-dark neutrals and desaturated brand tones, no pure black
 * (crushes hair edges), no saturated colour (casts onto the face).
 */

export interface Backdrop {
  id: string;
  label: string;
  /** Null means: leave the avatar's own backdrop alone. */
  color: string | null;
  /** What it is for, in the customer's terms. */
  note: string;
  /** Swatch preview. Matches `color` unless it stands for "as generated". */
  swatch: string;
}

export const BACKDROPS: Backdrop[] = [
  {
    id: "as-generated",
    label: "As generated",
    color: null,
    note: "Keep the backdrop your presenter was created with.",
    swatch: "#8A8F94",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    color: "#1F2429",
    note: "Dark and quiet. Skin and eyes carry the frame.",
    swatch: "#1F2429",
  },
  {
    id: "navy",
    label: "Deep navy",
    color: "#12293F",
    note: "Corporate without being cold. Good for announcements.",
    swatch: "#12293F",
  },
  {
    id: "slate",
    label: "Soft slate",
    color: "#DFE5EA",
    note: "Light and clean. The safest choice for a feed.",
    swatch: "#DFE5EA",
  },
  {
    id: "stone",
    label: "Warm stone",
    color: "#E8E2D9",
    note: "Warmer than grey. Reads as a room, not a studio.",
    swatch: "#E8E2D9",
  },
  {
    id: "forest",
    label: "Deep green",
    color: "#1C332C",
    note: "Distinctive, and rare on a B2B feed.",
    swatch: "#1C332C",
  },
];

export const DEFAULT_BACKDROP = "as-generated";

export function backdropColor(id?: string | null): string | null {
  return BACKDROPS.find((b) => b.id === id)?.color ?? null;
}
