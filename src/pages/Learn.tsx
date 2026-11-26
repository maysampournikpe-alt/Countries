import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { Button, Chip, LinkButton, PageHeader, Panel } from '../components/ui';
import { BY_CODE, COUNTRIES } from '../data/countries';
import { buildDailyPlan, groupSize, pickNewFlags } from '../engine/planner';
import type { Settings } from '../engine/types';
import { Lesson } from '../quiz/Lesson';
import { QuizRunner, type QuizResult } from '../quiz/QuizRunner';
import { Summary } from '../quiz/Summary';
import { useStore } from '../store/store';

const LESSON_REVIEW_SHARE = 8; // earlier flags mixed into the mastery check

export default function Learn() {
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const lessonAcc = useStore((s) => s.lessonAcc);
  const setSettings = useStore((s) => s.setSettings);
  const completeSession = useStore((s) => s.completeSession);
  const [running, setRunning] = useState<null | { newCodes: string[]; reviews: string[] }>(null);
  const [phase, setPhase] = useState<'lesson' | 'reviews' | 'done'>('lesson');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [seed, setSeed] = useState(0);
  // Plan is computed once per visit so it doesn't shift while the learner reads it.
  const plan = useMemo(() => buildDailyPlan(progress, settings, lessonAcc, Date.now()), [settings.dailyMinutes, settings.groupSize, seed]);
  const unseen = COUNTRIES.filter((c) => !progress[c.code]?.introduced && !progress[c.code]?.card).length;

  if (running) {
    const lessonReviews = running.reviews.slice(0, LESSON_REVIEW_SHARE);
    const rest = running.reviews.slice(running.newCodes.length ? LESSON_REVIEW_SHARE : 0);
    if (running.newCodes.length && phase === 'lesson') {
      return (
        <div>
          <Lesson
            newCodes={running.newCodes}
            reviewCodes={lessonReviews}
            title="Smart Training complete"
            footer={rest.length > 0 && <Button className="mt-5" onClick={() => setPhase('reviews')}>Continue with {rest.length} more reviews</Button>}
          />
        </div>
      );
    }
    if (phase !== 'done' && rest.length) {
      return (
        <QuizRunner
          questions={rest.map((code) => ({ code, format: 'recall' }))}
          mode="smart-review"
          requeueWrong
          onFinish={(r) => {
            completeSession({});
            setResult(r);
            setPhase('done');
          }}
        />
      );
    }
    if (result) return <Summary title="Smart Training complete" answers={result.answers} onAgain={() => { setRunning(null); setResult(null); setPhase('lesson'); setSeed((s) => s + 1); }} />;
  }

  const nothing = !plan.newCodes.length && !plan.reviews.length;
  return (
    <div>
      <PageHeader title="Smart Training" subtitle="Your session is built for you: unresolved mistakes and confusions first, then new flags in small groups, then due reviews." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">Today's session</h2>
          {nothing ? (
            <div className="mt-3">
              <p className="text-ink-soft">{unseen ? 'Your reviews are holding up so well that today is all about new flags.' : 'Every flag is learned and nothing is due. Spaced repetition will bring flags back when they need it.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {unseen > 0 && <Button onClick={() => setRunning({ newCodes: pickNewFlags(progress, groupSize(settings, lessonAcc)), reviews: [] })}>Learn new flags</Button>}
                <LinkButton to="/challenges" variant="secondary">Try a challenge</LinkButton>
                <LinkButton to="/exam" variant="secondary">Final Mastery Exam</LinkButton>
              </div>
            </div>
          ) : (
            <>
              <ul className="mt-3 space-y-2 text-[15px]">
                {plan.newCodes.length > 0 && <li><b>{plan.newCodes.length} new flags</b> <span className="text-ink-soft">— introduced, practised, compared with look-alikes, then checked</span></li>}
                {plan.reviews.length > 0 && <li><b>{plan.reviews.length} reviews</b> <span className="text-ink-soft">— prioritised by mistakes, confusions and due date</span></li>}
                {plan.dueTotal > plan.reviews.length && <li className="text-ink-soft">{plan.dueTotal - plan.reviews.length} more due flags will wait for the next session.</li>}
                {plan.dueTotal > plan.budget * 0.8 && <li className="text-ink-soft">New flags are paused today so reviews can catch up. Retention comes first.</li>}
              </ul>
              {plan.newCodes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-ink-faint mb-2">New today</p>
                  <ul className="flex flex-wrap gap-3">
                    {plan.newCodes.map((c) => (
                      <li key={c} className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2 text-sm"><Flag code={c} height={20} maxWidth={36} />{BY_CODE[c].name}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button size="lg" className="mt-6" onClick={() => setRunning({ newCodes: plan.newCodes, reviews: plan.reviews })}>Start session</Button>
            </>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="font-semibold">Study time per day</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {([5, 10, 15, 20, 30, 0] as Settings['dailyMinutes'][]).map((m) => (
              <Chip key={m} active={settings.dailyMinutes === m} onClick={() => setSettings({ dailyMinutes: m })}>{m ? `${m} min` : 'Unlimited'}</Chip>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-soft">Group size adapts to how well new flags stick: currently <b className="text-ink">{groupSize(settings, lessonAcc)}</b> per lesson{lessonAcc != null && ` (recent recall accuracy ${Math.round(lessonAcc * 100)}%)`}.</p>
          <p className="mt-3 text-sm text-ink-soft">{unseen} of 195 flags not yet studied.</p>
          <p className="mt-3 text-sm"><Link to="/detective" className="font-semibold text-primary hover:underline">Practise look-alikes in Flag Detective</Link></p>
        </Panel>
      </div>
    </div>
  );
}
