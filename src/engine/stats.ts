import { BY_CODE, CONTINENTS, COUNTRIES, type Continent } from '../data/countries';
import { SIMILAR_GROUPS } from '../data/similar';
import { levelOf, type Level } from './mastery';
import { dueCodes } from './planner';
import { retrievability } from './scheduler';
import { dayKey, lastNDays } from './time';
import type { PersistedState } from './types';

export function levelCounts(s: PersistedState): Record<Level, number> {
  const out: Record<Level, number> = { new: 0, learning: 0, reviewing: 0, provisional: 0, mastered: 0 };
  for (const c of COUNTRIES) out[levelOf(s.progress[c.code])]++;
  return out;
}

export function continentAccuracy(s: PersistedState): Record<Continent, { attempts: number; correct: number; pct: number | null }> {
  const out = {} as Record<Continent, { attempts: number; correct: number; pct: number | null }>;
  for (const k of CONTINENTS) {
    let attempts = 0;
    let correct = 0;
    for (const c of COUNTRIES) if (c.continent === k) {
      attempts += s.progress[c.code]?.attempts ?? 0;
      correct += s.progress[c.code]?.correct ?? 0;
    }
    out[k] = { attempts, correct, pct: attempts ? correct / attempts : null };
  }
  return out;
}

/** Most frequent confusions as unordered pairs. */
export function topConfusions(s: PersistedState, n = 8): { a: string; b: string; count: number }[] {
  const pairs = new Map<string, number>();
  for (const [code, p] of Object.entries(s.progress)) {
    if (!BY_CODE[code] || BY_CODE[code].bonus) continue;
    for (const [other, k] of Object.entries(p.confusions)) {
      if (!BY_CODE[other]) continue;
      const key = [code, other].sort().join('|');
      pairs.set(key, (pairs.get(key) ?? 0) + k);
    }
  }
  return [...pairs.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, n)
    .map(([key, count]) => {
      const [a, b] = key.split('|');
      return { a, b, count };
    });
}

/** Estimated probability of answering a random flag correctly right now (exam readiness). */
export function readiness(s: PersistedState, now: number): number {
  let sum = 0;
  for (const c of COUNTRIES) sum += retrievability(s.progress[c.code], now);
  return sum / COUNTRIES.length;
}

export function accuracyBetween(s: PersistedState, from: number, to: number): number | null {
  const h = s.history.filter((r) => r.t >= from && r.t < to);
  return h.length ? h.filter((r) => r.ok).length / h.length : null;
}

export function improvement(s: PersistedState, now: number) {
  const week = 7 * 86400000;
  const recent = accuracyBetween(s, now - week, now + 1);
  const before = accuracyBetween(s, now - 2 * week, now - week);
  const days = lastNDays(8, now);
  const masteredNow = levelCounts(s).mastered;
  const masteredWeekAgo = s.days[days[0]]?.mastered ?? 0;
  return { recent, before, masteredGain: Math.max(0, masteredNow - masteredWeekAgo) };
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  to: string;
}

export function recommend(s: PersistedState, now: number): Recommendation {
  const started = Object.keys(s.progress).length > 0;
  if (!started && !s.diagnostic) return { id: 'diagnostic', title: 'Take the diagnostic', reason: 'Find out which flags you already know so you never relearn them.', to: '/diagnostic' };
  if (s.diagnostic && !s.diagnostic.completedAt) {
    const done = Object.keys(s.diagnostic.answers).length;
    return { id: 'diagnostic', title: 'Resume the diagnostic', reason: `${done} of 195 answered — pick up where you left off.`, to: '/diagnostic' };
  }
  const due = dueCodes(s.progress, now).length;
  if (due >= 10) return { id: 'review', title: 'Daily Review', reason: `${due} flags are due. Reviewing now protects what you have learned.`, to: '/review' };
  const mistakes = COUNTRIES.filter((c) => (s.progress[c.code]?.mistakesOpen ?? 0) > 0).length;
  if (mistakes >= 6) return { id: 'mistakes', title: 'Mistake Crusher', reason: `${mistakes} flags have unresolved mistakes.`, to: '/challenges/mistakes' };
  const confusedPairs = topConfusions(s, 3).filter((p) => p.count >= 2);
  if (confusedPairs.length) return { id: 'detective', title: 'Flag Detective', reason: `You confuse ${BY_CODE[confusedPairs[0].a].name} and ${BY_CODE[confusedPairs[0].b].name}. Train the difference.`, to: '/detective' };
  const unseen = COUNTRIES.filter((c) => !s.progress[c.code]?.introduced).length;
  if (unseen > 0 || due > 0) return { id: 'learn', title: 'Smart Training', reason: due ? `${due} reviews plus new flags, tuned to your pace.` : `${unseen} flags left to learn. Next group is ready.`, to: '/learn' };
  const counts = levelCounts(s);
  if (counts.mastered < COUNTRIES.length) return { id: 'review', title: 'Keep reviewing', reason: 'Every flag has been introduced. Spaced reviews will confirm mastery over the coming days.', to: '/review' };
  return { id: 'exam', title: 'Final Mastery Exam', reason: 'All 195 mastered — prove it in the final exam.', to: '/exam' };
}

export function detectiveStatus(s: PersistedState) {
  return SIMILAR_GROUPS.map((g) => ({ g, cleared: !!s.detective[g.id] }));
}

export const todayLog = (s: PersistedState, now: number) => s.days[dayKey(now)];
