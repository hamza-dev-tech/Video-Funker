import VoiceClone from '../models/VoiceClone';

/**
 * Removes a customer's cloned voices from HeyGen.
 *
 * A cloned voice is biometric data held by a third party. Account deletion
 * removed nine local collections, missed VoiceClone entirely, and never told
 * HeyGen anything — while the confirmation modal promised the data was
 * "permanently removed".
 *
 * Best effort by design. HeyGen does not expose voice deletion on every plan,
 * and a 404 or a 403 from them must not stop a deletion the customer has
 * already confirmed through five steps and an emailed code. Failures are logged
 * so they can be finished by hand.
 */
const HEYGEN_BASE = 'https://api.heygen.com';

export async function deleteVoiceClonesOnHeygen(userId: string): Promise<number> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return 0;

  const clones = await VoiceClone.find({ userId });
  let removed = 0;

  for (const clone of clones) {
    if (!clone.heygenVoiceId) continue;
    try {
      const res = await fetch(`${HEYGEN_BASE}/v3/voices/${clone.heygenVoiceId}`, {
        method: 'DELETE',
        headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
      });
      if (res.ok) removed++;
      else {
        console.warn(
          `[voice] HeyGen refused to delete voice ${clone.heygenVoiceId} for user ${userId}: ${res.status}`
        );
      }
    } catch (err: any) {
      console.warn(
        `[voice] could not reach HeyGen to delete voice ${clone.heygenVoiceId}: ${err?.message}`
      );
    }
  }

  return removed;
}
