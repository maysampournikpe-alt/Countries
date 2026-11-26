import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';
import type { Confidence, CountryProgress, DiagCategory } from './types';

// FSRS (Free Spaced Repetition Scheduler). Short-term learning steps are disabled because
// FlagMaster's lessons already provide in-session repetition; FSRS handles day-level spacing.
export const scheduler = fsrs(
  generatorParameters({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true, enable_short_term: false }),
);

export { Rating, State };

export const SLOW_MS = 12000;

export function rate(card: Card | undefined, rating: Grade, now: Date): Card {
  return scheduler.next(card ?? createEmptyCard(now), now, rating).card;
}

/**
 * Map an answer to an FSRS rating. Only unassisted recall is graded.
 * Wrong / "I don't know" → Again; correct but slow or a guess → Hard;
 * correct and fast on a card already in review → Easy; otherwise Good.
 */
export function ratingFor(o: { correct: boolean; ms: number; confidence?: Confidence; avgMs?: number; state?: State }): Grade {
  if (!o.correct) return Rating.Again;
  const avg = o.avgMs ?? 6000;
  if (o.confidence === 'guess' || o.ms > Math.max(SLOW_MS, avg * 2.5)) return Rating.Hard;
  if (o.state === State.Review && o.ms < Math.min(4000, avg * 0.7)) return Rating.Easy;
  return Rating.Good;
}

export const isDue = (p: CountryProgress | undefined, now: number) => !!p?.card && p.card.due.getTime() <= now;

export function retrievability(p: CountryProgress | undefined, now: number): number {
  if (!p?.card || p.card.state === State.New) return 0;
  return scheduler.get_retrievability(p.card, new Date(now), false);
}

export function ratingForDiagnostic(category: DiagCategory): Grade | null {
  if (category === 'known') return Rating.Good;
  if (category === 'uncertain') return Rating.Hard;
  return null;
}

/** JSON turns Dates into strings; restore them on load. */
export function reviveCard(card: Card | undefined): Card | undefined {
  if (!card) return card;
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}
