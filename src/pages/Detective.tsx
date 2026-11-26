import { Link } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { PageHeader, Panel } from '../components/ui';
import { BY_CODE } from '../data/countries';
import { SIMILAR_GROUPS } from '../data/similar';
import { topConfusions } from '../engine/stats';
import { SUBTLETY } from '../quiz/Compare';
import { useStore } from '../store/store';

export default function Detective() {
  const state = useStore();
  const personal = topConfusions(state, 12);

  return (
    <div>
      <PageHeader title="Flag Detective" subtitle="Look-alike flags side by side, with exactly what makes them different. Each drill continues until you can reliably tell them apart." />

      <Panel className="p-5 mb-6">
        <h2 className="text-lg font-semibold">Your personal confusions</h2>
        {personal.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {personal.map(({ a, b, count }) => (
              <li key={a + b}>
                <Link to={`/detective/pair-${a}-${b}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-primary">
                  <Flag code={a} height={26} maxWidth={50} />
                  <Flag code={b} height={26} maxWidth={50} />
                  <span className="flex-1 text-[15px]">{BY_CODE[a].name} vs {BY_CODE[b].name}</span>
                  <span className="text-sm text-ink-faint tabular-nums">{count}×</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-soft text-[15px]">When you mix up two countries in any mode, a personal comparison exercise appears here.</p>
        )}
      </Panel>

      <h2 className="text-lg font-semibold mb-3">Look-alike groups <span className="text-ink-faint font-normal">({Object.keys(state.detective).length} of {SIMILAR_GROUPS.length} cleared)</span></h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIMILAR_GROUPS.map((g) => (
          <li key={g.id}>
            <Link to={`/detective/${g.id}`} className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-primary transition">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{g.title}</h3>
                {state.detective[g.id] && <span className="text-sm font-semibold text-good" aria-label="Cleared">✓ Cleared</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {g.members.map((m) => <Flag key={m} code={m} height={30} maxWidth={60} />)}
              </div>
              <p className="mt-2 text-sm text-ink-soft">{g.members.map((m) => BY_CODE[m].name).join(', ')}</p>
              <p className={`mt-1 text-xs font-semibold ${g.subtlety === 3 ? 'text-bad' : g.subtlety === 2 ? 'text-brass' : 'text-good'}`}>{SUBTLETY[g.subtlety]}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
