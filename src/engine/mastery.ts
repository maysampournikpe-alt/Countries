import { Rating, State } from './scheduler';
import type { CountryProgress } from './types';

export type Level = 'new' | 'learning' | 'reviewing' | 'provisional' | 'mastered';

export const LEVEL_INFO: Record<Level, { label: string; symbol: string; color: string; description: string }> = {
  new: { label: 'Not studied', symbol: '○', color: 'var(--lvl-new)', description: 'Not introduced yet' },
  learning: { label: 'Learning', symbol: '◔', color: 'var(--lvl-learning)', description: 'Introduced, building memory' },
  reviewing: { label: 'Reviewing', symbol: '◑', color: 'var(--lvl-reviewing)', description: 'In spaced review' },
  provisional: { label: 'Provisionally mastered', symbol: '◕', color: 'var(--lvl-provisional)', description: 'Known in the diagnostic — awaiting a delayed confirmation' },
  mastered: { label: 'Mastered', symbol: '●', color: 'var(--lvl-mastered)', description: 'Recalled on separate days, including after a delay' },
};

// Mastery requires independent recall across sessions, including a delayed review:
// correct graded recall on ≥2 different days, at least one success after a gap of ≥3 days,
// the card in FSRS review state, and the most recent answer correct.
export const MASTERY_MIN_DAYS = 2;
export const MASTERY_MIN_GAP = 3;

export function isMastered(p?: CountryProgress): boolean {
  return (
    !!p?.card &&
    p.card.state === State.Review &&
    p.correctDays.length >= MASTERY_MIN_DAYS &&
    p.maxGap >= MASTERY_MIN_GAP &&
    p.lastResult === 1 &&
    p.lastRating !== Rating.Again
  );
}

export function levelOf(p?: CountryProgress): Level {
  if (!p || (!p.introduced && !p.card)) return 'new';
  if (isMastered(p)) return 'mastered';
  if (p.diag?.category === 'known' && p.lastResult !== 0) return 'provisional';
  if (p.card?.state === State.Review) return 'reviewing';
  return 'learning';
}

export const topConfusion = (p?: CountryProgress): [string, number] | undefined =>
  p ? Object.entries(p.confusions).sort((a, b) => b[1] - a[1])[0] : undefined;
