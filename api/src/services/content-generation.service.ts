import fs from 'fs';
import path from 'path';
import ICPProfile from '../models/ICPProfile';
import Campaign from '../models/Campaign';
import Content, { IContent, SectionKey } from '../models/Content';
import { getOpenAI, chatModel } from '../config/openai';
import {
  researchPrompt,
  articlePrompt,
  videoScriptPrompt,
  captionPrompt,
  linkedinPostPrompt,
  outboundScriptPrompt,
  linkdineArticalImagePrompt,
  longFormPostPrompt,
} from '../config/contentPrompts';


/**
 * Defensive cleanup of AI prose output.
 *
 * `stripBrackets` is off by default, and that default is the whole point.
 * The rule that removed every [...] was written to strip video stage
 * directions and was then applied to all eight sections — including the
 * outbound email sequences, the one artefact customers paste straight into a
 * sending tool. It deleted their merge fields, so emails went out reading
 * "Hi ," and "I saw that is hiring". It also ate the label out of every
 * markdown link.
 *
 * Only the video script asks for it now, and even there only known stage
 * directions rather than anything inside square brackets.
 */
const STAGE_DIRECTION =
  /\[\s*(?:cut|cue|b-?roll|shot|scene|camera|angle|zoom|pan|fade|music|sfx|sound|beat|pause|on[- ]screen|text on screen|graphic|lower third|title card|montage|voice ?over|vo)\b[^\]\n]*\]/gi;

export function sanitizeProse(input: string, stripBrackets = false): string {
  if (!input) return '';
  let text = input;
  if (stripBrackets) text = text.replace(STAGE_DIRECTION, '');
  text = text.replace(/^\s*(HOST|NARRATOR|SPEAKER|VOICEOVER|ANNOUNCER|PRESENTER)\s*:\s*/gim, '');
  text = text.replace(/^\s*(linkedin|twitter|instagram|email_subject)\s*:?\s*$/gim, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

export interface PromptVars {
  /** The one sentence the customer typed. Was stored and never sent. */
  topic?: string;
  research?: string;
  icp?: string;
  article?: string;
  videoScript?: string;
  campaignData?: string;
  branding?: string;
}

/** Replace template placeholders dynamically. Handles the &amp; HTML entity present in the file. */
export function injectPrompt(template: string, vars: PromptVars): string {
  return template
    .replace(/\[PASTE TOPIC\]/g, vars.topic ?? '')
    .replace(/\[PASTE RESEARCH\]/g, vars.research ?? '')
    .replace(/\[PASTE ICP\]/g, vars.icp ?? '')
    .replace(/\[PASTE ARTICLE\]/g, vars.article ?? '')
    .replace(/\[PASTE VIDEO SCRIPT\]/g, vars.videoScript ?? '')
    .replace(/\[CLIENT FORM DATA &amp; SYSTEM DATA\]/g, vars.campaignData ?? '')
    .replace(/\[CLIENT FORM DATA & SYSTEM DATA\]/g, vars.campaignData ?? '')
    .replace(/\[UPLOAD LOGO \/ WEBSITE \/ BRANDING\]/g, vars.branding ?? '');
}

/** Names the customer sees, for dependency messages. */
const SECTION_LABEL: Record<SectionKey, string> = {
  research: 'Research',
  article: 'Article',
  videoScript: 'Video script',
  captions: 'Captions',
  linkedinPosts: 'LinkedIn posts',
  outboundScripts: 'Outbound scripts',
  linkedinImage: 'LinkedIn image',
  longForm: 'Long-form post',
};

const PROSE_RULES =
  'Write clean, professional, client-ready prose. Do NOT use markdown headers. Do NOT include stage directions or bracketed video instructions. Do NOT include character labels (e.g. HOST:, NARRATOR:). Avoid generic AI filler. The result must be ready to copy and use immediately.';

/** Build ICP + campaign context strings used to fill prompt placeholders. */
export async function buildContexts(
  campaignId: string,
  userId: string,
  topic?: string
): Promise<{ icpContext: string; campaignData: string }> {
  const icp = await ICPProfile.findOne({ campaignId, userId });
  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  const d: any = icp?.data || {};

  const campaignLines = [
    /*
      First line, deliberately. Only the research prompt has an explicit
      [PASTE TOPIC] slot; the other seven consume campaign data instead. Putting
      the topic at the top of that block is what carries the customer's actual
      subject into every later step rather than only the first one.
    */
    topic && `Campaign Topic: ${topic}`,
    campaign?.name && `Campaign: ${campaign.name}`,
    campaign?.description && `Campaign Description: ${campaign.description}`,
    d.contentTone && `Content Tone: ${d.contentTone}`,
    d.solution && `Solution / Product Being Sold: ${d.solution}`,
    d.additionalNotes && `Additional Notes: ${d.additionalNotes}`,
  ].filter(Boolean);

  const icpLines = [
    d.industry && `Industry: ${d.industry}`,
    d.companySize && `Company Size: ${d.companySize}`,
    d.roles?.length && `Target Roles: ${d.roles.join(', ')}`,
    d.painPoints?.length && `Pain Points: ${d.painPoints.join(', ')}`,
    d.buyingTriggers?.length && `Buying Triggers: ${d.buyingTriggers.join(', ')}`,
    d.regions?.length && `Regions: ${d.regions.join(', ')}`,
    d.messagingAngles?.length && `Messaging Angles: ${d.messagingAngles.join(', ')}`,
  ].filter(Boolean);

  const icpContext = icpLines.length ? icpLines.join('\n') : JSON.stringify(icp?.data || {});
  const campaignData = campaignLines.length ? campaignLines.join('\n') : '';
  return { icpContext, campaignData };
}

interface StepDef {
  key: SectionKey;
  field: keyof IContent;
  template: string;
  maxTokens: number;
  /*
    Sections whose output is pasted into this one's prompt.

    Without this the chain ran blind: research could fail on a transient rate
    limit and the article prompt was still sent with an empty RESEARCH block.
    All seven remaining steps then "succeeded", stored as completed, and showed
    green ticks — so the customer saw 7 of 8 done and no way to know the seven
    were written from nothing.
  */
  dependsOn?: SectionKey[];
  /** Ask for stage directions to be stripped. Only the spoken script wants it. */
  stripBrackets?: boolean;
}

/** Generation steps in the fixed order. Each maps to a content field + prompt template. */
export const STEPS: StepDef[] = [
  { key: 'research', field: 'research', template: researchPrompt, maxTokens: 2000 },
  { key: 'article', field: 'article', template: articlePrompt, maxTokens: 3000, dependsOn: ['research'] },
  {
    key: 'videoScript', field: 'script', template: videoScriptPrompt, maxTokens: 1500,
    dependsOn: ['research', 'article'], stripBrackets: true,
  },
  { key: 'captions', field: 'captionsText', template: captionPrompt, maxTokens: 1500, dependsOn: ['videoScript'] },
  /*
    4000, not 3000. This prompt asks for eight full posts, each with a week
    number, type, body copy, purpose, CTA and a visual suggestion. Three
    thousand tokens cannot hold that, so it reliably cut off around post five
    and stored the result as complete.
  */
  { key: 'linkedinPosts', field: 'linkedinPosts', template: linkedinPostPrompt, maxTokens: 4000, dependsOn: ['research', 'article'] },
  { key: 'outboundScripts', field: 'outboundScripts', template: outboundScriptPrompt, maxTokens: 3500, dependsOn: ['research', 'article'] },
  { key: 'linkedinImage', field: 'linkedinImagePrompt', template: linkdineArticalImagePrompt, maxTokens: 1500, dependsOn: ['article'] },
  { key: 'longForm', field: 'longFormPost', template: longFormPostPrompt, maxTokens: 2000, dependsOn: ['research', 'article'] },
];

/**
 * Turns an upstream failure into something a customer can act on.
 *
 * OpenAI's own message was stored and shown verbatim. That leaked our
 * organisation id in rate-limit errors, and surfaced
 * "OpenAI is not configured (missing OPENAI_API_KEY)" — our problem, presented
 * to a paying customer as theirs, with nothing they could do about it.
 *
 * The real reason is still logged for us.
 */
const customerFacingError = (err: any): string => {
  const status = err?.status ?? err?.response?.status ?? 0;
  const raw = String(err?.message || '');

  if (raw.includes('OPENAI_API_KEY') || status === 401) {
    return 'Content generation is temporarily unavailable. We have been notified — please try again shortly.';
  }
  if (status === 429) {
    return 'We hit a rate limit while generating this. Wait a moment and retry this section.';
  }
  if (status >= 500) {
    return 'The writing service was unavailable. Retry this section in a moment.';
  }
  if (/timeout|ETIMEDOUT|ECONNRESET/i.test(raw)) {
    return 'This took too long and was stopped. Retry the section.';
  }
  return 'This section could not be generated. Retry it, or change the topic if it keeps failing.';
};

/** Errors worth trying again: rate limits, timeouts and upstream 5xx. */
const isTransient = (err: any): boolean => {
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  const code = String(err?.code || '');
  return ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN'].includes(code);
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Keep the legacy on-disk files in sync for the original three sections. */
function syncFile(campaignId: string, section: SectionKey, value: string) {
  const map: Partial<Record<SectionKey, string>> = {
    research: 'research.txt',
    article: 'article.txt',
    videoScript: 'script.txt',
  };
  const fileName = map[section];
  if (!fileName) return;
  try {
    const baseDir = path.resolve(__dirname, '../../uploads/campaigns', campaignId, 'content');
    ensureDir(baseDir);
    fs.writeFileSync(path.join(baseDir, fileName), value, 'utf-8');
  } catch {
    /* non-fatal: DB is the source of truth */
  }
}

/** Build the prompt variables from the latest stored content. */
function varsFromContent(content: IContent, icpContext: string, campaignData: string): PromptVars {
  return {
    topic: content.topic || '',
    research: content.research || '',
    icp: icpContext,
    article: content.article || '',
    videoScript: content.script || '',
    campaignData,
    branding: campaignData,
  };
}

async function runStep(
  contentId: string,
  step: StepDef,
  icpContext: string,
  campaignData: string
): Promise<'completed' | 'failed'> {
  // Mark processing
  await Content.updateOne(
    { _id: contentId },
    { $set: { [`sections.${step.key}.status`]: 'processing', [`sections.${step.key}.error`]: '' } }
  );

  const content = await Content.findById(contentId);
  if (!content) return 'failed';

  const prompt = injectPrompt(step.template, varsFromContent(content, icpContext, campaignData));

  /*
    Three attempts with backoff, but only for errors that can plausibly clear.
    There was no retry at all, so a single 429 during an eight-call chain lost
    that section and — before dependencies existed — quietly poisoned the seven
    after it. A bad prompt or a missing key is not retried: it would just cost
    three times as much to fail.
  */
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: chatModel(),
        messages: [
          { role: 'system', content: PROSE_RULES },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: step.maxTokens,
      });

      const choice = completion.choices[0];
      const output = sanitizeProse(choice?.message?.content || '', step.stripBrackets);
      // "length" means the model was still writing when it ran out of room.
      const truncated = choice?.finish_reason === 'length';

      await Content.updateOne(
        { _id: contentId },
        {
          $set: {
            [step.field]: output,
            [`sections.${step.key}.status`]: 'completed',
            [`sections.${step.key}.error`]: '',
            [`sections.${step.key}.truncated`]: truncated,
          },
        }
      );
      syncFile(String(content.campaignId), step.key, output);
      return 'completed';
    } catch (err: any) {
      lastError = err;
      if (!isTransient(err) || attempt === 2) break;
      await wait(1000 * Math.pow(2, attempt));
    }
  }

  // Full detail to our logs, a usable sentence to the customer.
  console.error(`[content] ${step.key} failed:`, lastError?.message || lastError);

  await Content.updateOne(
    { _id: contentId },
    {
      $set: {
        [`sections.${step.key}.status`]: 'failed',
        [`sections.${step.key}.error`]: customerFacingError(lastError),
      },
    }
  );
  return 'failed';
}

/** Sequentially generate all sections in fixed order. Fire-and-forget. */
export async function runAllSections(contentId: string, campaignId: string, userId: string): Promise<void> {
  const seed = await Content.findById(contentId);
  const failed = new Set<SectionKey>();

  try {
    const { icpContext, campaignData } = await buildContexts(campaignId, userId, seed?.topic);

    for (const step of STEPS) {
      /*
        Refuse to run on missing input rather than generating from nothing.
        The old loop pressed on regardless, so one failed step produced seven
        confident, worthless ones that all reported success.
      */
      const missing = (step.dependsOn || []).filter((d) => failed.has(d));
      if (missing.length) {
        failed.add(step.key);
        const names = missing.map((m) => SECTION_LABEL[m] || m).join(' and ');
        await Content.updateOne(
          { _id: contentId },
          {
            $set: {
              [`sections.${step.key}.status`]: 'failed',
              [`sections.${step.key}.error`]: `Waiting on ${names}, which failed. Retry that first.`,
            },
          }
        );
        continue;
      }

      const result = await runStep(contentId, step, icpContext, campaignData);
      if (result === 'failed') failed.add(step.key);
    }
  } catch (err) {
    /*
      Only the sections that never finished. This used to mark all eight failed,
      including ones already completed — so a momentary database problem put red
      crosses on finished work and offered Retry, which charged the customer
      again to reproduce text still sitting in the database.
    */
    const current = await Content.findById(contentId);
    const unfinished = STEPS.filter(
      (s) => current?.sections?.[s.key]?.status !== 'completed'
    );
    if (unfinished.length) {
      await Content.updateOne(
        { _id: contentId },
        {
          $set: unfinished.reduce(
            (acc, s) => ({
              ...acc,
              [`sections.${s.key}.status`]: 'failed',
              [`sections.${s.key}.error`]: 'Generation stopped unexpectedly. Retry this section.',
            }),
            {}
          ),
        }
      );
    }
  }
}

/** Regenerate a single section using dependency inputs already stored. */
export async function runSingleSection(
  contentId: string,
  campaignId: string,
  userId: string,
  sectionKey: SectionKey
): Promise<void> {
  const step = STEPS.find((s) => s.key === sectionKey);
  if (!step) return;
  const content = await Content.findById(contentId);
  const { icpContext, campaignData } = await buildContexts(campaignId, userId, content?.topic);
  await runStep(contentId, step, icpContext, campaignData);
}
