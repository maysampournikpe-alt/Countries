import { LevelIcon } from '../components/LevelIcon';
import { Link } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { LinkButton, Panel } from '../components/ui';
import { BY_CODE } from '../data/countries';
import { levelOf } from '../engine/mastery';
import { recommend } from '../engine/stats';
import { useStore } from '../store/store';
import type { QuizAnswer } from './QuizRunner';

function relDays(due?: Date) {
  if (!due) return '';
  const d = Math.round((due.getTime() - Date.now()) / 86400000);
  return d <= 0 ? 'later today' : d === 1 ? 'tomorrow' : `in ${d} days`;
}

/** End-of-session debrief: what you learned, what improved, what you still confuse, and what to do next. */
export function Summary({ answers, title = 'Session complete', learned = [], extra, onAgain }: { answers: QuizAnswer[]; title?: string; learned?: string[]; extra?: React.ReactNode; onAgain?: () => void }) {
  const state = useStore();
  const correct = answers.filter((a) => a.correct).length;
  const firstTries = answers.filter((a) => a.firstTry);
  const acc = firstTries.length ? firstTries.filter((a) => a.correct).length / firstTries.length : 0;
  const codes = [...new Set(answers.map((a) => a.code))];
  const improved = codes.filter((c) => {
    const own = answers.filter((a) => a.code === c);
    return own.some((a) => !a.correct) && own[own.length - 1].correct;
  });
  const confusions = answers.filter((a) => !a.correct && a.chosen).map((a) => [a.code, a.chosen!] as const);
  const uniqueConf = [...new Map(confusions.map(([a, b]) => [[a, b].sort().join('|'), [a, b] as const])).values()];
  const rec = recommend(state, Date.now());
  const scheduled = codes.filter((c) => state.progress[c]?.card).slice(0, 12);

  return (
    <div className="mx-auto max-w-3xl anim-rise">
      <Panel className="p-6 sm:p-8">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
          <div><div className="font-display text-4xl font-semibold tabular-nums">{correct}<span className="text-ink-faint text-2xl">/{answers.length}</span></div><div className="text-sm text-ink-soft">answers correct</div></div>
          <div><div className="font-display text-4xl font-semibold tabular-nums">{Math.round(acc * 100)}%</div><div className="text-sm text-ink-soft">first-try accuracy</div></div>
          {!!learned.length && <div><div className="font-display text-4xl font-semibold tabular-nums">{learned.length}</div><div className="text-sm text-ink-soft">new flags learned</div></div>}
        </div>
        {extra}
      </Panel>

      {!!learned.length && (
        <Panel className="mt-4 p-5">
          <h2 className="font-semibold text-lg">What you learned</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-3">
            {learned.map((c) => (
              <li key={c} className="flex items-center gap-3"><Flag code={c} height={30} maxWidth={60} /><span>{BY_CODE[c].name}</span></li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <Panel className="p-5">
          <h2 className="font-semibold text-lg">What you improved</h2>
          {improved.length ? (
            <ul className="mt-2 space-y-1 text-[15px]">{improved.map((c) => <li key={c}>✓ {BY_CODE[c].name} — missed, then recalled</li>)}</ul>
          ) : (
            <p className="mt-2 text-ink-soft text-[15px]">{correct === answers.length && answers.length ? 'Every answer was right first time.' : 'Keep going — corrections show up here.'}</p>
          )}
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold text-lg">Still confusing</h2>
          {uniqueConf.length ? (
            <ul className="mt-2 space-y-2">
              {uniqueConf.slice(0, 6).map(([a, b]) => (
                <li key={a + b} className="flex items-center gap-2 text-[15px]">
                  <Flag code={a} height={22} maxWidth={44} /> {BY_CODE[a].name} <span className="text-ink-faint">vs</span> <Flag code={b} height={22} maxWidth={44} /> {BY_CODE[b].name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-ink-soft text-[15px]">No confusions this session.</p>
          )}
        </Panel>
      </div>

      {!!scheduled.length && (
        <Panel className="mt-4 p-5">
          <h2 className="font-semibold text-lg">Next reviews</h2>
          <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[15px]">
            {scheduled.map((c) => {
              const lvl = levelOf(state.progress[c]);
              return (
                <li key={c} className="flex justify-between gap-2"><span>{BY_CODE[c].name} <LevelIcon level={lvl} /></span><span className="text-ink-soft">{relDays(state.progress[c].card?.due)}</span></li>
              );
            })}
          </ul>
        </Panel>
      )}

      <Panel className="mt-4 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Study next: {rec.title}</h2>
          <p className="text-ink-soft text-[15px]">{rec.reason}</p>
        </div>
        <div className="flex gap-2">
          {onAgain && <button onClick={onAgain} className="h-11 px-4 rounded-xl border border-line font-semibold hover:border-primary">Play again</button>}
          <LinkButton to={rec.to}>{rec.title}</LinkButton>
        </div>
      </Panel>
      <p className="mt-4 text-center"><Link to="/" className="text-sm font-semibold text-primary hover:underline">Back to home</Link></p>
    </div>
  );
}
