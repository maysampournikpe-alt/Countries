import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { Button, Chip, LinkButton, PageHeader, Panel } from '../components/ui';
import { ALL, BONUS, BY_CODE, CONTINENTS, COUNTRIES, type Continent, type Country } from '../data/countries';
import { levelOf } from '../engine/mastery';
import { shuffle } from '../engine/time';
import { QuizRunner, type Question, type QuizResult } from '../quiz/QuizRunner';
import { Summary } from '../quiz/Summary';
import { createSearcher } from '../search/countrySearch';
import { useStore } from '../store/store';

type Fmt = 'recall' | 'mc' | 'reverse' | 'mixed';
type Difficulty = 'all' | 'new' | 'learning' | 'troubled' | 'mastered';
interface Config {
  format: Fmt;
  region: string; // 'all' | continent | subregion
  duration: number;
  lives: number;
  count: number; // 0 = all
  difficulty: Difficulty;
  codes: string[];
  perQuestionSec: number;
  continents: Continent[];
}
const DEFAULT: Config = { format: 'recall', region: 'all', duration: 60, lives: 3, count: 20, difficulty: 'all', codes: [], perQuestionSec: 0, continents: [] };

const META: Record<string, { title: string; subtitle: string }> = {
  world: { title: 'World Challenge', subtitle: 'All 195 national flags in random order.' },
  continental: { title: 'Continental Challenge', subtitle: 'Every flag of one continent or region.' },
  speed: { title: 'Speed Challenge', subtitle: 'Identify as many flags as possible before time runs out. Wrong answers show the correction while the clock keeps running.' },
  mistakes: { title: 'Mistake Crusher', subtitle: 'Only flags you have answered incorrectly. Missed flags come back until you get each right twice in a row.' },
  reverse: { title: 'Reverse Quiz', subtitle: 'You see the country name — pick its flag from look-alikes.' },
  survival: { title: 'Survival Mode', subtitle: 'How long can you keep a correct-answer streak going?' },
  custom: { title: 'Custom Quiz', subtitle: 'Choose countries, regions, difficulty, length and answer format.' },
  bonus: { title: 'Bonus: Territories & more', subtitle: 'Taiwan, Kosovo, Greenland, Puerto Rico and other entities. Scored separately — never mixed into the 195.' },
};

const SUBREGIONS = [...new Set(COUNTRIES.map((c) => c.subregion))].sort();

function poolFor(region: string): Country[] {
  if (region === 'all') return COUNTRIES;
  if ((CONTINENTS as string[]).includes(region)) return COUNTRIES.filter((c) => c.continent === region);
  return COUNTRIES.filter((c) => c.subregion === region);
}

function toQuestion(code: string, f: Fmt): Question {
  const format = f === 'mixed' ? (['recall', 'mc', 'reverse'] as const)[Math.floor(Math.random() * 3)] : f;
  return { code, format };
}

export default function ChallengeMode() {
  const { mode = '' } = useParams();
  const meta = META[mode];
  const progress = useStore((s) => s.progress);
  const [cfg, setCfg] = useState<Config>(() => ({ ...DEFAULT, format: mode === 'reverse' ? 'reverse' : mode === 'speed' ? 'mc' : 'recall', lives: mode === 'survival' ? 1 : 3 }));
  const [run, setRun] = useState<{ questions: Question[]; cfg: Config; id: number } | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  if (!meta) return <div className="py-16 text-center"><h1 className="text-2xl font-semibold">Unknown challenge</h1><LinkButton to="/challenges" className="mt-4">All challenges</LinkButton></div>;

  const mistakes = COUNTRIES.filter((c) => (progress[c.code]?.mistakesOpen ?? 0) > 0).sort((a, b) => (progress[b.code]?.wrong ?? 0) - (progress[a.code]?.wrong ?? 0)).map((c) => c.code);

  const build = (): Question[] => {
    if (mode === 'world') return shuffle(COUNTRIES).map((c) => toQuestion(c.code, cfg.format));
    if (mode === 'continental') return shuffle(poolFor(cfg.region)).map((c) => toQuestion(c.code, cfg.format));
    if (mode === 'mistakes') return mistakes.map((code) => ({ code, format: 'recall' }));
    if (mode === 'reverse') return shuffle(poolFor(cfg.region)).slice(0, cfg.count || undefined).map((c) => ({ code: c.code, format: 'reverse' }));
    if (mode === 'bonus') return shuffle(BONUS).map((c) => ({ code: c.code, format: 'recall' }));
    if (mode === 'custom') {
      let pool = cfg.codes.length ? cfg.codes.map((c) => BY_CODE[c]) : cfg.continents.length ? COUNTRIES.filter((c) => cfg.continents.includes(c.continent)) : COUNTRIES;
      if (cfg.difficulty !== 'all')
        pool = pool.filter((c) => {
          const p = progress[c.code];
          const l = levelOf(p);
          if (cfg.difficulty === 'troubled') return (p?.wrong ?? 0) > 0 && (p?.mistakesOpen ?? 0) > 0;
          if (cfg.difficulty === 'learning') return l === 'learning' || l === 'reviewing' || l === 'provisional';
          return l === cfg.difficulty;
        });
      return shuffle(pool).slice(0, cfg.count || undefined).map((c) => toQuestion(c.code, cfg.format));
    }
    // speed & survival are endless; seed with one question
    const pool = poolFor(cfg.region);
    return [toQuestion(pool[Math.floor(Math.random() * pool.length)].code, cfg.format)];
  };

  if (result && run) return <Result mode={mode} cfg={run.cfg} result={result} onAgain={() => { setResult(null); setRun(null); }} />;

  if (run) {
    const endless = mode === 'speed' || mode === 'survival';
    return (
      <Endless key={run.id} mode={mode} cfg={run.cfg} questions={run.questions} endless={endless} onFinish={setResult} />
    );
  }

  const questions = mode === 'speed' || mode === 'survival' ? null : build();
  const empty = questions && questions.length === 0;

  return (
    <div className="max-w-3xl">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />
      <Panel className="p-6 space-y-5">
        {(mode === 'world' || mode === 'continental' || mode === 'speed' || mode === 'survival' || mode === 'custom') && (
          <Field label="Answer format">
            {(mode === 'custom' ? (['recall', 'mc', 'reverse', 'mixed'] as Fmt[]) : (['recall', 'mc'] as Fmt[])).map((f) => (
              <Chip key={f} active={cfg.format === f} onClick={() => setCfg({ ...cfg, format: f })}>{f === 'recall' ? 'Type / pick (recall)' : f === 'mc' ? 'Multiple choice' : f === 'reverse' ? 'Name → flag' : 'Mixed'}</Chip>
            ))}
          </Field>
        )}
        {(mode === 'continental' || mode === 'speed' || mode === 'reverse') && (
          <Field label="Region">
            {mode !== 'continental' && <Chip active={cfg.region === 'all'} onClick={() => setCfg({ ...cfg, region: 'all' })}>Whole world</Chip>}
            {CONTINENTS.map((k) => <Chip key={k} active={cfg.region === k} onClick={() => setCfg({ ...cfg, region: k })}>{k}</Chip>)}
            {mode === 'continental' && (
              <select aria-label="Or choose a sub-region" value={(SUBREGIONS as string[]).includes(cfg.region) ? cfg.region : ''} onChange={(e) => e.target.value && setCfg({ ...cfg, region: e.target.value })} className="h-9 rounded-full border border-line bg-surface text-ink px-3 text-sm">
                <option value="">Sub-region…</option>
                {SUBREGIONS.map((s) => <option key={s} value={s}>{s} ({poolFor(s).length})</option>)}
              </select>
            )}
          </Field>
        )}
        {mode === 'speed' && (
          <Field label="Time limit">
            {[30, 60, 120, 180].map((d) => <Chip key={d} active={cfg.duration === d} onClick={() => setCfg({ ...cfg, duration: d })}>{d < 60 ? `${d} s` : `${d / 60} min`}</Chip>)}
          </Field>
        )}
        {mode === 'survival' && (
          <Field label="Lives">
            {[1, 3].map((l) => <Chip key={l} active={cfg.lives === l} onClick={() => setCfg({ ...cfg, lives: l })}>{l === 1 ? 'Sudden death (1)' : '3 lives'}</Chip>)}
          </Field>
        )}
        {(mode === 'reverse' || mode === 'custom') && (
          <Field label="Number of questions">
            {[10, 20, 50, 0].map((n) => <Chip key={n} active={cfg.count === n} onClick={() => setCfg({ ...cfg, count: n })}>{n || 'All'}</Chip>)}
          </Field>
        )}
        {mode === 'custom' && <CustomFields cfg={cfg} setCfg={setCfg} />}
        {mode === 'continental' && cfg.region === 'all' && <p className="text-sm text-ink-soft">Choose a continent or sub-region to begin.</p>}

        {mode === 'mistakes' && (
          mistakes.length ? (
            <ul className="flex flex-wrap gap-2">
              {mistakes.slice(0, 30).map((c) => <li key={c} className="flex items-center gap-2 rounded-lg bg-raised px-2.5 py-1.5 text-sm"><Flag code={c} height={16} maxWidth={30} />{BY_CODE[c].name}</li>)}
            </ul>
          ) : (
            <p className="text-ink-soft">No unresolved mistakes. Nicely done — mistakes from any mode will appear here.</p>
          )
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button size="lg" disabled={!!empty || (mode === 'continental' && cfg.region === 'all')} onClick={() => setRun({ questions: questions ?? build(), cfg: { ...cfg }, id: Date.now() })}>
            Start{questions && !empty ? ` (${questions.length} flags)` : ''}
          </Button>
          {empty && mode === 'custom' && <span className="text-sm text-ink-soft">No flags match these filters.</span>}
          <Link to="/challenges" className="text-sm font-semibold text-primary hover:underline">All challenges</Link>
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function CustomFields({ cfg, setCfg }: { cfg: Config; setCfg: (c: Config) => void }) {
  const [q, setQ] = useState('');
  const searcher = useMemo(() => createSearcher(COUNTRIES), []);
  const hits = q ? searcher.search(q, 6).filter((c) => !cfg.codes.includes(c.code)) : [];
  return (
    <>
      <Field label="Continents">
        {CONTINENTS.map((k) => (
          <Chip key={k} active={cfg.continents.includes(k)} onClick={() => setCfg({ ...cfg, continents: cfg.continents.includes(k) ? cfg.continents.filter((x) => x !== k) : [...cfg.continents, k] })}>{k}</Chip>
        ))}
      </Field>
      <div>
        <label htmlFor="custom-add" className="text-sm font-semibold">Specific countries (optional — overrides continents)</label>
        <input id="custom-add" name="custom-country" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a country…" className="mt-2 w-full h-11 rounded-xl border border-line bg-raised px-3 outline-none focus:border-primary" />
        {hits.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {hits.map((c) => <Chip key={c.code} onClick={() => { setCfg({ ...cfg, codes: [...cfg.codes, c.code] }); setQ(''); }}>+ {c.name}</Chip>)}
          </div>
        )}
        {cfg.codes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {cfg.codes.map((c) => <Chip key={c} active onClick={() => setCfg({ ...cfg, codes: cfg.codes.filter((x) => x !== c) })}>{BY_CODE[c].name} ✕</Chip>)}
          </div>
        )}
      </div>
      <Field label="Difficulty">
        {(['all', 'new', 'learning', 'troubled', 'mastered'] as Difficulty[]).map((d) => (
          <Chip key={d} active={cfg.difficulty === d} onClick={() => setCfg({ ...cfg, difficulty: d })}>{{ all: 'All flags', new: 'Not studied', learning: 'In progress', troubled: 'Troubled', mastered: 'Mastered' }[d]}</Chip>
        ))}
      </Field>
      <Field label="Timer per question (optional)">
        {[0, 10, 20].map((s) => <Chip key={s} active={cfg.perQuestionSec === s} onClick={() => setCfg({ ...cfg, perQuestionSec: s })}>{s ? `${s} s` : 'Off'}</Chip>)}
      </Field>
    </>
  );
}

function Endless({ mode, cfg, questions, endless, onFinish }: { mode: string; cfg: Config; questions: Question[]; endless: boolean; onFinish: (r: QuizResult) => void }) {
  const pool = useMemo(() => poolFor(cfg.region), [cfg.region]);
  const cycle = useRef<string[]>([]);
  const last = useRef<string>(questions[0]?.code);
  const next = () => {
    if (!cycle.current.length) cycle.current = shuffle(pool.map((c) => c.code)).filter((c) => c !== last.current);
    const code = cycle.current.pop()!;
    last.current = code;
    return toQuestion(code, cfg.format);
  };
  return (
    <QuizRunner
      questions={questions}
      mode={mode}
      next={endless ? next : undefined}
      timeLimitSec={mode === 'speed' ? cfg.duration : undefined}
      lives={mode === 'survival' ? cfg.lives : undefined}
      perQuestionSec={mode === 'custom' && cfg.perQuestionSec ? cfg.perQuestionSec : undefined}
      requeueWrong={mode === 'mistakes'}
      pool={mode === 'bonus' ? ALL : COUNTRIES}
      bonus={mode === 'bonus'}
      onFinish={onFinish}
    />
  );
}

function Result({ mode, cfg, result, onAgain }: { mode: string; cfg: Config; result: QuizResult; onAgain: () => void }) {
  const setRecord = useStore((s) => s.setRecord);
  const setWorldRecord = useStore((s) => s.setWorldRecord);
  const completeSession = useStore((s) => s.completeSession);
  const records = useStore((s) => s.records);
  const correct = result.answers.filter((a) => a.correct).length;
  const score = useMemo(() => {
    if (mode !== 'survival') return correct;
    let run = 0;
    let best = 0;
    for (const a of result.answers) best = Math.max(best, (run = a.correct ? run + 1 : 0));
    return best;
  }, [mode, result, correct]);
  const prev = useRef(mode === 'speed' ? records.speed[`${cfg.duration}-${cfg.format}-${cfg.region}`] : undefined);
  const saved = useRef(false);
  const [newRecord, setNewRecord] = useState(false);
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    let nr = false;
    if (mode === 'speed') nr = setRecord('speed', `${cfg.duration}-${cfg.format}-${cfg.region}`, correct);
    if (mode === 'survival') nr = setRecord('survival', `${cfg.format}-${cfg.lives}`, score);
    if (mode === 'world' && !result.stoppedEarly) nr = setWorldRecord(correct, result.answers.length, result.durationMs);
    if (mode === 'continental' && !result.stoppedEarly && result.answers.length) nr = setRecord('continental', cfg.region, Math.round((correct / result.answers.length) * 100));
    if (mode !== 'bonus' && result.answers.length) completeSession({});
    setNewRecord(nr);
  }, [mode, cfg, result, correct, score, setRecord, setWorldRecord, completeSession]);

  const label = mode === 'survival' ? `Longest streak: ${score}` : mode === 'speed' ? `${correct} correct in ${cfg.duration} seconds` : `${correct} of ${result.answers.length} correct`;
  return (
    <Summary
      title={META[mode].title}
      answers={result.answers}
      onAgain={onAgain}
      extra={
        <p className="mt-4 text-lg">
          {label}
          {newRecord && <span className="ml-2 font-semibold text-brass">New personal record!</span>}
          {!newRecord && prev.current != null && mode === 'speed' && <span className="ml-2 text-ink-soft">Personal best: {prev.current}</span>}
          {mode === 'bonus' && <span className="block text-sm text-ink-soft">Bonus results are kept separate from your 195-country progress.</span>}
        </p>
      }
    />
  );
}
