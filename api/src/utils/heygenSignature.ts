import crypto from 'crypto';
import type { Request } from 'express';

/**
 * Proves a webhook really came from HeyGen.
 *
 * The endpoint had no verification of any kind. It accepted any POST from
 * anyone and acted on it, which meant a stranger who knew or guessed a video's
 * id could mark that customer's render "failed" — or mark it "ready" — on an
 * operation the customer had already paid a credit for. The Stripe webhook
 * twenty lines away in the same server does verify; this brings the two in line.
 *
 * The scheme is a hex HMAC-SHA256 of the exact bytes HeyGen sent, keyed with
 * the endpoint secret from the HeyGen dashboard. Several header names are
 * accepted because HeyGen has shipped more than one over time and the cost of
 * checking a few strings is nothing next to rejecting a legitimate callback.
 *
 * Comparison is timing-safe. A plain === leaks how much of the signature was
 * correct, which is enough to reconstruct it one byte at a time.
 */

const SIGNATURE_HEADERS = [
  'signature',
  'x-heygen-signature',
  'heygen-signature',
  'x-signature',
];

export type SignatureResult =
  | { ok: true; reason: 'verified' | 'no-secret-configured' }
  | { ok: false; reason: string };

function readSignature(req: Request): string | null {
  for (const name of SIGNATURE_HEADERS) {
    const value = req.headers[name];
    if (typeof value === 'string' && value.trim()) {
      // Some senders prefix the algorithm, e.g. "sha256=abc123".
      return value.trim().replace(/^sha256=/i, '');
    }
  }
  return null;
}

export function verifyHeygenSignature(req: Request): SignatureResult {
  const secret = process.env.HEYGEN_WEBHOOK_SECRET;

  /*
    No secret configured is not treated as a pass in production — see
    assertHeygenConfig, which refuses to start the server in that case. Allowing
    it here keeps local development and existing staging setups working while
    the secret is being added, and the boot check is what stops that leniency
    reaching customers.
  */
  if (!secret) return { ok: true, reason: 'no-secret-configured' };

  const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
  if (!raw || !raw.length) {
    return { ok: false, reason: 'raw body unavailable — cannot verify' };
  }

  const provided = readSignature(req);
  if (!provided) return { ok: false, reason: 'no signature header' };

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  // timingSafeEqual throws on a length mismatch, which is itself a mismatch.
  if (a.length !== b.length) return { ok: false, reason: 'signature mismatch' };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'signature mismatch' };

  return { ok: true, reason: 'verified' };
}

/**
 * Refuses to start when the HeyGen webhook is misconfigured in production.
 *
 * Two separate landmines, both silent at runtime:
 *
 * HEYGEN_WEBHOOK_URL unset means the callback address sent to HeyGen is the
 * literal string "undefined". Every render then depends on the customer leaving
 * the browser tab open to be noticed at all, and nothing anywhere says so.
 *
 * HEYGEN_WEBHOOK_SECRET unset means the endpoint accepts anonymous writes to
 * customer video records.
 *
 * Both fail loudly at boot rather than quietly at 3am.
 */
export function assertHeygenConfig(): void {
  const problems: string[] = [];

  if (!process.env.HEYGEN_WEBHOOK_URL) {
    problems.push(
      'HEYGEN_WEBHOOK_URL is not set — HeyGen would be sent the string "undefined" as the callback address, and no video would ever complete on its own.'
    );
  }
  if (!process.env.HEYGEN_WEBHOOK_SECRET) {
    problems.push(
      'HEYGEN_WEBHOOK_SECRET is not set — the webhook cannot verify that a callback really came from HeyGen.'
    );
  }

  if (!problems.length) return;

  const message = ['HeyGen webhook configuration problem:', ...problems.map((p) => `  - ${p}`)].join('\n');

  if (process.env.NODE_ENV === 'production') {
    console.error(message);
    throw new Error('Refusing to start: ' + problems.join(' '));
  }

  console.warn(message + '\n  (development mode — continuing anyway)');
}
