import { Link } from 'react-router-dom';
import { LevelLegend, RoadStrip } from '../components/RoadStrip';
import { Bar, LinkButton, Panel, Ring } from '../components/ui';
import { TOTAL } from '../data/countries';
import { continentTrophy, displayStreak, levelFromXp } from '../engine/gamification';
import { dueCodes } from '../engine/planner';
import { levelCounts, recommend, todayLog } from '../engine/stats';
import { CONTINENTS } from '../data/countries';
import { useStore } from '../store/store';

const TROPHY = { none: '—', bronze: '🥉', silver: '🥈', gold: '🥇' };

export default function Home() {
  const state = useStore();
  const now = Date.now();
  const counts = levelCounts(state);
  const rec = recommend(state, now);
  const due = dueCodes(state.progress, now).length;
  const today = todayLog(state, now);
  const goalMin = state.settings.dailyMinutes || 20;
  const doneMin = Math.round((today?.ms ?? 0) / 60000);
  const lvl = levelFromXp(state.xp);
  const fresh = Object.keys(state.progress).length === 0 && !state.diagnostic;
  const continueTo = fresh ? '/diagnostic' : rec.id === 'diagnostic' ? '/diagnostic' : '/learn';
  const continueLabel = fresh ? 'Start the diagnostic' : rec.id === 'diagnostic' ? 'Resume the diagnostic' : 'Continue Learning';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-surface border border-line p-6 sm:p-8 overflow-hidden">
        <h1 className="sr-only">FlagMaster — Road to 195</h1>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-ink-soft">Your road to 195</p>
            <p className="font-display font-semibold leading-none mt-1">
              <span className="text-7xl sm:text-8xl tabular-nums">{counts.mastered}</span>
              <span className="text-3xl sm:text-4xl text-ink-faint"> / {TOTAL} mastered</span>
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto">
            <LinkButton to={continueTo} size="lg" className="w-full sm:w-auto sm:min-w-64">{continueLabel}</LinkButton>
            <p className="text-sm text-ink-soft sm:text-right max-w-[42ch]">{fresh ? 'About 10 minutes to find which flags you already know.' : rec.reason}</p>
          </div>
        </div>
        <div className="mt-8"><RoadStrip tall /></div>
        <div className="mt-4"><LevelLegend counts={counts} /></div>
      </section>

      {fresh && (
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">How FlagMaster works</h2>
          <ol className="mt-3 grid md:grid-cols-3 gap-4 text-[15px] text-ink-soft">
            <li><b className="text-ink block">1. Diagnose</b>Go through all 195 flags once. No answers are revealed until the end, and you can stop and resume any time.</li>
            <li><b className="text-ink block">2. Learn in small groups</b>5–7 new flags at a time: introduce, recognise, recall, compare look-alikes, check.</li>
            <li><b className="text-ink block">3. Review at the right moment</b>Spaced repetition brings each flag back just before you would forget it.</li>
          </ol>
          <p className="mt-4 text-sm"><Link to="/learn" className="font-semibold text-primary hover:underline">Skip the diagnostic and start learning from scratch</Link></p>
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5 flex items-center gap-5">
          <Ring value={doneMin / goalMin} label={`Daily goal: ${doneMin} of ${goalMin} minutes`} color="var(--good)">
            <span className="font-display text-xl font-semibold tabular-nums">{doneMin}<span className="text-sm text-ink-faint">/{goalMin}</span></span>
          </Ring>
          <div>
            <h2 className="font-semibold">Daily goal</h2>
            <p className="text-sm text-ink-soft">{doneMin >= goalMin ? 'Goal reached. Anything more is a bonus.' : `${goalMin - doneMin} min of practice to go`}</p>
            <Link to="/settings" className="text-sm font-semibold text-primary hover:underline">Change study time</Link>
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Reviews due</h2>
          <p className="font-display text-4xl font-semibold tabular-nums mt-1">{due}</p>
          <p className="text-sm text-ink-soft">{due ? 'Reviewing now strengthens memory the most.' : 'Nothing due right now.'}</p>
          {due > 0 && <LinkButton to="/review" variant="secondary" size="sm" className="mt-3">Start Daily Review</LinkButton>}
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Level {lvl.level}</h2>
            <span className="text-sm text-ink-faint tabular-nums">{state.xp} XP</span>
          </div>
          <Bar className="mt-3" value={lvl.into} max={lvl.span} color="var(--brass)" label="Progress to next level" />
          <p className="mt-3 text-sm text-ink-soft">🔥 {displayStreak(state.streak, now)}-day streak (best {state.streak.longest})</p>
          {state.streak.freezes > 0 && <p className="text-xs text-ink-faint">{state.streak.freezes} streak freeze{state.streak.freezes > 1 ? 's' : ''} saved for days off</p>}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-semibold">Continental trophies</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[15px]">
            {CONTINENTS.map((k) => {
              const t = continentTrophy(state, k);
              return (
                <li key={k} className="flex items-center justify-between gap-2">
                  <span>{k}</span>
                  <span className="tabular-nums text-ink-soft"><span aria-label={`${t.trophy} trophy`}>{TROPHY[t.trophy]}</span> {t.mastered}/{t.total}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Quick start</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ['/detective', 'Flag Detective', 'Look-alike flags'],
              ['/challenges/mistakes', 'Mistake Crusher', 'Fix past errors'],
              ['/challenges', 'Challenges', 'Speed, survival & more'],
              ['/atlas', 'Flag Atlas', 'Browse all 195'],
            ].map(([to, t, d]) => (
              <Link key={to} to={to} className="rounded-xl border border-line px-3 py-2.5 hover:border-primary transition">
                <span className="block font-semibold text-[15px]">{t}</span>
                <span className="block text-sm text-ink-faint">{d}</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
