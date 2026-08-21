import { IContent } from '../models/Content';
import { ForbiddenError } from '../errors';

export const DEFAULT_MAX_REGENERATIONS = 5;

export interface ContentRegenerationUsage {
  used: number;
  max: number;
  remaining: number;
  limitReached: boolean;
}

/** Read regeneration counters off a content doc, defaulting legacy docs to 0 / 5. */
export const getRegenerationUsage = (content: Pick<IContent, 'regenerationCount' | 'maxRegenerations'>): ContentRegenerationUsage => {
  const used = content.regenerationCount ?? 0;
  const max = content.maxRegenerations ?? DEFAULT_MAX_REGENERATIONS;
  const remaining = Math.max(max - used, 0);
  return { used, max, remaining, limitReached: used >= max };
};

/**
 * Throws a 403 ForbiddenError when a campaign's content has used all of its
 * allowed regenerations. Pass the existing content record (regeneration case).
 */
export const assertCanRegenerateContent = (
  content: Pick<IContent, 'regenerationCount' | 'maxRegenerations'>
): ContentRegenerationUsage => {
  const usage = getRegenerationUsage(content);
  if (usage.limitReached) {
    throw new ForbiddenError('You have reached the maximum regeneration limit for this campaign.');
  }
  return usage;
};
