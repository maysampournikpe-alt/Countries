import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { BY_CODE, COUNTRIES } from '../data/countries';
import { applyAnswer, emptyProgress } from '../engine/answer';
import { applyDiagnostic } from '../engine/diagnostic';
import { ACHIEVEMENTS, levelFromXp, newlyUnlocked, updateStreak } from '../engine/gamification';
import { isMastered, levelOf } from '../engine/mastery';
import { reviveCard } from '../engine/scheduler';
import { dayKey, daysBetween } from '../engine/time';
import type { AnswerInput, DayLog, DiagAnswer, PersistedState, Settings } from '../engine/types';

export const STORAGE_KEY = 'flagmaster-v1';
export const SCHEMA_VERSION = 1;
const HISTORY_CAP = 4000;

export const defaultSettings: Settings = { theme: 'system', dailyMinutes: 10, sound: false, reducedMotion: false, groupSize: 'auto', showBonus: true };

export const initialState = (): PersistedState => ({
  version: SCHEMA_VERSION,
  progress: {},
  bonus: {},
  history: [],
  days: {},
  xp: 0,
  achievements: {},
  settings: { ...defaultSettings },
  streak: { current: 0, longest: 0, freezes: 0 },
  records: { speed: {}, survival: {}, continental: {} },
  detective: {},
  onboarded: false,
});

export interface Toast {
  id: number;
  kind: 'achievement' | 'level' | 'mastered' | 'info';
  title: string;
  body?: string;
  icon?: string;
}

interface Ephemeral {
  toasts: Toast[];
  pushToast(t: Omit<Toast, 'id'>): void;
  dismissToast(id: number): void;
}

export interface AnswerResult {
  correct: boolean;
  xp: number;
  becameMastered: boolean;
}

interface Actions {
  recordAnswer(a: AnswerInput): AnswerResult;
  recordBonus(code: string, correct: boolean): void;
  completeSession(o: { newLearned?: string[]; lessonAccuracy?: number }): void;
  startDiagnostic(order: string[]): void;
  answerDiagnostic(code: string, a: DiagAnswer): void;
  finishDiagnostic(): void;
  discardDiagnostic(): void;
  startExam(order: string[]): void;
  answerExam(code: string, chosen: string | null, ms: number): void;
  finishExam(): void;
  discardExam(): void;
  setRecord(kind: 'speed' | 'survival' | 'continental', key: string, value: number): boolean;
  setWorldRecord(score: number, total: number, ms: number): boolean;
  clearDetective(groupId: string): void;
  setSettings(s: Partial<Settings>): void;
  setOnboarded(): void;
  importData(json: string): void;
  resetAll(): void;
}

export type Store = PersistedState & Ephemeral & Actions;

// ---------- storage: corrupted data is backed up, never silently wiped ----------
const storage: PersistStorage<PersistedState> = {
  getItem(name) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(name);
      if (!raw) return null;
      return JSON.parse(raw) as StorageValue<PersistedState>;
    } catch {
      try {
        if (raw) localStorage.setItem(`${name}-corrupt-backup-${Date.now()}`, raw);
      } catch { /* storage full or blocked */ }
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (e) {
      console.warn('FlagMaster: could not save progress', e);
    }
  },
  removeItem(name) {
    try { localStorage.removeItem(name); } catch { /* ignore */ }
  },
};

function revive(s: PersistedState): PersistedState {
  const progress: PersistedState['progress'] = {};
  for (const [code, p] of Object.entries(s.progress ?? {})) progress[code] = { ...emptyProgress(), ...p, card: reviveCard(p.card) };
  const base = initialState();
  return {
    ...base,
    ...s,
    progress,
    settings: { ...base.settings, ...s.settings },
    records: { ...base.records, ...s.records },
    streak: { ...base.streak, ...s.streak },
  };
}

export function validateImport(data: unknown): PersistedState {
  const d = (data as { state?: unknown })?.state ?? data;
  if (!d || typeof d !== 'object') throw new Error('Not a FlagMaster backup file.');
  const s = d as PersistedState;
  if (typeof s.progress !== 'object' || s.progress === null) throw new Error('Backup is missing progress data.');
  for (const code of Object.keys(s.progress)) if (!BY_CODE[code]) throw new Error(`Unknown country code in backup: ${code}`);
  return revive(s);
}

const emptyDay = (): DayLog => ({ answers: 0, correct: 0, ms: 0, newLearned: 0, xp: 0, sessions: 0, mastered: 0 });
let toastId = 1;

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // XP, level-ups, achievements and day log — shared by every action that earns progress.
      const award = (s: PersistedState, xp: number, now: number, extra?: Partial<DayLog>): PersistedState => {
        const today = dayKey(now);
        const day = { ...emptyDay(), ...s.days[today] };
        day.xp += xp;
        Object.assign(day, extra);
        day.mastered = COUNTRIES.filter((c) => isMastered(s.progress[c.code])).length;
        const before = levelFromXp(s.xp).level;
        const next: PersistedState = { ...s, xp: s.xp + xp, days: { ...s.days, [today]: day }, streak: updateStreak(s.streak, now) };
        const unlocked = newlyUnlocked(next);
        if (unlocked.length) next.achievements = { ...next.achievements, ...Object.fromEntries(unlocked.map((id) => [id, now])) };
        const after = levelFromXp(next.xp).level;
        queueMicrotask(() => {
          for (const id of unlocked) {
            const a = ACHIEVEMENTS.find((x) => x.id === id)!;
            get().pushToast({ kind: 'achievement', title: a.title, body: a.description, icon: a.icon });
          }
          if (after > before) get().pushToast({ kind: 'level', title: `Level ${after}!`, body: 'Your knowledge keeps growing.', icon: '⬆️' });
        });
        return next;
      };

      return {
        ...initialState(),
        toasts: [],
        pushToast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id: toastId++ }] })),
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

        recordAnswer(a) {
          const now = Date.now();
          const s = get();
          const out = applyAnswer(s.progress[a.code], a, now);
          const progress = { ...s.progress, [a.code]: out.progress };
          const today = dayKey(now);
          const day = { ...emptyDay(), ...s.days[today] };
          day.answers++;
          day.correct += out.correct ? 1 : 0;
          day.ms += Math.min(a.ms, 30000) + 2000;
          const history = [...s.history, { t: now, c: a.code, a: a.chosen, ok: (out.correct ? 1 : 0) as 0 | 1, ms: a.ms, f: a.format, m: a.mode }].slice(-HISTORY_CAP);
          const next = award({ ...s, progress, history, days: { ...s.days, [today]: day } }, out.xp, now);
          set(next);
          if (out.becameMastered) get().pushToast({ kind: 'mastered', title: `${BY_CODE[a.code].name} mastered`, body: 'Confirmed across separate days.', icon: '●' });
          return { correct: out.correct, xp: out.xp, becameMastered: out.becameMastered };
        },

        recordBonus(code, correct) {
          set((s) => {
            const b = s.bonus[code] ?? { attempts: 0, correct: 0 };
            return { bonus: { ...s.bonus, [code]: { attempts: b.attempts + 1, correct: b.correct + (correct ? 1 : 0) } } };
          });
        },

        completeSession({ newLearned = [], lessonAccuracy }) {
          const now = Date.now();
          const s = get();
          const progress = { ...s.progress };
          for (const code of newLearned) progress[code] = { ...(progress[code] ?? emptyProgress()), introduced: true };
          const today = dayKey(now);
          const prevDay = s.streak.lastDay;
          const day = { ...emptyDay(), ...s.days[today] };
          const lessonAcc = lessonAccuracy == null ? s.lessonAcc : s.lessonAcc == null ? lessonAccuracy : s.lessonAcc * 0.6 + lessonAccuracy * 0.4;
          let next = award({ ...s, progress, lessonAcc }, newLearned.length * 5, now, { newLearned: day.newLearned + newLearned.length, sessions: day.sessions + 1 });
          if (prevDay && daysBetween(prevDay, today) >= 7 && !next.achievements.comeback) {
            next = { ...next, achievements: { ...next.achievements, comeback: now } };
            queueMicrotask(() => get().pushToast({ kind: 'achievement', title: 'Welcome Back', body: 'Breaks are part of learning. Your progress was waiting for you.', icon: '🤝' }));
          }
          set(next);
        },

        startDiagnostic: (order) => set({ diagnostic: { order, answers: {}, startedAt: Date.now() } }),
        answerDiagnostic: (code, a) => set((s) => (s.diagnostic ? { diagnostic: { ...s.diagnostic, answers: { ...s.diagnostic.answers, [code]: a } } } : {})),
        finishDiagnostic() {
          const now = Date.now();
          const s = get();
          if (!s.diagnostic) return;
          const progress = applyDiagnostic(s.progress, s.diagnostic.answers, now);
          const base = { ...s, progress, diagnostic: { ...s.diagnostic, completedAt: now } };
          set(award(base, 100, now, { sessions: (s.days[dayKey(now)]?.sessions ?? 0) + 1 }));
        },
        discardDiagnostic: () => set({ diagnostic: undefined }),

        startExam: (order) => set({ exam: { order, answers: {}, startedAt: Date.now() } }),
        answerExam: (code, chosen, ms) =>
          set((s) => (s.exam ? { exam: { ...s.exam, answers: { ...s.exam.answers, [code]: { chosen, correct: chosen === code, ms } } } } : {})),
        finishExam() {
          const now = Date.now();
          const s = get();
          if (!s.exam) return;
          // Exam answers are real, unassisted recall: feed them to the scheduler.
          for (const [code, a] of Object.entries(s.exam.answers)) get().recordAnswer({ code, chosen: a.chosen, format: 'recall', ms: a.ms, graded: true, mode: 'exam' });
          const score = Object.values(s.exam.answers).filter((a) => a.correct).length;
          const after = get();
          const best = after.records.exam?.score ?? -1;
          set({
            exam: { ...after.exam!, completedAt: now },
            records: score > best ? { ...after.records, exam: { score, at: now } } : after.records,
          });
          set(award(get(), 0, now));
        },
        discardExam: () => set({ exam: undefined }),

        setRecord(kind, key, value) {
          const cur = get().records[kind][key] ?? 0;
          if (value <= cur) return false;
          set((s) => ({ records: { ...s.records, [kind]: { ...s.records[kind], [key]: value } } }));
          set(award(get(), 0, Date.now()));
          return true;
        },
        setWorldRecord(score, total, ms) {
          const cur = get().records.world;
          const better = !cur || score > cur.score || (score === cur.score && ms < cur.ms);
          if (better) set((s) => ({ records: { ...s.records, world: { score, total, ms } } }));
          return better;
        },
        clearDetective(groupId) {
          const s = get();
          if (s.detective[groupId]) return;
          set(award({ ...s, detective: { ...s.detective, [groupId]: Date.now() } }, 30, Date.now()));
        },
        setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
        setOnboarded: () => set({ onboarded: true }),
        importData(json) {
          const data = validateImport(JSON.parse(json));
          set({ ...data });
        },
        resetAll: () => set({ ...initialState(), onboarded: true }),
      };
    },
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage,
      partialize: (s) => {
        const { toasts: _t, ...rest } = s;
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') out[k] = v;
        return out as unknown as PersistedState;
      },
      merge: (persisted, current) => ({ ...current, ...revive(persisted as PersistedState) }),
      migrate: (persisted) => persisted as PersistedState, // v1 is the first schema; future versions migrate here
    },
  ),
);

export const levelOfCode = (code: string) => levelOf(useStore.getState().progress[code]);
