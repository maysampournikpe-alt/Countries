import { BY_CODE, COUNTRIES, type Country } from '../data/countries';
import { levelOf, topConfusion } from './mastery';
import { isDue, Rating } from './scheduler';
import { shuffle } from './time';
import type { CountryProgress, Settings } from './types';

type ProgressMap = Record<string, CountryProgress>;
const DAY = 86400000;

/**
 * Review priority, following the learning plan:
 *  1. flags answered incorrectly and not yet fixed (open mistakes)
 *  2. flags confused with another country
 *  3. (new flags are introduced separately in lessons)
 *  4. flags due for spaced repetition
 *  5. flags recognised slowly or uncertainly that are coming due
 * Mastered flags that are not due score 0 — no unnecessary repetition.
 */
export function reviewPriority(p: CountryProgress | undefined, now: number): number {
  if (!p?.card) return 0;
  let s = 0;
  if (p.mistakesOpen > 0) s += 100 + 10 * Math.min(p.wrong, 5);
  const conf = topConfusion(p);
  if (conf && conf[1] >= 2 && (p.mistakesOpen > 0 || p.streak < 3)) s += 30;
  if (isDue(p, now)) s += 50 + Math.min(Math.floor((now - p.card.due.getTime()) / DAY), 20);
  else if (p.lastRating === Rating.Hard && p.card.due.getTime() - now < 2 * DAY) s += 20;
  if (levelOf(p) === 'mastered' && !isDue(p, now) && s < 100) return 0;
  return s;
}

export function prioritizedReviews(progress: ProgressMap, now: number): string[] {
  return Object.entries(progress)
    .filter(([code]) => BY_CODE[code] && !BY_CODE[code].bonus)
    .map(([code, p]) => [code, reviewPriority(p, now)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => code);
}

export const dueCodes = (progress: ProgressMap, now: number) =>
  Object.keys(progress).filter((c) => BY_CODE[c] && !BY_CODE[c].bonus && isDue(progress[c], now));

export function groupSize(settings: Settings, lessonAcc?: number): number {
  if (settings.groupSize !== 'auto') return settings.groupSize;
  if (lessonAcc == null) return 5;
  if (lessonAcc >= 0.9) return 7;
  if (lessonAcc >= 0.8) return 6;
  if (lessonAcc >= 0.65) return 5;
  return 4;
}

/** Choose the next new flags: diagnostic-confused first, simpler flags early, continents interleaved, look-alikes split apart. */
export function pickNewFlags(progress: ProgressMap, n: number, rnd = Math.random): string[] {
  if (n <= 0) return [];
  const unseen = COUNTRIES.filter((c) => !progress[c.code]?.introduced && !progress[c.code]?.card);
  const rank = (c: Country) => (progress[c.code]?.diag?.category === 'confused' ? 0 : 1) * 10 + Math.min(c.similar.length, 5);
  const byCont = new Map<string, Country[]>();
  for (const c of shuffle(unseen, rnd).sort((a, b) => rank(a) - rank(b))) {
    byCont.set(c.continent, [...(byCont.get(c.continent) ?? []), c]);
  }
  const order: Country[] = [];
  const queues = [...byCont.values()];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) order.push(q.shift()!);
  // Keep the highest-priority (confused) flags in front of the round-robin.
  order.sort((a, b) => Math.floor(rank(a) / 10) - Math.floor(rank(b) / 10));

  const chosen: string[] = [];
  const deferred: string[] = [];
  for (const c of order) {
    if (chosen.length >= n) break;
    if (c.similar.some((s) => chosen.includes(s))) deferred.push(c.code);
    else chosen.push(c.code);
  }
  return [...chosen, ...deferred].slice(0, n);
}

export interface DailyPlan {
  reviews: string[];
  newCodes: string[];
  dueTotal: number;
  budget: number;
}

/** Build today's session from the chosen study time, prioritising retention over new exposure. */
export function buildDailyPlan(progress: ProgressMap, settings: Settings, lessonAcc: number | undefined, now: number, rnd = Math.random): DailyPlan {
  const budget = settings.dailyMinutes === 0 ? 120 : settings.dailyMinutes * 5; // ≈5 questions per minute
  const ranked = prioritizedReviews(progress, now);
  const dueTotal = dueCodes(progress, now).length;
  const reviews = ranked.slice(0, budget);
  const remaining = budget - reviews.length;
  const perNewFlag = 6; // intro + guided + recall + comparison + mastery check
  let n = 0;
  if (dueTotal <= budget * 0.8) n = Math.min(groupSize(settings, lessonAcc), Math.floor(remaining / perNewFlag));
  if (n > 0 && n < 3) n = reviews.length ? 0 : 3;
  const newCodes = pickNewFlags(progress, n, rnd);
  return { reviews, newCodes, dueTotal, budget };
}

/** Multiple-choice options: the correct answer plus look-alikes first, then same-continent flags. */
export function mcOptions(code: string, count: number, rnd = Math.random, pool: Country[] = COUNTRIES): string[] {
  const c = BY_CODE[code];
  const similar = shuffle(c.similar.filter((s) => pool.some((p) => p.code === s)), rnd);
  const sameCont = shuffle(pool.filter((p) => p.continent === c.continent && p.code !== code && !similar.includes(p.code)), rnd).map((p) => p.code);
  const rest = shuffle(pool.filter((p) => p.code !== code), rnd).map((p) => p.code);
  const opts = new Set<string>([code]);
  for (const x of [...similar.slice(0, Math.ceil((count - 1) / 2)), ...sameCont, ...rest]) {
    if (opts.size >= count) break;
    opts.add(x);
  }
  return shuffle([...opts], rnd);
}
