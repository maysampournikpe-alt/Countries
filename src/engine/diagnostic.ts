import { similarTo } from '../data/similar';
import { emptyProgress } from './answer';
import { rate, ratingForDiagnostic } from './scheduler';
import { dayKey } from './time';
import type { CountryProgress, DiagAnswer, DiagCategory } from './types';

export const DIAG_FAST_MS = 10000;
export const CHECKPOINT_EVERY = 25;

export const DIAG_LABELS: Record<DiagCategory, { title: string; blurb: string }> = {
  known: { title: 'Mastered provisionally', blurb: 'Answered confidently and quickly. We will confirm these with a delayed review instead of reteaching them.' },
  uncertain: { title: 'Recognized but uncertain', blurb: 'Correct, but slow or a guess. Short spaced reviews will make these automatic.' },
  confused: { title: 'Frequently confused', blurb: 'You named a different (often look-alike) country. These are taught first with side-by-side comparisons.' },
  unfamiliar: { title: 'Completely unfamiliar', blurb: 'New flags. They will be introduced in small groups of 5–7.' },
};

export function classify(code: string, a: DiagAnswer): DiagCategory {
  if (a.correct) return a.confidence === 'sure' && a.ms <= DIAG_FAST_MS ? 'known' : 'uncertain';
  if (a.confidence === 'idk' || !a.answer) return 'unfamiliar';
  if (similarTo(code).includes(a.answer) || a.confidence === 'sure') return 'confused';
  return 'unfamiliar';
}

/** Turn diagnostic answers into starting progress so known flags are never retaught. */
export function applyDiagnostic(
  progress: Record<string, CountryProgress>,
  answers: Record<string, DiagAnswer>,
  now: number,
): Record<string, CountryProgress> {
  const out = { ...progress };
  const today = dayKey(now);
  for (const [code, a] of Object.entries(answers)) {
    const category = classify(code, a);
    const p: CountryProgress = structuredClone(out[code] ?? emptyProgress());
    if (out[code]?.card) p.card = out[code].card;
    p.diag = { ...a, category };
    p.attempts++;
    if (a.correct) {
      p.correct++;
      p.lastResult = 1;
      p.avgMs = a.ms;
    } else {
      p.wrong++;
      p.lastResult = 0;
      if (a.answer) p.confusions[a.answer] = (p.confusions[a.answer] ?? 0) + 1;
    }
    const rating = ratingForDiagnostic(category);
    if (rating && !p.card) {
      p.card = rate(undefined, rating, new Date(now));
      p.introduced = true;
      p.lastGradedAt = now;
      p.lastRating = rating;
      p.correctDays = [today];
    }
    out[code] = p;
  }
  return out;
}

export function summarize(answers: Record<string, DiagAnswer>): Record<DiagCategory, string[]> {
  const res: Record<DiagCategory, string[]> = { known: [], uncertain: [], confused: [], unfamiliar: [] };
  for (const [code, a] of Object.entries(answers)) res[classify(code, a)].push(code);
  return res;
}
