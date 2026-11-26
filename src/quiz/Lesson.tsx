import { useMemo, useRef, useState } from 'react';
import { WorldMap } from '../components/WorldMap';
import { StageFlag } from '../components/Flag';
import { Button, Kbd, Panel } from '../components/ui';
import { BY_CODE } from '../data/countries';
import { groupsFor, type SimilarGroup } from '../data/similar';
import { mcOptions } from '../engine/planner';
import { shuffle } from '../engine/time';
import { useStore } from '../store/store';
import { CompareView } from './Compare';
import { QuizRunner, type Question, type QuizAnswer } from './QuizRunner';
import { Summary } from './Summary';

const STAGES = ['Introduce', 'Recognise', 'Recall', 'Compare', 'Mastery check', 'Review scheduled'] as const;
type Stage = 'intro' | 'guided' | 'recall' | 'compare' | 'check' | 'done';
const STAGE_INDEX: Record<Stage, number> = { intro: 0, guided: 1, recall: 2, compare: 3, check: 4, done: 5 };

/**
 * A learning session for a small group of new flags:
 * 1 introduction → 2 guided recognition (fewer hints each round) → 3 independent recall →
 * 4 confusion training → 5 mastery check mixed with earlier flags → 6 spaced review scheduled.
 */
export function Lesson({ newCodes, reviewCodes = [], title = 'Learning session', footer }: { newCodes: string[]; reviewCodes?: string[]; title?: string; footer?: React.ReactNode }) {
  const completeSession = useStore((s) => s.completeSession);
  const [stage, setStage] = useState<Stage>('intro');
  const [introIdx, setIntroIdx] = useState(0);
  const all = useRef<QuizAnswer[]>([]);
  const recallAcc = useRef<number | undefined>(undefined);

  const groups = useMemo(() => {
    const seen = new Map<string, SimilarGroup>();
    for (const c of newCodes) for (const g of groupsFor(c).slice(0, 1)) seen.set(g.id, g);
    return [...seen.values()].slice(0, 3);
  }, [newCodes]);
  const [cmpIdx, setCmpIdx] = useState(0);
  const [cmpDrill, setCmpDrill] = useState(false);

  const guided = useMemo<Question[]>(
    () => [
      ...shuffle(newCodes).map((code) => ({ code, format: 'mc' as const, options: mcOptions(code, 3), hint: `${BY_CODE[code].continent} — ${BY_CODE[code].f}` })),
      ...shuffle(newCodes).map((code) => ({ code, format: 'mc' as const, options: mcOptions(code, 4), hint: BY_CODE[code].continent })),
      ...shuffle(newCodes).map((code) => ({ code, format: 'mc' as const, options: mcOptions(code, 5) })),
    ],
    [newCodes],
  );
  const recall = useMemo<Question[]>(() => shuffle(newCodes).map((code) => ({ code, format: 'recall' as const })), [newCodes]);
  const drill = useMemo<Question[]>(() => {
    const qs: Question[] = [];
    for (const g of groups) for (const m of g.members.slice(0, 4)) qs.push({ code: m, format: 'mc', options: shuffle(g.members.slice(0, 4)) });
    return shuffle(qs);
  }, [groups]);
  const check = useMemo<Question[]>(() => shuffle([...newCodes, ...reviewCodes]).map((code) => ({ code, format: 'recall' as const })), [newCodes, reviewCodes]);

  const collect = (a: QuizAnswer[]) => (all.current = [...all.current, ...a]);
  const nextAfterRecall = () => setStage(groups.length ? 'compare' : 'check');

  return (
    <div>
      <ol className="mx-auto max-w-3xl mb-5 flex gap-1.5" aria-label="Lesson stages">
        {STAGES.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === STAGE_INDEX[stage] ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${i < STAGE_INDEX[stage] ? 'bg-good' : i === STAGE_INDEX[stage] ? 'bg-primary' : 'bg-line'}`} />
            <span className={`hidden sm:block mt-1.5 text-xs ${i === STAGE_INDEX[stage] ? 'text-ink font-semibold' : 'text-ink-faint'}`}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>
      <p className="sm:hidden mx-auto max-w-3xl -mt-2 mb-4 text-sm font-semibold">Step {STAGE_INDEX[stage] + 1}: {STAGES[STAGE_INDEX[stage]]}</p>

      {stage === 'intro' && <IntroCard code={newCodes[introIdx]} index={introIdx} total={newCodes.length} onPrev={() => setIntroIdx((i) => Math.max(0, i - 1))} onNext={() => (introIdx + 1 < newCodes.length ? setIntroIdx(introIdx + 1) : setStage('guided'))} />}

      {stage === 'guided' && (
        <QuizRunner key="guided" questions={guided} mode="lesson-guided" graded={false} requeueWrong stopLabel="Skip ahead" onFinish={(r) => { collect(r.answers); setStage('recall'); }}
          header={<p className="mb-3 text-sm text-ink-soft">Pick the country. Hints fade as you go.</p>} />
      )}

      {stage === 'recall' && (
        <QuizRunner key="recall" questions={recall} mode="lesson-recall" graded={false} requeueWrong stopLabel="Skip ahead"
          header={<p className="mb-3 text-sm text-ink-soft">Now from memory — no options.</p>}
          onFinish={(r) => {
            collect(r.answers);
            const first = r.answers.filter((a) => a.firstTry);
            recallAcc.current = first.length ? first.filter((a) => a.correct).length / first.length : undefined;
            nextAfterRecall();
          }} />
      )}

      {stage === 'compare' && !cmpDrill && (
        <div className="mx-auto max-w-3xl">
          <Panel className="p-5 sm:p-6">
            <p className="text-sm text-ink-soft mb-3">Look-alike {cmpIdx + 1} of {groups.length}. Study the differences.</p>
            <CompareView group={groups[cmpIdx]} focus={newCodes} />
          </Panel>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => (cmpIdx + 1 < groups.length ? setCmpIdx(cmpIdx + 1) : setCmpDrill(true))}>{cmpIdx + 1 < groups.length ? 'Next comparison' : 'Test the differences'}</Button>
          </div>
        </div>
      )}
      {stage === 'compare' && cmpDrill && (
        <QuizRunner key="drill" questions={drill} mode="lesson-compare" graded={false} requeueWrong stopLabel="Skip ahead"
          header={<p className="mb-3 text-sm text-ink-soft">Which look-alike is this?</p>}
          onFinish={(r) => { collect(r.answers); setStage('check'); }} />
      )}

      {stage === 'check' && (
        <QuizRunner key="check" questions={check} mode="lesson-check" graded requeueWrong stopLabel="Finish"
          header={<p className="mb-3 text-sm text-ink-soft">Mastery check: today's flags mixed with earlier ones. This one counts for your review schedule.</p>}
          onFinish={(r) => {
            collect(r.answers);
            completeSession({ newLearned: newCodes, lessonAccuracy: recallAcc.current });
            setStage('done');
          }} />
      )}

      {stage === 'done' && <Summary title={title} answers={all.current} learned={newCodes} extra={footer} />}
    </div>
  );
}

function IntroCard({ code, index, total, onNext, onPrev }: { code: string; index: number; total: number; onNext: () => void; onPrev: () => void }) {
  const c = BY_CODE[code];
  return (
    <div className="mx-auto max-w-3xl" onKeyDown={(e) => e.key === 'ArrowRight' && onNext()}>
      <StageFlag code={code} />
      <Panel className="mt-4 p-5 sm:p-6 anim-rise" key={code}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-faint">New flag {index + 1} of {total}</p>
            <h1 className="text-3xl sm:text-4xl font-semibold">{c.name}</h1>
            <p className="text-ink-soft">{c.subregion}, {c.continent}</p>
          </div>
          <div className="w-44 sm:w-56 shrink-0"><WorldMap highlight={code} label={`Location of ${c.name}`} compact /></div>
        </div>
        <dl className="mt-4 grid gap-3 text-[15px]">
          <div><dt className="font-semibold">What to look for</dt><dd className="text-ink-soft">{c.f}</dd></div>
          <div><dt className="font-semibold">Memory trick</dt><dd className="text-ink-soft">{c.t}</dd></div>
        </dl>
      </Panel>
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" onClick={onPrev} disabled={index === 0}>Back</Button>
        <Button onClick={onNext} autoFocus>{index + 1 < total ? 'Next flag' : 'Start practising'} <Kbd>Enter</Kbd></Button>
      </div>
    </div>
  );
}
