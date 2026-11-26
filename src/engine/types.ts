import type { Card } from 'ts-fsrs';

export type Format = 'recall' | 'mc' | 'reverse' | 'compare';
export type Confidence = 'sure' | 'guess' | 'idk';
export type DiagCategory = 'known' | 'uncertain' | 'confused' | 'unfamiliar';

export interface DiagAnswer {
  answer: string | null;
  correct: boolean;
  ms: number;
  confidence: Confidence;
}

export interface CountryProgress {
  card?: Card; // FSRS card for flag → country recall
  introduced: boolean; // taught in a lesson or recognised in the diagnostic
  attempts: number;
  correct: number;
  wrong: number;
  streak: number; // consecutive correct answers (any format)
  lastResult?: 0 | 1;
  lastAt?: number;
  lastGradedAt?: number;
  lastRating?: number; // ts-fsrs Rating of the last graded recall
  correctDays: string[]; // distinct local days with a correct graded recall
  maxGap: number; // longest gap (days) between consecutive successful graded recalls
  confusions: Record<string, number>; // shown this flag, answered that country
  avgMs?: number;
  mistakesOpen: number; // >0 → appears in Mistake Crusher
  diag?: DiagAnswer & { category: DiagCategory };
  masteredAt?: number;
  xpDay: Record<string, string>; // xp category → last day xp was awarded (anti-grinding)
}

export interface AnswerInput {
  code: string; // the correct country
  chosen: string | null; // what the learner picked (null = "I don't know")
  format: Format;
  ms: number;
  graded: boolean; // counts as an independent, unassisted recall for FSRS
  mode: string;
  confidence?: Confidence;
}

export interface AnswerRecord {
  t: number;
  c: string;
  a: string | null;
  ok: 0 | 1;
  ms: number;
  f: Format;
  m: string;
}

export interface DayLog {
  answers: number;
  correct: number;
  ms: number;
  newLearned: number;
  xp: number;
  sessions: number;
  mastered: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  dailyMinutes: 5 | 10 | 15 | 20 | 30 | 0; // 0 = unlimited
  sound: boolean;
  reducedMotion: boolean;
  groupSize: 'auto' | 4 | 5 | 6 | 7;
  showBonus: boolean;
}

export interface Streak {
  current: number;
  longest: number;
  lastDay?: string;
  freezes: number;
}

export interface DiagnosticState {
  order: string[];
  answers: Record<string, DiagAnswer>;
  startedAt: number;
  completedAt?: number;
}

export interface ExamState {
  order: string[];
  answers: Record<string, { chosen: string | null; correct: boolean; ms: number }>;
  startedAt: number;
  completedAt?: number;
}

export interface Records {
  speed: Record<string, number>;
  survival: Record<string, number>;
  world?: { score: number; total: number; ms: number };
  exam?: { score: number; at: number };
  continental: Record<string, number>; // best % per continent challenge
  bonus?: number;
}

export interface PersistedState {
  version: number;
  progress: Record<string, CountryProgress>;
  bonus: Record<string, { attempts: number; correct: number }>;
  diagnostic?: DiagnosticState;
  exam?: ExamState;
  history: AnswerRecord[];
  days: Record<string, DayLog>;
  xp: number;
  achievements: Record<string, number>;
  settings: Settings;
  streak: Streak;
  records: Records;
  detective: Record<string, number>; // cleared group ids → time
  lessonAcc?: number; // moving average of first-try accuracy during lessons
  onboarded: boolean;
}
