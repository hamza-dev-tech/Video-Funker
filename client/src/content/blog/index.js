import aiPresenter from './posts/ai-presenter-vs-filming-yourself';
import founderLed from './posts/founder-led-video-b2b-trust';
import linkedinRanking from './posts/linkedin-video-ranking-2026';

export { authors, defaultAuthor } from './authors';
export { categories } from './taxonomy';

/**
 * Registry order is irrelevant — everything downstream sorts by publishedAt —
 * so this stays alphabetical by filename to keep the diff clean when posts are
 * added.
 */
export const posts = [aiPresenter, founderLed, linkedinRanking];
