import { COUNTRIES, CONTINENTS, type Continent } from '../data/countries';
import { SIMILAR_GROUPS } from '../data/similar';
import { levelOf } from './mastery';
import { dayKey, daysBetween } from './time';
import type { PersistedState, Streak } from './types';

// ---------- levels ----------
export const xpForLevel = (level: number) => 50 * level * (level - 1); // L1 = 0, L2 = 100, L3 = 300 …
export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - base, span: next - base, pct: (xp - base) / (next - base) };
}

// ---------- streaks (breaks are not punished: missed days consume earned freezes first) ----------
export function updateStreak(s: Streak, now: number): Streak {
  const today = dayKey(now);
  if (s.lastDay === today) return s;
  let current = 1;
  let freezes = s.freezes;
  if (s.lastDay) {
    const gap = daysBetween(s.lastDay, today);
    if (gap === 1) current = s.current + 1;
    else if (gap > 1 && gap - 1 <= freezes) {
      freezes -= gap - 1;
      current = s.current + 1;
    }
  }
  if (current > 0 && current % 7 === 0) freezes = Math.min(2, freezes + 1);
  return { current, longest: Math.max(s.longest, current), lastDay: today, freezes };
}

/** The streak as it should be displayed today (it may have lapsed). */
export function displayStreak(s: Streak, now: number): number {
  if (!s.lastDay) return 0;
  const gap = daysBetween(s.lastDay, dayKey(now));
  return gap <= 1 + s.freezes ? s.current : 0;
}

// ---------- mastery helpers ----------
export function masteredCount(state: Pick<PersistedState, 'progress'>, continent?: Continent) {
  return COUNTRIES.filter((c) => (!continent || c.continent === continent) && levelOf(state.progress[c.code]) === 'mastered').length;
}

export type Trophy = 'none' | 'bronze' | 'silver' | 'gold';
export function continentTrophy(state: Pick<PersistedState, 'progress'>, k: Continent): { trophy: Trophy; mastered: number; total: number } {
  const total = COUNTRIES.filter((c) => c.continent === k).length;
  const mastered = masteredCount(state, k);
  const pct = mastered / total;
  return { trophy: pct >= 1 ? 'gold' : pct >= 0.6 ? 'silver' : pct >= 0.25 ? 'bronze' : 'none', mastered, total };
}

// ---------- achievements ----------
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: (s: PersistedState) => [number, number];
}

const mastered = (n: number) => (s: PersistedState): [number, number] => [Math.min(masteredCount(s), n), n];
const contMaster = (k: Continent) => (s: PersistedState): [number, number] => {
  const t = continentTrophy(s, k);
  return [t.mastered, t.total];
};
const learnedCount = (s: PersistedState) => COUNTRIES.filter((c) => s.progress[c.code]?.introduced).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'diagnostic', title: 'Know Thyself', description: 'Complete the diagnostic assessment', icon: '🧭', progress: (s) => [s.diagnostic?.completedAt ? 1 : 0, 1] },
  { id: 'first-lesson', title: 'First Steps', description: 'Complete your first learning session', icon: '👣', progress: (s) => [Object.values(s.days).some((d) => d.newLearned > 0) ? 1 : 0, 1] },
  { id: 'learn-10', title: 'First 10 Flags', description: 'Learn 10 flags', icon: '🏳️', progress: (s) => [Math.min(learnedCount(s), 10), 10] },
  { id: 'm10', title: 'Ten Mastered', description: 'Master 10 flags (confirmed on separate days)', icon: '⭐', progress: mastered(10) },
  { id: 'm25', title: '25 Flags Mastered', description: 'Master 25 flags', icon: '🌟', progress: mastered(25) },
  { id: 'm50', title: 'Half Century', description: 'Master 50 flags', icon: '💫', progress: mastered(50) },
  { id: 'halfway', title: 'Halfway Around the World', description: 'Master 98 flags — half of all 195', icon: '🌍', progress: mastered(98) },
  { id: 'm100', title: '100 Flags Mastered', description: 'Master 100 flags', icon: '💯', progress: mastered(100) },
  { id: 'm150', title: 'Globetrotter', description: 'Master 150 flags', icon: '✈️', progress: mastered(150) },
  { id: 'world', title: 'World Champion: 195/195', description: 'Master every national flag', icon: '🏆', progress: mastered(195) },
  ...CONTINENTS.map((k) => ({ id: `cont-${k}`, title: `Master of ${k}`, description: `Master every flag of ${k}`, icon: '🗺️', progress: contMaster(k) })),
  { id: 'detective', title: 'Flag Detective', description: 'Clear a look-alike group in Flag Detective', icon: '🔍', progress: (s) => [Math.min(Object.keys(s.detective).length, 1), 1] },
  { id: 'detective-10', title: 'Sharp Eye', description: 'Clear 10 look-alike groups', icon: '🦅', progress: (s) => [Math.min(Object.keys(s.detective).length, 10), 10] },
  { id: 'detective-all', title: 'Master Detective', description: 'Clear every look-alike group', icon: '🕵️', progress: (s) => [Object.keys(s.detective).length, SIMILAR_GROUPS.length] },
  { id: 'streak-3', title: 'Habit Forming', description: 'Study 3 days in a row', icon: '🔥', progress: (s) => [Math.min(s.streak.longest, 3), 3] },
  { id: 'streak-7', title: 'One Week Strong', description: 'Study 7 days in a row', icon: '📅', progress: (s) => [Math.min(s.streak.longest, 7), 7] },
  { id: 'streak-30', title: 'Monthly Devotion', description: 'Study 30 days in a row', icon: '🗓️', progress: (s) => [Math.min(s.streak.longest, 30), 30] },
  { id: 'speed-15', title: 'Quick Eye', description: 'Score 15 in a 60-second Speed Challenge', icon: '⚡', progress: (s) => [Math.min(Math.max(0, ...Object.entries(s.records.speed).filter(([k]) => k.startsWith('60')).map(([, v]) => v)), 15), 15] },
  { id: 'survival-25', title: 'Survivor', description: 'Reach a streak of 25 in Survival Mode', icon: '🛡️', progress: (s) => [Math.min(Math.max(0, ...Object.values(s.records.survival)), 25), 25] },
  { id: 'exam', title: 'Road to 195 Complete', description: 'Score 195/195 on the Final Mastery Exam', icon: '🎓', progress: (s) => [s.records.exam?.score ?? 0, 195] },
  { id: 'comeback', title: 'Welcome Back', description: 'Return after a break of 7+ days and finish a session', icon: '🤝', progress: (s) => [s.achievements.comeback ? 1 : 0, 1] },
];

export function newlyUnlocked(s: PersistedState): string[] {
  return ACHIEVEMENTS.filter((a) => !s.achievements[a.id]).filter((a) => {
    const [n, t] = a.progress(s);
    return n >= t;
  }).map((a) => a.id);
}
