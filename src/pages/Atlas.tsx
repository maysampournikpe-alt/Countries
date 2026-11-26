import { LevelIcon } from '../components/LevelIcon';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { Chip, PageHeader } from '../components/ui';
import { BONUS, CONTINENTS, COUNTRIES, type Continent } from '../data/countries';
import { LEVEL_INFO, levelOf } from '../engine/mastery';
import { createSearcher } from '../search/countrySearch';
import { useStore } from '../store/store';

const coreSearch = createSearcher(COUNTRIES);
const bonusSearch = createSearcher(BONUS);

export default function Atlas() {
  const progress = useStore((s) => s.progress);
  const showBonus = useStore((s) => s.settings.showBonus);
  const [q, setQ] = useState('');
  const [cont, setCont] = useState<Continent | 'all'>('all');
  const [tab, setTab] = useState<'core' | 'bonus'>('core');
  const list = useMemo(() => {
    const base = tab === 'core' ? COUNTRIES : BONUS;
    const hits = q.trim() ? (tab === 'core' ? coreSearch : bonusSearch).search(q, 60) : base;
    return hits.filter((c) => cont === 'all' || c.continent === cont);
  }, [q, cont, tab]);

  return (
    <div>
      <PageHeader title="Flag Atlas" subtitle="Every national flag with its meaning, memory tricks and look-alikes. Browsing here is for reference — progress comes from practice." />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or alias…" aria-label="Search flags" className="h-11 flex-1 min-w-60 rounded-xl border border-line bg-surface px-4 outline-none focus:border-primary" />
        {showBonus && (
          <div className="flex gap-2" role="group" aria-label="Collection">
            <Chip active={tab === 'core'} onClick={() => setTab('core')}>195 countries</Chip>
            <Chip active={tab === 'bonus'} onClick={() => setTab('bonus')}>Bonus territories</Chip>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Continent">
        <Chip active={cont === 'all'} onClick={() => setCont('all')}>All</Chip>
        {CONTINENTS.map((k) => <Chip key={k} active={cont === k} onClick={() => setCont(k)}>{k}</Chip>)}
      </div>
      <p className="text-sm text-ink-faint mb-3" aria-live="polite">{list.length} flags</p>
      <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((c) => {
          const lvl = levelOf(progress[c.code]);
          return (
            <li key={c.code}>
              <Link to={`/atlas/${c.code}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-3 hover:border-primary transition">
                <div className="stage rounded-xl h-28 grid place-items-center"><Flag code={c.code} height={72} maxWidth={130} /></div>
                <span className="mt-2 font-semibold text-[15px] leading-tight group-hover:text-primary">{c.name}</span>
                <span className="text-xs text-ink-faint">{c.continent}</span>
                {!c.bonus && <span className="mt-1 text-xs flex items-center gap-1"><LevelIcon level={lvl} size={12} /> <span className="text-ink-soft">{LEVEL_INFO[lvl].label}</span></span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
