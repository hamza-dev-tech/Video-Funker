import OpenAI, { AzureOpenAI } from 'openai';
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

/** Sent as `model` on every chat completion when nothing overrides it. */
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

/**
 * Azure pins the request/response shape to a dated API version. This is the GA
 * version covering the chat-completions shape used here; a URL carrying its own
 * ?api-version= wins over it, and AZURE_OPENAI_API_VERSION wins over both.
 */
const DEFAULT_AZURE_API_VERSION = '2024-10-21';

const azureKey = (): string | undefined =>
  process.env.AZURE_API_KEY || process.env.AZURE_OPENAI_API_KEY;

const azureUrl = (): string | undefined =>
  process.env.AZURE_BASE_URL || process.env.AZURE_OPENAI_ENDPOINT;

/**
 * Azure is opt-in and all-or-nothing: without BOTH the key and the URL we stay
 * on api.openai.com. A half-filled Azure block would otherwise produce a client
 * pointed at an undefined host, which fails far from the missing value.
 */
const azureConfigured = (): boolean => Boolean(azureKey() && azureUrl());

/**
 * Azure hands out the URL in three shapes:
 *
 *   https://<resource>.services.ai.azure.com/openai/v1
 *     AI Foundry's OpenAI-COMPATIBLE surface. Same wire format as
 *     api.openai.com, so the PLAIN client handles it. AzureOpenAI must not be
 *     used here: it would append /deployments/{model} and ?api-version=, and
 *     this endpoint accepts neither.
 *
 *   https://<resource>.openai.azure.com
 *     the resource root -> `endpoint`, and the SDK appends /openai and
 *     /deployments/{model} itself.
 *
 *   https://<resource>.openai.azure.com/openai/deployments/<name>
 *     a full target URI -> `baseURL`, used as-is. The SDK skips appending
 *     /deployments when the URL already contains it, so the deployment is
 *     already pinned and `model` no longer selects it.
 *
 * Any ?api-version= is lifted out: it belongs in the client's default query,
 * and leaving it on the path would send it twice.
 */
const parseAzureUrl = (
  raw: string,
): { baseURL?: string; endpoint?: string; apiVersion?: string; openAiCompatibleURL?: string } => {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new BadRequestError(`AZURE_BASE_URL is not a valid URL: ${raw}`);
  }

  const apiVersion = url.searchParams.get('api-version') || undefined;
  url.search = '';
  const clean = url.toString().replace(/\/+$/, '');

  if (/\/openai\/v1$/.test(url.pathname)) return { openAiCompatibleURL: clean };

  return /\/openai(\/|$)/.test(url.pathname)
    ? { baseURL: clean, apiVersion }
    : { endpoint: clean, apiVersion };
};

export const getOpenAI = (): OpenAI => {
  if (client) return client;

  if (azureConfigured()) {
    const { baseURL, endpoint, apiVersion, openAiCompatibleURL } = parseAzureUrl(azureUrl()!);

    if (openAiCompatibleURL) {
      client = new OpenAI({ apiKey: azureKey()!, baseURL: openAiCompatibleURL });
      return client;
    }

    client = new AzureOpenAI({
      apiKey: azureKey()!,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || apiVersion || DEFAULT_AZURE_API_VERSION,
      ...(baseURL ? { baseURL } : { endpoint }),
    });
    return client;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new BadRequestError('OpenAI is not configured (missing OPENAI_API_KEY)');
  }
  client = new OpenAI({ apiKey });
  return client;
};

/**
 * The value to send as `model`.
 *
 * On Azure this is not a model name but the DEPLOYMENT name — the label chosen
 * in the Azure portal, which becomes the URL segment. It often matches the
 * model it serves, so the model name stays the default. Ignored when
 * AZURE_BASE_URL already names a deployment.
 */
export const chatModel = (): string =>
  azureConfigured()
    ? process.env.AZURE_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT || DEFAULT_CHAT_MODEL
    : DEFAULT_CHAT_MODEL;
