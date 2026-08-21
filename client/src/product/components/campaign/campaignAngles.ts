/**
 * The shapes a campaign can take, because a blank line is the wrong question.
 *
 * The whole input surface for eight AI calls was one text box reading "Enter
 * topic". Typing `x` passed validation and ran the full chain. Nothing
 * suggested what a good topic looks like, so people wrote a noun — "AI sales
 * automation" — and got an article about the category rather than an argument
 * anyone would stop scrolling for.
 *
 * An angle is not a subject; it is the *stance* the campaign takes on the
 * subject. That distinction is the whole difference between content that reads
 * as filler and content that reads as a point of view — and it is exactly the
 * expertise a founder hired us to supply rather than learn.
 *
 * Same idea as the presenter recipes in avatar/presenterRecipes.ts: pick the
 * closest one, adjust, and the floor on quality is set by us.
 */

export interface CampaignAngle {
  id: string;
  label: string;
  /** What this angle is for, in the customer's terms. */
  blurb: string;
  /** The two or three traits that decide how it reads. */
  chips: string[];
  /**
   * The instruction the server prepends to the customer's topic.
   *
   * Written as direction to a strategist, not as a template with holes: the
   * server composes the final brief, so this never reaches a model alone.
   */
  framing: string;
  /** A worked example, so the field teaches instead of just waiting. */
  placeholder: string;
}

export const CAMPAIGN_ANGLES: CampaignAngle[] = [
  {
    id: "contrarian",
    label: "Contrarian take",
    blurb: "Name a belief your market holds and argue the opposite. Best for standing out in a crowded feed.",
    chips: ["Attention-first", "Opinionated", "Good for cold audiences"],
    framing:
      "Frame this as a contrarian argument: state the belief the market currently holds, show precisely where it breaks down with evidence, then give the better position. Do not hedge — the whole value is in taking a side.",
    placeholder: "e.g. Hiring more SDRs is the wrong answer to a pipeline problem",
  },
  {
    id: "hidden-cost",
    label: "The hidden cost",
    blurb: "Put a number on a problem your buyer is living with and has stopped noticing. Best for problem-aware buyers.",
    chips: ["Problem-aware", "Quantified", "Drives urgency"],
    framing:
      "Frame this around a cost the buyer is already paying without measuring it. Quantify it, show how it compounds over a year, and make the status quo feel expensive rather than safe.",
    placeholder: "e.g. What a 3-week sales cycle delay actually costs a mid-market SaaS",
  },
  {
    id: "teardown",
    label: "How we actually do it",
    blurb: "Show your own process in full, with the parts that are hard. Best for building trust with sceptical buyers.",
    chips: ["Trust-building", "Concrete", "Founder-led"],
    framing:
      "Frame this as a transparent teardown of how we do this in practice. Include the steps, the tools, the numbers, and the parts that are genuinely difficult. Withholding the hard parts is what makes this kind of content read as marketing.",
    placeholder: "e.g. How we book 12 meetings a month with a two-person team",
  },
  {
    id: "buyer-mistake",
    label: "The mistake buyers make",
    blurb: "The thing prospects get wrong before they find you. Best for creating the problem in their mind.",
    chips: ["Educational", "Problem-framing", "Good for nurture"],
    framing:
      "Frame this around a specific, common mistake this buyer makes before they know our category exists. Describe the mistake, why it is a reasonable thing to believe, what it costs, and what to do instead.",
    placeholder: "e.g. Why buying more data doesn't fix a targeting problem",
  },
  {
    id: "market-shift",
    label: "What's changing",
    blurb: "A shift in the market and what it means for your buyer. Best for positioning against the old way.",
    chips: ["Category-level", "Forward-looking", "Positions the shift"],
    framing:
      "Frame this around a shift that is happening in this market right now. Name what is changing, give evidence it is real, and be specific about what it means for this buyer's next twelve months.",
    placeholder: "e.g. Why outbound is moving from volume to relevance",
  },
  {
    id: "scratch",
    label: "Start from scratch",
    blurb: "Write the brief yourself.",
    chips: ["You choose the stance"],
    framing: "",
    placeholder: "e.g. Why mid-market RevOps teams stall at 50 reps",
  },
];

/**
 * The structured brief the server turns into a topic.
 *
 * `topic` alone used to be the entire input. The other three fields are what a
 * strategist would ask before writing anything, and each maps to a real gap in
 * the output we were producing: no stance, no named reader, no intended action.
 */
export interface CampaignBrief {
  angle: string;
  topic: string;
  /** Who specifically. Blank means "use the ICP". */
  audience?: string;
  /** What the reader should do or believe afterwards. */
  outcome?: string;
}

export const OUTCOME_OPTIONS = [
  { value: "", label: "Use the campaign default" },
  { value: "book", label: "Book a call with us" },
  { value: "reply", label: "Reply to an outbound message" },
  { value: "rethink", label: "Rethink how they do this today" },
  { value: "follow", label: "Follow us for more like this" },
  { value: "share", label: "Share it with their team" },
] as const;

/**
 * A preview of the brief the server will build. PREVIEW ONLY.
 *
 * The server composes the authoritative version from the same fields, exactly
 * as the presenter prompt builder does. This exists so the review step can show
 * what is about to be asked for, which turns a long opaque wait into something
 * the customer had visible control over.
 */
export function previewBrief(brief: CampaignBrief): string {
  const angle = CAMPAIGN_ANGLES.find((a) => a.id === brief.angle);
  const parts: string[] = [];

  parts.push(`Topic: ${brief.topic.trim() || "(not set)"}`);
  if (angle?.framing) parts.push(`Angle: ${angle.framing}`);
  if (brief.audience?.trim()) parts.push(`Written for: ${brief.audience.trim()}`);

  const outcome = OUTCOME_OPTIONS.find((o) => o.value === brief.outcome);
  if (outcome && outcome.value) parts.push(`Desired outcome: the reader should ${outcome.label.toLowerCase()}.`);

  return parts.join("\n\n");
}

/** The brief as one readable line, for the review step. */
export function summariseBrief(brief: CampaignBrief): string {
  const angle = CAMPAIGN_ANGLES.find((a) => a.id === brief.angle);
  const bits = [
    angle && angle.id !== "scratch" ? angle.label.toLowerCase() : null,
    brief.audience?.trim() ? `for ${brief.audience.trim()}` : null,
  ].filter(Boolean);

  return bits.length
    ? `"${brief.topic.trim()}" — a ${bits.join(", ")}.`
    : `"${brief.topic.trim()}"`;
}
