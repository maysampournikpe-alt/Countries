import { LevelIcon } from '../components/LevelIcon';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { LevelLegend, RoadStrip } from '../components/RoadStrip';
import { Bar, Chip, LinkButton, PageHeader, Panel, Ring, Stat } from '../components/ui';
import { BY_CODE, CONTINENTS, COUNTRIES } from '../data/countries';
import { ACHIEVEMENTS, continentTrophy, displayStreak } from '../engine/gamification';
import { LEVEL_INFO, levelOf } from '../engine/mastery';
import { dueCodes } from '../engine/planner';
import { continentAccuracy, improvement, levelCounts, readiness, recommend, topConfusions } from '../engine/stats';
import { lastNDays } from '../engine/time';
import { useStore } from '../store/store';

const WorldMap = lazy(() => import('../components/WorldMap').then((m) => ({ default: m.WorldMap })));
const TROPHY = { none: '', bronze: '🥉', silver: '🥈', gold: '🥇' };
const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`);

export default function Stats() {
  const [tab, setTab] = useState<'overview' | 'map' | 'collection' | 'achievements'>('overview');
  return (
    <div>
      <PageHeader title="Statistics" subtitle="Where you stand, what is improving and what to do next." />
      <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Statistics views">
        {(['overview', 'map', 'collection', 'achievements'] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{{ overview: 'Overview', map: 'World map', collection: 'Flag collection', achievements: 'Achievements' }[t]}</Chip>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'map' && <MapView />}
      {tab === 'collection' && <Collection />}
      {tab === 'achievements' && <Achievements />}
    </div>
  );
}

function Overview() {
  const state = useStore();
  const now = Date.now();
  const counts = levelCounts(state);
  const acc = continentAccuracy(state);
  const conf = topConfusions(state, 6);
  const imp = improvement(state, now);
  const ready = readiness(state, now);
  const rec = recommend(state, now);
  const days = lastNDays(30, now);
  const maxAnswers = Math.max(1, ...days.map((d) => state.days[d]?.answers ?? 0));
  const due = dueCodes(state.progress, now).length;

  return (
    <div className="space-y-4">
      <Panel className="p-6">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <Stat value={<>{counts.mastered}<span className="text-ink-faint text-xl">/195</span></>} label="Flags mastered" sub={`${Math.round((counts.mastered / 195) * 100)}% overall mastery`} />
          <Stat value={counts.learning + counts.reviewing + counts.provisional} label="Being learned" />
          <Stat value={counts.new} label="Not yet studied" />
          <Stat value={due} label="Need review now" />
          <Stat value={displayStreak(state.streak, now)} label="Current streak" sub={`Longest: ${state.streak.longest} days`} />
        </div>
        <div className="mt-6"><RoadStrip /></div>
        <div className="mt-3"><LevelLegend counts={counts} /></div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 flex items-center gap-5">
          <Ring value={ready} size={110} color="var(--good)" label={`Exam readiness ${Math.round(ready * 100)}%`}>
            <span className="font-display text-2xl font-semibold">{Math.round(ready * 100)}%</span>
          </Ring>
          <div>
            <h2 className="font-semibold">Final exam readiness</h2>
            <p className="text-sm text-ink-soft">Predicted chance of recalling a random flag today.</p>
            <Link to="/exam" className="text-sm font-semibold text-primary hover:underline">Final Mastery Exam</Link>
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Recent improvement</h2>
          <p className="mt-2 text-[15px]">Accuracy this week: <b>{pct(imp.recent)}</b>{imp.before != null && <span className="text-ink-soft"> (previous week {pct(imp.before)})</span>}</p>
          <p className="text-[15px]">Newly mastered this week: <b>{imp.masteredGain}</b></p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Recommended next</h2>
          <p className="mt-1 text-[15px] text-ink-soft">{rec.reason}</p>
          <LinkButton to={rec.to} size="sm" className="mt-3">{rec.title}</LinkButton>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-semibold">Accuracy and trophies by continent</h2>
          <ul className="mt-3 space-y-3">
            {CONTINENTS.map((k) => {
              const t = continentTrophy(state, k);
              return (
                <li key={k}>
                  <div className="flex justify-between text-[15px]">
                    <span>{k} <span aria-label={t.trophy === 'none' ? 'no trophy yet' : `${t.trophy} trophy`}>{TROPHY[t.trophy]}</span></span>
                    <span className="text-ink-soft tabular-nums">{pct(acc[k].pct)} accuracy, {t.mastered}/{t.total} mastered</span>
                  </div>
                  <Bar className="mt-1.5" value={t.mastered} max={t.total} color="var(--lvl-mastered)" label={`${k} mastery`} />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">Trophies: bronze at 25% mastered, silver at 60%, gold at 100%.</p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Most frequently confused</h2>
          {conf.length ? (
            <ul className="mt-3 space-y-2">
              {conf.map(({ a, b, count }) => (
                <li key={a + b} className="flex items-center gap-2 text-[15px]">
                  <Flag code={a} height={22} maxWidth={44} /><Flag code={b} height={22} maxWidth={44} />
                  <span className="flex-1">{BY_CODE[a].name} / {BY_CODE[b].name}</span>
                  <span className="text-ink-faint tabular-nums">{count}×</span>
                  <Link to={`/detective/pair-${a}-${b}`} className="text-sm font-semibold text-primary hover:underline">Train</Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-[15px] text-ink-soft">No confusions recorded yet.</p>}
        </Panel>
      </div>

      <Panel className="p-5">
        <h2 className="font-semibold">Daily learning history (30 days)</h2>
        <div className="mt-4 flex items-end gap-1 h-32" role="img" aria-label="Answers per day for the last 30 days">
          {days.map((d) => {
            const log = state.days[d];
            const h = ((log?.answers ?? 0) / maxAnswers) * 100;
            const ok = log ? (log.correct / Math.max(1, log.answers)) * h : 0;
            return (
              <div key={d} className="flex-1 h-full flex flex-col justify-end" title={`${d}: ${log?.answers ?? 0} answers, ${log?.correct ?? 0} correct`}>
                <div className="rounded-t-sm bg-bad/40 relative" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 inset-x-0 rounded-t-sm bg-primary" style={{ height: `${h ? (ok / h) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-xs text-ink-faint"><span>{days[0]}</span><span>Today</span></div>
        <p className="mt-2 text-xs text-ink-soft"><span className="inline-block h-2 w-3 bg-primary rounded-sm mr-1" />correct <span className="inline-block h-2 w-3 bg-bad/40 rounded-sm ml-3 mr-1" />incorrect</p>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-semibold">Personal records</h2>
        <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[15px]">
          <li>World Challenge: <b>{state.records.world ? `${state.records.world.score}/${state.records.world.total}` : '—'}</b></li>
          <li>Final exam: <b>{state.records.exam ? `${state.records.exam.score}/195` : '—'}</b></li>
          <li>Best speed score: <b>{Math.max(0, ...Object.values(state.records.speed)) || '—'}</b></li>
          <li>Longest survival streak: <b>{Math.max(0, ...Object.values(state.records.survival)) || '—'}</b></li>
          <li>Look-alike groups cleared: <b>{Object.keys(state.detective).length}</b></li>
          <li>Total XP: <b>{state.xp}</b></li>
        </ul>
      </Panel>
    </div>
  );
}

function MapView() {
  const progress = useStore((s) => s.progress);
  const [sel, setSel] = useState<string | undefined>();
  const c = sel ? BY_CODE[sel] : undefined;
  const p = sel ? progress[sel] : undefined;
  const lvl = levelOf(p);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Panel className="p-3 sm:p-5">
        <Suspense fallback={<div className="aspect-[96/47] rounded-2xl bg-raised" />}>
          <WorldMap fill={(code) => LEVEL_INFO[levelOf(progress[code])].color} onSelect={setSel} selected={sel} label="World map coloured by your mastery of each flag" />
        </Suspense>
        <div className="mt-3"><LevelLegend /></div>
        <p className="mt-1 text-xs text-ink-faint">Small states are shown as dots. Select any country for details.</p>
      </Panel>
      <Panel className="p-5" as="div">
        {c ? (
          <div aria-live="polite">
            <Flag code={c.code} height={80} maxWidth={200} />
            <h2 className="mt-3 text-2xl font-semibold">{c.name}</h2>
            <p className="text-[15px]"><LevelIcon level={lvl} /> {LEVEL_INFO[lvl].label}</p>
            <dl className="mt-3 text-[15px] space-y-1">
              <div className="flex justify-between"><dt className="text-ink-soft">Answers</dt><dd className="tabular-nums">{p?.correct ?? 0} / {p?.attempts ?? 0} correct</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Next review</dt><dd>{p?.card ? p.card.due.toLocaleDateString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Avg. answer time</dt><dd>{p?.avgMs ? `${(p.avgMs / 1000).toFixed(1)} s` : '—'}</dd></div>
              {p && Object.keys(p.confusions).length > 0 && <div><dt className="text-ink-soft">Confused with</dt><dd>{Object.keys(p.confusions).map((x) => BY_CODE[x]?.name).join(', ')}</dd></div>}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton to={`/practice/${c.code}`} size="sm">Practise this flag</LinkButton>
              <LinkButton to={`/atlas/${c.code}`} size="sm" variant="secondary">Open in Atlas</LinkButton>
            </div>
          </div>
        ) : (
          <p className="text-ink-soft">Select a country on the map to see your statistics and practise its flag.</p>
        )}
      </Panel>
      <details className="lg:col-span-2 rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold">Text list of all countries by mastery level</summary>
        <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-1 text-sm">
          {COUNTRIES.map((x) => {
            const l = levelOf(progress[x.code]);
            return <li key={x.code}><button className="hover:underline text-left" onClick={() => setSel(x.code)}>{x.name}</button>: <span className="text-ink-soft">{LEVEL_INFO[l].label}</span></li>;
          })}
        </ul>
      </details>
    </div>
  );
}

function Collection() {
  const progress = useStore((s) => s.progress);
  const unlocked = COUNTRIES.filter((c) => levelOf(progress[c.code]) === 'mastered').length;
  return (
    <div>
      <p className="mb-4 text-ink-soft">Mastered flags unlock in your collection. <b className="text-ink">{unlocked} of 195</b> collected.</p>
      <ul className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-8">
        {COUNTRIES.map((c) => {
          const on = levelOf(progress[c.code]) === 'mastered';
          return (
            <li key={c.code} className={`rounded-xl border p-2 text-center ${on ? 'border-brass bg-surface' : 'border-line bg-raised'}`}>
              <div className="h-14 grid place-items-center">
                {on ? <Flag code={c.code} height={40} maxWidth={72} /> : <span aria-hidden className="h-10 w-14 rounded bg-line grid place-items-center text-ink-faint">?</span>}
              </div>
              <span className={`block mt-1 text-[11px] leading-tight ${on ? '' : 'text-ink-faint'}`}>{on ? c.name : 'Locked'}</span>
              {!on && <span className="sr-only">{c.name}, not yet mastered</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Achievements() {
  const state = useStore();
  const list = useMemo(() => ACHIEVEMENTS.map((a) => ({ a, p: a.progress(state), at: state.achievements[a.id] })), [state]);
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(({ a, p, at }) => (
        <li key={a.id} className={`rounded-2xl border p-4 ${at ? 'border-brass bg-surface' : 'border-line bg-surface/60'}`}>
          <div className="flex items-start gap-3">
            <span className={`text-3xl ${at ? '' : 'grayscale opacity-50'}`} aria-hidden>{a.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-ink-soft">{a.description}</p>
              {at ? <p className="mt-1 text-xs font-semibold text-brass">Unlocked {new Date(at).toLocaleDateString()}</p> : <Bar className="mt-2" value={p[0]} max={p[1]} label={`${a.title} progress`} color="var(--brass)" />}
              {!at && <p className="mt-1 text-xs text-ink-faint tabular-nums">{p[0]} / {p[1]}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
