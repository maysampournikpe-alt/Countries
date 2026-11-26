import { Flag } from '../components/Flag';
import { BY_CODE } from '../data/countries';
import type { SimilarGroup } from '../data/similar';

export const SUBTLETY = { 1: 'Clear once you know where to look', 2: 'Tricky', 3: 'Extremely subtle' } as const;

/** Side-by-side comparison at authentic proportions, with the exact differences spelled out. */
export function CompareView({ group, focus }: { group: SimilarGroup; focus?: string[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-semibold">{group.title}</h2>
        <span className={`text-sm font-semibold ${group.subtlety === 3 ? 'text-bad' : group.subtlety === 2 ? 'text-brass' : 'text-good'}`}>{SUBTLETY[group.subtlety]}</span>
      </div>
      <div className="stage mt-4 rounded-3xl p-4 sm:p-6 grid gap-5 grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
        {group.members.map((m) => (
          <figure key={m} className={`flex flex-col items-center text-center ${focus && !focus.includes(m) ? 'opacity-80' : ''}`}>
            <div className="h-[110px] grid place-items-center"><Flag code={m} height={96} maxWidth={190} /></div>
            <figcaption className="mt-2">
              <b className="block">{BY_CODE[m].name}</b>
              <span className="text-sm text-ink-soft">{group.cues[m]}</span>
              <span className="block text-xs text-ink-faint tabular-nums">Proportions {ratioLabel(BY_CODE[m].ratio)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-[15px]">
        {group.differences.map((d, i) => (
          <li key={i} className="flex gap-2"><span className="text-primary" aria-hidden>▸</span><span>{d}</span></li>
        ))}
      </ul>
    </div>
  );
}

const KNOWN: [number, string][] = [[1, '1:1'], [1.5, '2:3'], [2, '1:2'], [5 / 3, '3:5'], [4 / 3, '3:4'], [1.25, '4:5'], [1.9, '10:19'], [7 / 4, '4:7'], [28 / 11, '11:28'], [15 / 13, '13:15'], [37 / 28, '28:37'], [11 / 8, '8:11'], [1.6, '5:8'], [20 / 11, '11:20'], [25 / 18, '18:25'], [7 / 6, '6:7'], [1.4, '5:7'], [10 / 7, '7:10'], [22 / 16, '16:22']];
export function ratioLabel(r: number) {
  const hit = KNOWN.find(([v]) => Math.abs(v - r) < 0.006);
  return hit ? hit[1] : r < 1 ? `${(1 / r).toFixed(2)}:1` : `1:${r.toFixed(2)}`;
}
