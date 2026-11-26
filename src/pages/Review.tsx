import { useMemo, useState } from 'react';
import { Button, LinkButton, PageHeader, Panel } from '../components/ui';
import { COUNTRIES } from '../data/countries';
import { dueCodes, prioritizedReviews } from '../engine/planner';
import { QuizRunner, type QuizResult } from '../quiz/QuizRunner';
import { Summary } from '../quiz/Summary';
import { useStore } from '../store/store';

export default function Review() {
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const completeSession = useStore((s) => s.completeSession);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [seed, setSeed] = useState(0);
  const now = useMemo(() => Date.now(), [seed]); // fixed per visit so the list doesn't shift mid-read
  const due = useMemo(() => {
    const d = new Set(dueCodes(progress, now));
    return prioritizedReviews(progress, now).filter((c) => d.has(c));
  }, [progress, now]);
  const cap = settings.dailyMinutes === 0 ? 200 : settings.dailyMinutes * 5;
  const nextDue = useMemo(() => {
    const times = COUNTRIES.map((c) => progress[c.code]?.card?.due.getTime()).filter((t): t is number => !!t && t > now);
    return times.length ? Math.min(...times) : null;
  }, [progress, now]);
  const shaky = useMemo(() => prioritizedReviews(progress, now + 2 * 86400000).filter((c) => !due.includes(c)).slice(0, 15), [progress, now, due]);

  if (result) return <Summary title="Daily Review complete" answers={result.answers} onAgain={() => { setResult(null); setCodes(null); setSeed((s) => s + 1); }} />;
  if (codes)
    return (
      <QuizRunner
        questions={codes.map((code) => ({ code, format: 'recall' }))}
        mode="review"
        requeueWrong
        onFinish={(r) => {
          completeSession({});
          setResult(r);
        }}
      />
    );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Daily Review" subtitle="Flags that spaced repetition says are due — reviewed just before you would forget them." />
      <Panel className="p-6">
        {due.length ? (
          <>
            <p className="font-display text-5xl font-semibold tabular-nums">{due.length}</p>
            <p className="text-ink-soft">flags due now{due.length > cap && `. Today's session covers the ${cap} most important; the rest are spread over the next days so nothing piles up.`}</p>
            <Button size="lg" className="mt-5" onClick={() => setCodes(due.slice(0, cap))}>Review {Math.min(cap, due.length)} flags</Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">Nothing is due right now</h2>
            <p className="mt-1 text-ink-soft">
              {nextDue ? `Your next review is due ${new Date(nextDue).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}.` : 'Learn some flags first and reviews will be scheduled automatically.'} Reviewing early adds little, so this is a good time to learn new flags.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton to="/learn">Smart Training</LinkButton>
              {shaky.length > 0 && <Button variant="secondary" onClick={() => setCodes(shaky)}>Practise {shaky.length} shaky flags early</Button>}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
