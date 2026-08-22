import OpenAI from 'openai';
import { BadRequestError } from '../errors';

/**
 * Lazy singleton OpenAI client, so a missing key costs one feature and not the
 * whole service.
 *
 * Three modules used to do `const openai = new OpenAI({ apiKey: process.env
 * .OPENAI_API_KEY })` at module scope. The constructor THROWS when the key is
 * absent, and those modules are reached from server.ts through the route
 * imports, so an unset OPENAI_API_KEY did not disable ICP generation — it
 * stopped the process from starting at all. A developer cloning this repo to
 * work on the login screen could not boot the API without someone's OpenAI
 * billing account.
 *
 * This mirrors getStripe() in services/stripe.service.ts: construct on first
 * use, and fail at the call site of the feature that actually needs it, where
 * the error can be returned to the caller as a 400 instead of a crash loop.
 */
let client: OpenAI | null = null;

/** Sent as `model` on every chat completion. */
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

export const getOpenAI = (): OpenAI => {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new BadRequestError('OpenAI is not configured (missing OPENAI_API_KEY)');
  }

  client = new OpenAI({ apiKey });
  return client;
};

/**
 * The value to send as `model`. A function rather than the constant itself so
 * the call sites keep reading `model: chatModel()` — the choice stays in one
 * place if it ever needs to vary again.
 */
export const chatModel = (): string => DEFAULT_CHAT_MODEL;
