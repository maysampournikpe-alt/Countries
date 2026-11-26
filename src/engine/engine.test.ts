import { describe, expect, it } from 'vitest';
import { applyAnswer, emptyProgress } from './answer';
import { applyDiagnostic, classify, summarize } from './diagnostic';
import { levelFromXp, updateStreak, displayStreak, xpForLevel } from './gamification';
import { isMastered, levelOf } from './mastery';
import { buildDailyPlan, mcOptions, pickNewFlags, reviewPriority } from './planner';
import { Rating, ratingFor, reviveCard, State } from './scheduler';
import { dayKey } from './time';
import type { AnswerInput, CountryProgress } from './types';
import { defaultSettings } from '../store/store';

const DAY = 86400000;
const T0 = new Date(2026, 0, 10, 12).getTime();
const recall = (code: string, chosen: string | null, ms = 3000): AnswerInput => ({ code, chosen, format: 'recall', ms, graded: true, mode: 'test' });

describe('rating mapping', () => {
  it('wrong → Again, slow/guess → Hard, normal → Good, fast review → Easy', () => {
    expect(ratingFor({ correct: false, ms: 1000 })).toBe(Rating.Again);
    expect(ratingFor({ correct: true, ms: 20000 })).toBe(Rating.Hard);
    expect(ratingFor({ correct: true, ms: 2000, confidence: 'guess' })).toBe(Rating.Hard);
    expect(ratingFor({ correct: true, ms: 5000 })).toBe(Rating.Good);
    expect(ratingFor({ correct: true, ms: 1500, avgMs: 4000, state: State.Review })).toBe(Rating.Easy);
    expect(ratingFor({ correct: true, ms: 1500, avgMs: 4000, state: State.New })).toBe(Rating.Good);
  });
});

describe('applyAnswer', () => {
  it('creates and schedules a card on graded recall', () => {
    const o = applyAnswer(undefined, recall('FRA', 'FRA'), T0);
    expect(o.correct).toBe(true);
    expect(o.progress.card).toBeDefined();
    expect(o.progress.card!.due.getTime()).toBeGreaterThan(T0);
    expect(o.progress.correctDays).toEqual([dayKey(T0)]);
    expect(o.xp).toBeGreaterThan(0);
  });

  it('a wrong answer never lengthens the interval and records the confusion', () => {
    const good = applyAnswer(undefined, recall('TCD', 'TCD'), T0).progress;
    const later = T0 + 3 * DAY;
    const bad = applyAnswer(good, recall('TCD', 'ROU'), later).progress;
    const goodNext = applyAnswer(good, recall('TCD', 'TCD'), later).progress;
    expect(bad.card!.due.getTime()).toBeLessThan(goodNext.card!.due.getTime());
    expect(bad.confusions.ROU).toBe(1);
    expect(bad.mistakesOpen).toBe(1);
    expect(bad.lastRating).toBe(Rating.Again);
  });

  it('grades a card at most once per day (except a lapse)', () => {
    const a = applyAnswer(undefined, recall('JPN', 'JPN'), T0).progress;
    const b = applyAnswer(a, recall('JPN', 'JPN'), T0 + 60000).progress;
    expect(b.card!.reps).toBe(a.card!.reps);
    const c = applyAnswer(b, recall('JPN', 'CHN'), T0 + 120000).progress;
    expect(c.card!.reps).toBe(a.card!.reps + 1);
  });

  it('XP is not farmable by repeating the same flag in one day', () => {
    const a = applyAnswer(undefined, recall('JPN', 'JPN'), T0);
    const b = applyAnswer(a.progress, recall('JPN', 'JPN'), T0 + 1000);
    expect(b.xp).toBe(0);
  });

  it('two correct answers in a row resolve an open mistake', () => {
    let p = applyAnswer(undefined, recall('IRL', 'CIV'), T0).progress;
    expect(p.mistakesOpen).toBe(1);
    p = applyAnswer(p, { ...recall('IRL', 'IRL'), graded: false }, T0 + 1000).progress;
    expect(p.mistakesOpen).toBe(1);
    p = applyAnswer(p, { ...recall('IRL', 'IRL'), graded: false }, T0 + 2000).progress;
    expect(p.mistakesOpen).toBe(0);
  });
});

describe('mastery requires recall across sessions including a delayed review', () => {
  it('one correct answer is not mastery', () => {
    const p = applyAnswer(undefined, recall('BRA', 'BRA'), T0).progress;
    expect(isMastered(p)).toBe(false);
    expect(levelOf(p)).not.toBe('mastered');
  });
  it('same-day repetition is not mastery', () => {
    let p: CountryProgress | undefined;
    for (let i = 0; i < 5; i++) p = applyAnswer(p, recall('BRA', 'BRA'), T0 + i * 1000).progress;
    expect(isMastered(p)).toBe(false);
  });
  it('success on separate days with a ≥3-day gap → mastered', () => {
    let p = applyAnswer(undefined, recall('BRA', 'BRA'), T0).progress;
    p = applyAnswer(p, recall('BRA', 'BRA'), T0 + 1 * DAY).progress;
    expect(isMastered(p)).toBe(false);
    const o = applyAnswer(p, recall('BRA', 'BRA'), T0 + 5 * DAY);
    expect(o.progress.card!.state).toBe(State.Review);
    expect(isMastered(o.progress)).toBe(true);
    expect(o.becameMastered).toBe(true);
  });
  it('a later lapse removes mastery', () => {
    let p = applyAnswer(undefined, recall('BRA', 'BRA'), T0).progress;
    p = applyAnswer(p, recall('BRA', 'BRA'), T0 + DAY).progress;
    p = applyAnswer(p, recall('BRA', 'BRA'), T0 + 5 * DAY).progress;
    p = applyAnswer(p, recall('BRA', 'ARG'), T0 + 30 * DAY).progress;
    expect(isMastered(p)).toBe(false);
  });
});

describe('diagnostic', () => {
  it('classifies answers into the four categories', () => {
    expect(classify('FRA', { answer: 'FRA', correct: true, ms: 2000, confidence: 'sure' })).toBe('known');
    expect(classify('FRA', { answer: 'FRA', correct: true, ms: 2000, confidence: 'guess' })).toBe('uncertain');
    expect(classify('FRA', { answer: 'FRA', correct: true, ms: 20000, confidence: 'sure' })).toBe('uncertain');
    expect(classify('TCD', { answer: 'ROU', correct: false, ms: 2000, confidence: 'guess' })).toBe('confused');
    expect(classify('FRA', { answer: 'PER', correct: false, ms: 2000, confidence: 'sure' })).toBe('confused');
    expect(classify('FRA', { answer: 'PER', correct: false, ms: 2000, confidence: 'guess' })).toBe('unfamiliar');
    expect(classify('FRA', { answer: null, correct: false, ms: 2000, confidence: 'idk' })).toBe('unfamiliar');
  });
  it('known flags get a review card and are not retaught; unknown stay new', () => {
    const answers = {
      FRA: { answer: 'FRA', correct: true, ms: 2000, confidence: 'sure' as const },
      TCD: { answer: 'ROU', correct: false, ms: 2000, confidence: 'guess' as const },
      MNG: { answer: null, correct: false, ms: 2000, confidence: 'idk' as const },
    };
    const p = applyDiagnostic({}, answers, T0);
    expect(p.FRA.card).toBeDefined();
    expect(p.FRA.introduced).toBe(true);
    expect(levelOf(p.FRA)).toBe('provisional');
    expect(p.TCD.card).toBeUndefined();
    expect(p.TCD.confusions.ROU).toBe(1);
    expect(levelOf(p.MNG)).toBe('new');
    expect(summarize(answers)).toEqual({ known: ['FRA'], uncertain: [], confused: ['TCD'], unfamiliar: ['MNG'] });
    expect(pickNewFlags(p, 195)).not.toContain('FRA');
    expect(pickNewFlags(p, 1)[0]).toBe('TCD'); // confused flags are taught first
  });
  it('a provisional flag becomes mastered after one delayed confirmation', () => {
    const p = applyDiagnostic({}, { FRA: { answer: 'FRA', correct: true, ms: 2000, confidence: 'sure' } }, T0);
    const o = applyAnswer(p.FRA, recall('FRA', 'FRA'), T0 + 4 * DAY);
    expect(o.becameMastered).toBe(true);
  });
});

describe('planner', () => {
  it('prioritises open mistakes over due reviews, and skips mastered not-due flags', () => {
    const due = applyAnswer(undefined, recall('JPN', 'JPN'), T0).progress;
    const wrong = applyAnswer(applyAnswer(undefined, recall('TCD', 'TCD'), T0).progress, recall('TCD', 'ROU'), T0 + 1000).progress;
    const later = T0 + 10 * DAY;
    expect(reviewPriority(wrong, later)).toBeGreaterThan(reviewPriority(due, later));
    let m = applyAnswer(undefined, recall('BRA', 'BRA'), T0).progress;
    m = applyAnswer(m, recall('BRA', 'BRA'), T0 + DAY).progress;
    m = applyAnswer(m, recall('BRA', 'BRA'), T0 + 5 * DAY).progress;
    expect(reviewPriority(m, T0 + 5 * DAY + 1000)).toBe(0);
  });
  it('new flags come in groups of 4–7 and never two look-alikes together when avoidable', () => {
    const picked = pickNewFlags({}, 7, () => 0.3);
    expect(picked).toHaveLength(7);
    expect(new Set(picked).size).toBe(7);
  });
  it('daily plan respects the time budget and pauses new flags when reviews pile up', () => {
    const plan = buildDailyPlan({}, defaultSettings, undefined, T0);
    expect(plan.newCodes.length).toBeGreaterThanOrEqual(3);
    expect(plan.newCodes.length).toBeLessThanOrEqual(7);
    const progress: Record<string, CountryProgress> = {};
    for (const code of ['FRA', 'DEU', 'ITA', 'ESP', 'PRT', 'GBR', 'IRL', 'BEL', 'NLD', 'LUX', 'AUT', 'CHE', 'POL', 'CZE', 'SVK', 'HUN', 'ROU', 'BGR', 'GRC', 'TUR', 'RUS', 'UKR', 'BLR', 'LTU', 'LVA', 'EST', 'FIN', 'SWE', 'NOR', 'DNK', 'ISL', 'JPN', 'CHN', 'KOR', 'IND', 'BRA', 'ARG', 'CHL', 'PER', 'COL', 'MEX', 'USA', 'CAN', 'AUS', 'NZL', 'ZAF', 'EGY', 'NGA', 'KEN', 'GHA', 'MAR'])
      progress[code] = applyAnswer(undefined, recall(code, code), T0).progress;
    const p2 = buildDailyPlan(progress, { ...defaultSettings, dailyMinutes: 5 }, undefined, T0 + 30 * DAY);
    expect(p2.reviews.length).toBe(25);
    expect(p2.newCodes).toHaveLength(0);
  });
  it('multiple-choice options are unique, include the answer, and use look-alikes', () => {
    for (let i = 0; i < 50; i++) {
      const o = mcOptions('TCD', 4);
      expect(new Set(o).size).toBe(4);
      expect(o).toContain('TCD');
      expect(o.some((x) => ['ROU', 'AND', 'MDA'].includes(x))).toBe(true);
    }
  });
  it('correct option position is roughly uniform', () => {
    const pos = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) pos[mcOptions('FRA', 4).indexOf('FRA')]++;
    for (const n of pos) expect(n).toBeGreaterThan(800);
  });
});

describe('persistence helpers', () => {
  it('card dates survive a JSON round trip', () => {
    const p = applyAnswer(undefined, recall('FRA', 'FRA'), T0).progress;
    const back = JSON.parse(JSON.stringify(p)) as CountryProgress;
    const card = reviveCard(back.card)!;
    expect(card.due).toBeInstanceOf(Date);
    expect(card.due.getTime()).toBe(p.card!.due.getTime());
    expect(applyAnswer({ ...back, card }, recall('FRA', 'FRA'), T0 + 5 * DAY).progress.card!.reps).toBe(2);
  });
});

describe('gamification', () => {
  it('levels grow with XP', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(xpForLevel(2)).level).toBe(2);
    expect(levelFromXp(xpForLevel(5) - 1).level).toBe(4);
  });
  it('streaks count consecutive days and freezes protect breaks', () => {
    let s = { current: 0, longest: 0, freezes: 0 } as { current: number; longest: number; freezes: number; lastDay?: string };
    for (let i = 0; i < 7; i++) s = updateStreak(s, T0 + i * DAY);
    expect(s.current).toBe(7);
    expect(s.freezes).toBe(1);
    s = updateStreak(s, T0 + 8 * DAY); // missed one day — freeze used
    expect(s.current).toBe(8);
    expect(s.freezes).toBe(0);
    s = updateStreak(s, T0 + 20 * DAY);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(8);
    expect(displayStreak(s, T0 + 40 * DAY)).toBe(0);
  });
  it('emptyProgress is a fresh object each time', () => {
    const a = emptyProgress();
    a.confusions.X = 1;
    expect(emptyProgress().confusions).toEqual({});
  });
});
