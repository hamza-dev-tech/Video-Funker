/**
 * Builds the campaign brief the prompts consume, from structured choices.
 *
 * The customer's raw sentence used to be the entire input to eight AI calls —
 * when it reached them at all. This composes a proper brief from the angle they
 * picked, the topic they wrote, who it is for and what should happen next, and
 * it does it on the SERVER so the floor on quality is set by us rather than by
 * how practised the customer is at briefing a writer.
 *
 * Deliberately mirrors avatarPrompt.ts, and is a deliberate duplicate of the
 * angle text in client/src/product/components/campaign/campaignAngles.ts. The
 * two workspaces share no package, so the honest options were duplicate-and-
 * label or a round trip on every keystroke. If they drift, the only casualty is
 * the preview the review screen shows — this file is what actually runs.
 */

export interface CampaignBriefSpec {
  angle?: string;
  topic: string;
  audience?: string;
  outcome?: string;
}

const clean = (v?: string) => (v || '').trim().replace(/\s+/g, ' ');

/** Direction for the writer, keyed by angle id. */
const ANGLE_FRAMING: Record<string, string> = {
  contrarian:
    'Frame this as a contrarian argument: state the belief the market currently holds, show precisely where it breaks down with evidence, then give the better position. Do not hedge — the whole value is in taking a side.',
  'hidden-cost':
    'Frame this around a cost the buyer is already paying without measuring it. Quantify it, show how it compounds over a year, and make the status quo feel expensive rather than safe.',
  teardown:
    'Frame this as a transparent teardown of how we do this in practice. Include the steps, the tools, the numbers, and the parts that are genuinely difficult. Withholding the hard parts is what makes this kind of content read as marketing.',
  'buyer-mistake':
    'Frame this around a specific, common mistake this buyer makes before they know our category exists. Describe the mistake, why it is a reasonable thing to believe, what it costs, and what to do instead.',
  'market-shift':
    'Frame this around a shift that is happening in this market right now. Name what is changing, give evidence it is real, and be specific about what it means for this buyer\'s next twelve months.',
  scratch: '',
};

export const ALLOWED_ANGLES = Object.keys(ANGLE_FRAMING);

/** What the reader should do, keyed by outcome id. */
const OUTCOME_TEXT: Record<string, string> = {
  book: 'book a call with us',
  reply: 'reply to an outbound message',
  rethink: 'rethink how they do this today',
  follow: 'follow us for more like this',
  share: 'share it with their team',
};

/**
 * Requirements appended to every brief.
 *
 * These are the failure modes we saw in real output: category explainers with
 * no argument, invented statistics, and closing paragraphs of AI throat-clearing.
 */
const BRIEF_REQUIREMENTS =
  'Take a clear position rather than surveying the topic. Use only facts present in the research and the ICP — do not invent statistics, customer names or case studies. Write for one named reader, not a general audience. No filler openings and no summary paragraph that restates what was just said.';

/** Longest brief we will build. Beyond this the prompts lose the thread. */
const BRIEF_MAX = 1200;

/**
 * Composes the brief. Falls back to the bare topic when nothing else is set,
 * so a caller that sends only a topic — the regenerate dialog, for instance —
 * keeps working exactly as before.
 */
export function buildCampaignBrief(spec: CampaignBriefSpec): string {
  const topic = clean(spec.topic);
  if (!topic) return '';

  const parts: string[] = [`Topic: ${topic}`];

  const framing = spec.angle ? ANGLE_FRAMING[spec.angle] : '';
  if (framing) parts.push(framing);

  const audience = clean(spec.audience);
  if (audience) {
    parts.push(`Write this for: ${audience}. Where the ICP and this description differ, prefer this description.`);
  }

  const outcome = spec.outcome ? OUTCOME_TEXT[spec.outcome] : '';
  if (outcome) parts.push(`After reading, the reader should ${outcome}.`);

  parts.push(BRIEF_REQUIREMENTS);

  const brief = parts.join('\n\n');
  return brief.length > BRIEF_MAX ? brief.slice(0, BRIEF_MAX).trimEnd() : brief;
}

/** Rejects an angle or outcome the UI could not have produced. */
export function validateBriefSpec(spec: CampaignBriefSpec): string | null {
  if (spec.angle && !ALLOWED_ANGLES.includes(spec.angle)) {
    return `angle must be one of: ${ALLOWED_ANGLES.join(', ')}`;
  }
  if (spec.outcome && !OUTCOME_TEXT[spec.outcome]) {
    return `outcome must be one of: ${Object.keys(OUTCOME_TEXT).join(', ')}`;
  }
  if (spec.audience && spec.audience.length > 300) {
    return 'audience must be 300 characters or fewer';
  }
  return null;
}
