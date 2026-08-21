import { IReconInsight } from '../models/ReconInsight';
import { ForbiddenError } from '../errors';

export const DEFAULT_MAX_RECON_REGENERATIONS = 5;

export interface ReconRegenerationUsage {
  used: number;
  max: number;
  remaining: number;
  limitReached: boolean;
}

/** Read regeneration counters off a recon doc, defaulting legacy docs to 0 / 5. */
export const getReconRegenerationUsage = (
  insight: Pick<IReconInsight, 'regenerationCount' | 'maxRegenerations'>
): ReconRegenerationUsage => {
  const used = insight.regenerationCount ?? 0;
  const max = insight.maxRegenerations ?? DEFAULT_MAX_RECON_REGENERATIONS;
  const remaining = Math.max(max - used, 0);
  return { used, max, remaining, limitReached: used >= max };
};

/**
 * Throws a 403 ForbiddenError when an ICP's recon insight has used all of its
 * allowed regenerations. Pass the existing insight record (regeneration case).
 */
export const assertCanRegenerateRecon = (
  insight: Pick<IReconInsight, 'regenerationCount' | 'maxRegenerations'>
): ReconRegenerationUsage => {
  const usage = getReconRegenerationUsage(insight);
  if (usage.limitReached) {
    throw new ForbiddenError('You have reached the maximum prospect research regeneration limit.');
  }
  return usage;
};
