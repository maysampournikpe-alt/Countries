import { isMastered } from './mastery';
import { rate, Rating, ratingFor } from './scheduler';
import { dayKey, daysBetween } from './time';
import type { AnswerInput, CountryProgress } from './types';

export const emptyProgress = (): CountryProgress => ({
  introduced: false,
  attempts: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  correctDays: [],
  maxGap: 0,
  confusions: {},
  mistakesOpen: 0,
  xpDay: {},
});

export interface AnswerOutcome {
  progress: CountryProgress;
  correct: boolean;
  gradedRating?: number;
  becameMastered: boolean;
  xp: number;
}

// XP rewards genuine learning: each country can earn XP once per day per category,
// so repeating the same easy flags does not farm points.
const XP = { recall: 10, dueBonus: 5, mc: 2, mastered: 50 };

/** Pure state transition for one answer. */
export function applyAnswer(prev: CountryProgress | undefined, a: AnswerInput, now: number): AnswerOutcome {
  const p: CountryProgress = structuredClone(prev ?? emptyProgress());
  if (prev?.card) p.card = { ...prev.card, due: new Date(prev.card.due), last_review: prev.card.last_review && new Date(prev.card.last_review) };
  const today = dayKey(now);
  const correct = a.chosen === a.code;
  const wasMastered = isMastered(prev);
  const wasDue = !!p.card && p.card.due.getTime() <= now;
  let xp = 0;

  p.attempts++;
  p.lastAt = now;
  p.lastResult = correct ? 1 : 0;
  if (correct) {
    p.correct++;
    p.streak++;
    if (p.mistakesOpen > 0 && p.streak >= 2) p.mistakesOpen = 0;
  } else {
    p.wrong++;
    p.streak = 0;
    p.mistakesOpen = Math.min(p.mistakesOpen + 1, 9);
    if (a.chosen) p.confusions[a.chosen] = (p.confusions[a.chosen] ?? 0) + 1;
  }
  if (correct) p.avgMs = p.avgMs == null ? a.ms : Math.round(p.avgMs * 0.7 + a.ms * 0.3);

  let gradedRating: number | undefined;
  const gradedToday = p.lastGradedAt != null && dayKey(p.lastGradedAt) === today;
  if (a.format === 'recall' && a.graded) {
    // One graded review per card per day, except a lapse is always recorded.
    if (!gradedToday || (!correct && p.lastRating !== Rating.Again)) {
      gradedRating = ratingFor({ correct, ms: a.ms, confidence: a.confidence, avgMs: prev?.avgMs, state: p.card?.state });
      if (correct && p.lastGradedAt != null && p.lastRating !== Rating.Again) {
        const gap = daysBetween(dayKey(p.lastGradedAt), today);
        p.maxGap = Math.max(p.maxGap, gap);
      }
      p.card = rate(p.card, gradedRating as never, new Date(now));
      p.lastGradedAt = now;
      p.lastRating = gradedRating;
      p.introduced = true;
      if (correct && !p.correctDays.includes(today)) p.correctDays = [...p.correctDays, today].slice(-12);
    }
    if (correct && p.xpDay.recall !== today) {
      xp += XP.recall + (wasDue ? XP.dueBonus : 0);
      p.xpDay.recall = today;
    }
  } else if (!correct && p.card && a.format !== 'compare' && !gradedToday) {
    // A miss in any format is real evidence of forgetting.
    p.card = rate(p.card, Rating.Again, new Date(now));
    p.lastGradedAt = now;
    p.lastRating = Rating.Again;
  } else if (correct && (a.format === 'mc' || a.format === 'reverse') && p.xpDay.mc !== today) {
    xp += XP.mc;
    p.xpDay.mc = today;
  }

  const becameMastered = !wasMastered && isMastered(p);
  if (becameMastered && !p.masteredAt) {
    p.masteredAt = now;
    xp += XP.mastered;
  }
  return { progress: p, correct, gradedRating, becameMastered, xp };
}
