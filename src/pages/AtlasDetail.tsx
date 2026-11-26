import { LevelIcon } from '../components/LevelIcon';
import { Link, useParams } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { LinkButton, Panel } from '../components/ui';
import { WorldMap } from '../components/WorldMap';
import { BY_CODE } from '../data/countries';
import { groupsFor } from '../data/similar';
import { LEVEL_INFO, levelOf } from '../engine/mastery';
import { ratioLabel } from '../quiz/Compare';
import { useStore } from '../store/store';

export default function AtlasDetail() {
  const { code = '' } = useParams();
  const c = BY_CODE[code.toUpperCase()];
  const p = useStore((s) => (c ? s.progress[c.code] : undefined));
  const bonus = useStore((s) => (c ? s.bonus[c.code] : undefined));
  if (!c) return <div className="py-16 text-center"><h1 className="text-2xl font-semibold">Flag not found</h1><LinkButton to="/atlas" className="mt-4">Back to the Atlas</LinkButton></div>;
  const lvl = levelOf(p);
  const groups = groupsFor(c.code);

  return (
    <div>
      <p className="mb-3"><Link to="/atlas" className="text-sm font-semibold text-primary hover:underline">Flag Atlas</Link></p>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="stage rounded-3xl grid place-items-center p-6 sm:p-10 min-h-64"><Flag code={c.code} height={220} maxWidth={520} /></div>
          <Panel className="mt-4 p-5 sm:p-6">
            <h1 className="text-4xl font-semibold">{c.name}</h1>
            {c.official !== c.name && <p className="text-ink-soft">{c.official}</p>}
            {c.status && <p className="mt-2 text-sm rounded-lg bg-raised px-3 py-2">{c.status} Not part of the 195-country challenge.</p>}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[15px]">
              <div><dt className="text-ink-faint text-sm">Continent</dt><dd>{c.continent}</dd></div>
              <div><dt className="text-ink-faint text-sm">Region</dt><dd>{c.subregion}</dd></div>
              <div className="col-span-2"><dt className="text-ink-faint text-sm">Capital</dt><dd>{c.capital}</dd></div>
              {c.cca2 && <div><dt className="text-ink-faint text-sm">ISO codes</dt><dd className="tabular-nums">{c.cca2} / {c.code}{c.ccn3 && ` / ${c.ccn3}`}</dd></div>}
              <div><dt className="text-ink-faint text-sm">Proportions</dt><dd className="tabular-nums">{ratioLabel(c.ratio)} (height : width)</dd></div>
              {c.aliases.length > 0 && <div className="col-span-2"><dt className="text-ink-faint text-sm">Also known as</dt><dd className="text-ink-soft">{c.aliases.slice(0, 8).join('; ')}</dd></div>}
            </dl>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <h2 className="font-semibold">Visual characteristics</h2>
            <p className="mt-1 text-[15px] text-ink-soft">{c.f}</p>
          </Panel>
          <Panel className="p-5">
            <h2 className="font-semibold">Official and documented symbolism</h2>
            <p className="mt-1 text-[15px] text-ink-soft">{c.s ?? 'No reliably documented official symbolism is recorded here.'}</p>
            {c.n && <p className="mt-2 text-sm rounded-lg bg-raised px-3 py-2">{c.n}</p>}
          </Panel>
          <Panel className="p-5 border-dashed">
            <h2 className="font-semibold">Memory trick</h2>
            <p className="mt-1 text-[15px] text-ink-soft">{c.t}</p>
            <p className="mt-2 text-xs text-ink-faint">An invented mnemonic to help you remember — not an official meaning.</p>
          </Panel>
          {!c.bonus && (
            <Panel className="p-5">
              <h2 className="font-semibold">Your progress</h2>
              <p className="mt-1 text-[15px]"><LevelIcon level={lvl} /> {LEVEL_INFO[lvl].label}</p>
              {p && p.attempts > 0 && <p className="text-sm text-ink-soft">{p.correct} of {p.attempts} correct{p.card && p.card.due.getTime() > Date.now() && `, next review ${p.card.due.toLocaleDateString()}`}</p>}
              <LinkButton to={`/practice/${c.code}`} className="mt-3">Practise this flag</LinkButton>
            </Panel>
          )}
          {c.bonus && bonus && <Panel className="p-5"><p className="text-sm text-ink-soft">Bonus record: {bonus.correct} of {bonus.attempts} correct</p></Panel>}
          <Panel className="p-4"><WorldMap highlight={c.code} label={`Location of ${c.name}`} compact /></Panel>
        </div>
      </div>

      {c.similar.length > 0 && (
        <Panel className="mt-5 p-5">
          <h2 className="font-semibold">Similar flags</h2>
          <ul className="mt-3 flex flex-wrap gap-4">
            {c.similar.map((s) => (
              <li key={s}>
                <Link to={`/atlas/${s}`} className="flex flex-col items-center gap-2 rounded-xl p-2 hover:bg-raised">
                  <Flag code={s} height={48} maxWidth={96} />
                  <span className="text-sm">{BY_CODE[s].name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-3">
            {groups.map((g) => <Link key={g.id} to={`/detective/${g.id}`} className="text-sm font-semibold text-primary hover:underline">Compare: {g.title}</Link>)}
          </div>
        </Panel>
      )}
    </div>
  );
}
