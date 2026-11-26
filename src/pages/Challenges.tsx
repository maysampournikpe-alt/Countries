import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { COUNTRIES } from '../data/countries';
import { useStore } from '../store/store';

export default function Challenges() {
  const records = useStore((s) => s.records);
  const progress = useStore((s) => s.progress);
  const showBonus = useStore((s) => s.settings.showBonus);
  const mistakes = COUNTRIES.filter((c) => (progress[c.code]?.mistakesOpen ?? 0) > 0).length;
  const best = (o: Record<string, number>) => Math.max(0, ...Object.values(o));

  const modes = [
    { to: '/learn', title: 'Smart Training', body: 'The best next flags for you, chosen automatically.', meta: 'Adaptive' },
    { to: '/review', title: 'Daily Review', body: 'Flags due for spaced repetition.', meta: 'Spaced repetition' },
    { to: '/detective', title: 'Flag Detective', body: 'Tell look-alike flags apart, side by side.', meta: 'Discrimination' },
    { to: '/challenges/world', title: 'World Challenge', body: 'Identify all 195 flags.', meta: records.world ? `Best ${records.world.score}/${records.world.total}` : 'No record yet' },
    { to: '/challenges/continental', title: 'Continental Challenge', body: 'All flags of one continent or region.', meta: Object.keys(records.continental).length ? `${Object.keys(records.continental).length} regions attempted` : 'Pick a region' },
    { to: '/challenges/speed', title: 'Speed Challenge', body: 'As many as you can before the clock runs out.', meta: best(records.speed) ? `Best ${best(records.speed)}` : 'Optional timer' },
    { to: '/challenges/mistakes', title: 'Mistake Crusher', body: 'Only flags you have answered incorrectly.', meta: `${mistakes} to crush` },
    { to: '/challenges/reverse', title: 'Reverse Quiz', body: 'See a country name, pick its flag.', meta: 'Name → flag' },
    { to: '/challenges/survival', title: 'Survival Mode', body: 'Keep the streak alive. One mistake (or three) and it ends.', meta: best(records.survival) ? `Best streak ${best(records.survival)}` : 'No record yet' },
    { to: '/challenges/custom', title: 'Custom Quiz', body: 'Choose countries, regions, difficulty, length and format.', meta: 'Your rules' },
    { to: '/exam', title: 'Final Mastery Exam', body: 'All 195 flags, no hints, no options — just the country picker.', meta: records.exam ? `Best ${records.exam.score}/195` : 'The final goal' },
    ...(showBonus ? [{ to: '/challenges/bonus', title: 'Bonus: Territories & more', body: 'Taiwan, Kosovo, Greenland, Puerto Rico and others. Scored separately.', meta: 'Not part of the 195' }] : []),
  ];

  return (
    <div>
      <PageHeader title="Challenges" subtitle="Every mode feeds the same learning engine. Timers are always optional — accuracy and retention matter more than speed." />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => (
          <li key={m.to}>
            <Link to={m.to} className="group block h-full rounded-2xl border border-line bg-surface p-5 hover:border-primary transition">
              <h2 className="text-lg font-semibold group-hover:text-primary">{m.title}</h2>
              <p className="mt-1 text-[15px] text-ink-soft">{m.body}</p>
              <p className="mt-3 text-sm font-semibold text-ink-faint">{m.meta}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
