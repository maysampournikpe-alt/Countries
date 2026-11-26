import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CountryPicker } from '../components/CountryPicker';
import { Flag, StageFlag } from '../components/Flag';
import { Bar, Button, Kbd } from '../components/ui';
import { BY_CODE, COUNTRIES, type Country } from '../data/countries';
import { mcOptions } from '../engine/planner';
import type { Confidence, Format } from '../engine/types';
import { useStore } from '../store/store';
import { Feedback } from './Feedback';
import { play } from './sound';

export interface Question {
  code: string;
  format: Exclude<Format, 'compare'>;
  options?: string[]; // for mc / reverse
  hint?: string;
}

export interface QuizAnswer {
  code: string;
  chosen: string | null;
  correct: boolean;
  ms: number;
  format: Question['format'];
  firstTry: boolean;
}

export interface QuizResult {
  answers: QuizAnswer[];
  durationMs: number;
  stoppedEarly: boolean;
  livesLeft?: number;
}

export interface QuizProps {
  questions: Question[];
  mode: string;
  graded?: boolean; // recall answers count for spaced repetition
  feedback?: boolean; // immediate corrective feedback (default true)
  requeueWrong?: boolean; // ask missed flags again later in the session
  timeLimitSec?: number; // whole-session countdown (Speed Challenge)
  perQuestionSec?: number; // optional per-question timer
  lives?: number; // Survival
  next?: () => Question; // endless generator (Speed / Survival)
  pool?: Country[];
  bonus?: boolean; // bonus flags are scored separately
  header?: ReactNode;
  onFinish: (r: QuizResult) => void;
  onAnswer?: (a: QuizAnswer) => void; // observe each answer (e.g. Flag Detective streaks)
  shouldStop?: () => boolean; // checked before each new question
  stopLabel?: string;
}

export function withOptions(q: Question, n: number, pool?: Country[]): Question {
  return q.options || q.format === 'recall' ? q : { ...q, options: mcOptions(q.code, n, Math.random, pool) };
}

export function QuizRunner(props: QuizProps) {
  const { mode, graded = true, feedback = true, requeueWrong = false, timeLimitSec, perQuestionSec, lives, next, pool = COUNTRIES, bonus = false, onFinish, stopLabel = 'End session' } = props;
  const recordAnswer = useStore((s) => s.recordAnswer);
  const recordBonus = useStore((s) => s.recordBonus);

  const [queue, setQueue] = useState<Question[]>(() => props.questions.map((q) => withOptions(q, 4, pool)));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [pending, setPending] = useState<{ code: string; chosen: string | null; xp: number } | null>(null);
  const [livesLeft, setLivesLeft] = useState(lives);
  const [now, setNow] = useState(Date.now());
  const startedAt = useRef(Date.now());
  const shownAt = useRef(Date.now());
  const missed = useRef(new Set<string>());
  const finished = useRef(false);
  const advancedAt = useRef(-1);

  const q = queue[index];
  const total = next ? undefined : queue.length;

  const finish = useCallback(
    (stoppedEarly: boolean, list = answers, l = livesLeft) => {
      if (finished.current) return;
      finished.current = true;
      onFinish({ answers: list, durationMs: Date.now() - startedAt.current, stoppedEarly, livesLeft: l });
    },
    [answers, livesLeft, onFinish],
  );

  // timers
  useEffect(() => {
    if (!timeLimitSec && !perQuestionSec) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [timeLimitSec, perQuestionSec]);
  const remaining = timeLimitSec ? Math.max(0, timeLimitSec * 1000 - (now - startedAt.current)) : undefined;
  const qRemaining = perQuestionSec && !pending ? Math.max(0, perQuestionSec * 1000 - (now - shownAt.current)) : undefined;

  useEffect(() => {
    if (remaining === 0) finish(false);
  }, [remaining, finish]);

  const advance = useCallback(
    (list: QuizAnswer[], l = livesLeft) => {
      if (advancedAt.current === list.length) return; // Enter, click and auto-continue can race; advance once per answer
      advancedAt.current = list.length;
      setPending(null);
      shownAt.current = Date.now();
      if ((l !== undefined && l <= 0) || props.shouldStop?.()) return finish(false, list, l);
      if (next) {
        setQueue((qs) => [...qs, withOptions(next(), 4, pool)]);
        setIndex((i) => i + 1);
        return;
      }
      if (index + 1 >= queue.length) return finish(false, list, l);
      setIndex((i) => i + 1);
    },
    [finish, index, livesLeft, next, pool, queue.length, props.shouldStop],
  );

  const answer = useCallback(
    (chosen: string | null, confidence: Confidence = 'sure') => {
      if (!q || pending || finished.current) return;
      const ms = Date.now() - shownAt.current;
      const correct = chosen === q.code;
      const firstTry = !missed.current.has(q.code);
      let xp = 0;
      if (bonus || BY_CODE[q.code].bonus) recordBonus(q.code, correct);
      else
        xp = recordAnswer({ code: q.code, chosen, format: q.format, ms, graded: graded && firstTry, mode, confidence: chosen ? confidence : 'idk' }).xp;
      play(correct ? 'correct' : 'wrong');
      const entry = { code: q.code, chosen, correct, ms, format: q.format, firstTry };
      const list = [...answers, entry];
      setAnswers(list);
      props.onAnswer?.(entry);
      let l = livesLeft;
      if (!correct) {
        missed.current.add(q.code);
        if (requeueWrong) setQueue((qs) => [...qs, { ...q, options: q.options && mcOptions(q.code, q.options.length, Math.random, pool) }]);
        if (l !== undefined) setLivesLeft((l = l - 1));
      }
      if (feedback && !(timeLimitSec && correct)) setPending({ code: q.code, chosen, xp });
      else advance(list, l);
    },
    [q, pending, answers, bonus, recordBonus, recordAnswer, graded, mode, livesLeft, requeueWrong, pool, feedback, timeLimitSec, advance, props.onAnswer],
  );

  // per-question timeout counts as "I don't know"
  useEffect(() => {
    if (qRemaining === 0) answer(null, 'idk');
  }, [qRemaining, answer]);

  // keyboard: Enter continues after feedback; number keys pick options
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pending && e.key === 'Enter') {
        // The focused control handles its own Enter; an Enter from the answer box is the submission itself
        // (React flushes effects synchronously for key events, so this listener can see that same keypress).
        if (e.repeat || e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement || e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        advance(answers);
      } else if (!pending && q?.options && /^[1-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement)) {
        const opt = q.options[Number(e.key) - 1];
        if (opt) answer(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, q, answer, advance, answers]);

  const score = answers.filter((a) => a.correct).length;
  const progressLabel = useMemo(() => (total ? `${Math.min(index + 1, total)} / ${total}` : `${score} correct`), [index, total, score]);

  if (!q) return null;
  const c = BY_CODE[q.code];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          {total ? <Bar value={index} max={total} label="Session progress" /> : remaining !== undefined ? <Bar value={remaining} max={timeLimitSec! * 1000} color="var(--brass)" label="Time left" /> : <div className="h-2" />}
        </div>
        <span className="text-sm font-semibold tabular-nums text-ink-soft">{progressLabel}</span>
        {remaining !== undefined && <span className="text-sm font-semibold tabular-nums text-brass" aria-live="off">{Math.ceil(remaining / 1000)}s</span>}
        {livesLeft !== undefined && <span className="text-sm font-semibold" aria-label={`${livesLeft} lives left`}>{'♥'.repeat(Math.max(0, livesLeft))}<span className="text-ink-faint">{'♡'.repeat(Math.max(0, (lives ?? 0) - livesLeft))}</span></span>}
        <Button variant="ghost" size="sm" onClick={() => finish(true)}>{stopLabel}</Button>
      </div>
      {props.header}

      {q.format === 'reverse' ? (
        <ReverseQuestion key={`${index}-${q.code}`} q={q} disabled={!!pending} onPick={answer} />
      ) : (
        <>
          <StageFlag code={q.code} />
          {q.hint && !pending && <p className="mt-3 text-center text-sm text-ink-soft">Hint: {q.hint}</p>}
          {qRemaining !== undefined && <Bar className="mt-3" value={qRemaining} max={perQuestionSec! * 1000} color="var(--brass)" label="Time for this question" />}
          <div className="mt-5">
            {q.format === 'mc' ? (
              <OptionGrid key={`${index}-${q.code}`} options={q.options!} disabled={!!pending} onPick={answer} chosen={pending?.chosen} correct={pending ? q.code : undefined} />
            ) : (
              !pending && <CountryPicker key={`${index}-${q.code}`} pool={pool} onSubmit={answer} />
            )}
          </div>
        </>
      )}

      {pending && (
        <div className="mt-5">
          <Feedback code={pending.code} chosen={pending.chosen} xp={pending.xp} onNext={() => advance(answers)} />
        </div>
      )}
      <p className="sr-only" aria-live="polite">{pending ? '' : q.format === 'reverse' ? `Which flag belongs to ${c.name}?` : 'New flag shown.'}</p>
    </div>
  );
}

function OptionGrid({ options, onPick, disabled, chosen, correct }: { options: string[]; onPick: (c: string) => void; disabled: boolean; chosen?: string | null; correct?: string }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3" role="group" aria-label="Answer options">
      {options.map((o, i) => {
        const state = correct ? (o === correct ? 'good' : o === chosen ? 'bad' : 'dim') : 'idle';
        return (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onPick(o)}
            className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-[16px] font-medium flex items-center gap-3 transition ${
              state === 'good' ? 'border-good bg-good-soft' : state === 'bad' ? 'border-bad bg-bad-soft' : state === 'dim' ? 'border-line opacity-50' : 'border-line bg-surface hover:border-primary hover:-translate-y-0.5'
            }`}
          >
            <span className="grid place-items-center h-7 w-7 shrink-0 rounded-lg bg-raised text-xs font-bold text-ink-faint">{i + 1}</span>
            {BY_CODE[o].name}
          </button>
        );
      })}
    </div>
  );
}

function ReverseQuestion({ q, onPick, disabled }: { q: Question; onPick: (c: string) => void; disabled: boolean }) {
  return (
    <div>
      <div className="stage rounded-3xl px-4 py-8 text-center">
        <p className="text-sm text-ink-soft">Which flag belongs to</p>
        <p className="mt-1 font-display text-3xl sm:text-4xl font-semibold">{BY_CODE[q.code].name}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3" role="group" aria-label="Flag options">
        {q.options!.map((o, i) => (
          <button key={o} type="button" disabled={disabled} onClick={() => onPick(o)} aria-label={`Option ${i + 1}`} className="relative rounded-2xl border-2 border-line bg-surface p-4 grid place-items-center min-h-32 hover:border-primary transition disabled:opacity-70">
            <span className="absolute left-2 top-2"><Kbd>{i + 1}</Kbd></span>
            <Flag code={o} height={84} maxWidth={170} hidden alt={`Flag option ${i + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
