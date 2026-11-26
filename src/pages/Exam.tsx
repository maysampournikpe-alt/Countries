import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryPicker } from '../components/CountryPicker';
import { Flag, StageFlag } from '../components/Flag';
import { Bar, Button, LinkButton, PageHeader, Panel } from '../components/ui';
import { BY_CODE, CORE_CODES } from '../data/countries';
import { readiness } from '../engine/stats';
import { shuffle } from '../engine/time';
import { useStore } from '../store/store';

export default function Exam() {
  const exam = useStore((s) => s.exam);
  const start = useStore((s) => s.startExam);
  const state = useStore();
  const ready = readiness(state, Date.now());

  if (!exam || exam.completedAt) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Final Mastery Exam" subtitle="All 195 flags. No hints, no answer choices — only the searchable country picker. Results are revealed at the end." />
        {exam?.completedAt && <ExamResults />}
        <Panel className="p-6 mt-4">
          <h2 className="text-lg font-semibold">Estimated readiness: {Math.round(ready * 100)}%</h2>
          <Bar className="mt-2" value={ready} label="Exam readiness" color="var(--good)" />
          <p className="mt-3 text-[15px] text-ink-soft">This is the predicted chance of recalling a random flag right now, from your review history. {ready < 0.8 ? 'Above 80% is a good time to attempt the exam.' : 'You look ready.'}</p>
          <p className="mt-2 text-[15px] text-ink-soft">You can pause and resume at any time. Exam answers also count as reviews.</p>
          <Button size="lg" className="mt-5" onClick={() => start(shuffle(CORE_CODES))}>{exam?.completedAt ? 'Retake the exam' : 'Begin the exam'}</Button>
        </Panel>
      </div>
    );
  }
  return <ExamRunner />;
}

function ExamRunner() {
  const exam = useStore((s) => s.exam)!;
  const answerExam = useStore((s) => s.answerExam);
  const finish = useStore((s) => s.finishExam);
  const discard = useStore((s) => s.discardExam);
  const navigate = useNavigate();
  const shownAt = useRef(Date.now());
  const done = Object.keys(exam.answers).length;
  const code = exam.order.find((c) => !exam.answers[c]);

  if (!code) {
    return (
      <div className="mx-auto max-w-xl text-center py-10">
        <h1 className="text-3xl font-semibold">All 195 answered</h1>
        <Button size="lg" className="mt-6" onClick={finish}>Reveal my score</Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1"><Bar value={done} max={195} label="Exam progress" /></div>
        <span className="text-sm font-semibold tabular-nums text-ink-soft">{done + 1} / 195</span>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Pause</Button>
        <Button variant="ghost" size="sm" onClick={() => { if (confirm('Abandon this exam attempt? Answers so far will be discarded.')) discard(); }}>Abandon</Button>
      </div>
      <StageFlag code={code} />
      <div className="mt-5">
        <CountryPicker key={code} variant="exam" onSubmit={(chosen) => { answerExam(code, chosen, Date.now() - shownAt.current); shownAt.current = Date.now(); }} />
      </div>
    </div>
  );
}

function ExamResults() {
  const exam = useStore((s) => s.exam)!;
  const best = useStore((s) => s.records.exam);
  const entries = Object.entries(exam.answers);
  const score = entries.filter(([, a]) => a.correct).length;
  const misses = entries.filter(([, a]) => !a.correct);
  return (
    <Panel className="p-6">
      <p className="text-ink-soft">Last attempt</p>
      <p className="font-display text-6xl font-semibold tabular-nums">{score}<span className="text-3xl text-ink-faint">/195</span></p>
      {best && <p className="text-sm text-ink-soft">Personal best: {best.score}/195</p>}
      {score === 195 && <p className="mt-2 text-lg font-semibold text-brass">Perfect. You can recognise every national flag in the world.</p>}
      {misses.length > 0 && (
        <>
          <h2 className="mt-5 font-semibold">Flags to revisit ({misses.length})</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {misses.map(([c, a]) => (
              <li key={c} className="flex items-center gap-3 text-[15px]">
                <Flag code={c} height={28} maxWidth={56} />
                <span><b>{BY_CODE[c].name}</b><span className="block text-sm text-ink-soft">{a.chosen ? `You said ${BY_CODE[a.chosen].name}` : 'No answer'}</span></span>
              </li>
            ))}
          </ul>
          <LinkButton to="/challenges/mistakes" variant="secondary" className="mt-4">Crush these mistakes</LinkButton>
        </>
      )}
    </Panel>
  );
}
