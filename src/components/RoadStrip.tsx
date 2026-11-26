import { LevelIcon } from './LevelIcon';
import { useMemo } from 'react';
import { CONTINENTS, COUNTRIES } from '../data/countries';
import { LEVEL_INFO, levelOf, type Level } from '../engine/mastery';
import { useStore } from '../store/store';

const ORDER: Level[] = ['mastered', 'provisional', 'reviewing', 'learning', 'new'];

/** The signature "Road to 195": one segment per country, grouped by continent, coloured by mastery. */
export function RoadStrip({ tall = false }: { tall?: boolean }) {
  const progress = useStore((s) => s.progress);
  const segments = useMemo(() => {
    const out: { code: string; level: Level; continent: string }[] = [];
    for (const k of CONTINENTS) {
      const list = COUNTRIES.filter((c) => c.continent === k).map((c) => ({ code: c.code, level: levelOf(progress[c.code]), continent: k }));
      list.sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level));
      out.push(...list);
    }
    return out;
  }, [progress]);
  const counts = useMemo(() => {
    const m: Record<Level, number> = { new: 0, learning: 0, reviewing: 0, provisional: 0, mastered: 0 };
    segments.forEach((s) => m[s.level]++);
    return m;
  }, [segments]);
  const label = `Road to 195: ${counts.mastered} mastered, ${counts.provisional} provisionally mastered, ${counts.reviewing} reviewing, ${counts.learning} learning, ${counts.new} not studied`;

  return (
    <div>
      <div role="img" aria-label={label} className={`flex items-end gap-0 sm:gap-px lg:gap-[2px] ${tall ? 'h-16' : 'h-10'}`}>
        {segments.map((s, i) => {
          const gap = i > 0 && segments[i - 1].continent !== s.continent;
          const h = s.level === 'mastered' ? 100 : s.level === 'provisional' ? 82 : s.level === 'reviewing' ? 70 : s.level === 'learning' ? 52 : 30;
          return <span key={s.code} className={`flex-1 rounded-[2px] transition-[height,background-color] duration-500 ${gap ? 'ml-1 sm:ml-1.5' : ''}`} style={{ height: `${h}%`, background: LEVEL_INFO[s.level].color }} />;
        })}
      </div>
      <div className="mt-1.5 flex text-[11px] text-ink-faint" aria-hidden>
        {CONTINENTS.map((k) => (
          <span key={k} style={{ flex: COUNTRIES.filter((c) => c.continent === k).length }} className="truncate">{k}</span>
        ))}
      </div>
    </div>
  );
}

export function LevelLegend({ counts }: { counts?: Record<Level, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
      {(Object.keys(LEVEL_INFO) as Level[]).reverse().map((l) => (
        <li key={l} className="flex items-center gap-1.5">
          <LevelIcon level={l} />
          {LEVEL_INFO[l].label}
          {counts && <b className="text-ink tabular-nums">{counts[l]}</b>}
        </li>
      ))}
    </ul>
  );
}
