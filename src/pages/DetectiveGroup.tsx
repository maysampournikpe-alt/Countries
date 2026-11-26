import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { Button, LinkButton, Panel } from '../components/ui';
import { BY_CODE } from '../data/countries';
import { GROUP_BY_ID, SIMILAR_GROUPS, type SimilarGroup } from '../data/similar';
import { shuffle } from '../engine/time';
import { CompareView } from '../quiz/Compare';
import { QuizRunner, type Question, type QuizResult } from '../quiz/QuizRunner';
import { useStore } from '../store/store';

const STREAK_TO_CLEAR = 3;

/** Personal pair "pair-AAA-BBB" or a curated group id. */
function resolve(id: string): SimilarGroup | null {
  if (GROUP_BY_ID[id]) return GROUP_BY_ID[id];
  const m = id.match(/^pair-([A-Z]{3})-([A-Z]{3})$/);
  if (!m || !BY_CODE[m[1]] || !BY_CODE[m[2]]) return null;
  const [a, b] = [BY_CODE[m[1]], BY_CODE[m[2]]];
  const curated = SIMILAR_GROUPS.find((g) => g.members.includes(a.code) && g.members.includes(b.code));
  return {
    id,
    title: `${a.name} vs ${b.name}`,
    members: [a.code, b.code],
    subtlety: curated?.subtlety ?? 1,
    differences: curated ? curated.differences : [`${a.name}: ${a.f}`, `${b.name}: ${b.f}`],
    cues: { [a.code]: curated?.cues[a.code] ?? a.t, [b.code]: curated?.cues[b.code] ?? b.t },
  };
}

export default function DetectiveGroup() {
  const { id = '' } = useParams();
  const group = useMemo(() => resolve(id), [id]);
  const [drill, setDrill] = useState(0);
  if (!group) return <div className="py-16 text-center"><h1 className="text-2xl font-semibold">Comparison not found</h1><LinkButton to="/detective" className="mt-4">Back to Flag Detective</LinkButton></div>;
  if (drill) return <Drill key={drill} group={group} onExit={() => setDrill(0)} onAgain={() => setDrill((d) => d + 1)} />;
  return (
    <div className="max-w-4xl">
      <p className="mb-3"><Link to="/detective" className="text-sm font-semibold text-primary hover:underline">Flag Detective</Link></p>
      <Panel className="p-5 sm:p-7">
        <CompareView group={group} />
        <Button size="lg" className="mt-6" onClick={() => setDrill(1)}>Start the drill</Button>
        <p className="mt-2 text-sm text-ink-soft">You will see these flags in both directions until you answer each one correctly {STREAK_TO_CLEAR} times in a row.</p>
      </Panel>
    </div>
  );
}

function Drill({ group, onExit, onAgain }: { group: SimilarGroup; onExit: () => void; onAgain: () => void }) {
  const clear = useStore((s) => s.clearDetective);
  const members = group.members;
  const streaks = useRef<Record<string, number>>(Object.fromEntries(members.map((m) => [m, 0])));
  const [, force] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const last = useRef('');

  const make = (): Question => {
    // Prefer members that are furthest from the target streak; never the same flag twice in a row.
    const candidates = shuffle(members.filter((m) => m !== last.current || members.length === 1)).sort((a, b) => streaks.current[a] - streaks.current[b]);
    const code = Math.random() < 0.7 ? candidates[0] : candidates[candidates.length - 1];
    last.current = code;
    const format = Math.random() < 0.65 ? 'mc' : 'reverse';
    const options = shuffle(members.length > 4 ? [code, ...shuffle(members.filter((m) => m !== code)).slice(0, 3)] : members);
    return { code, format, options };
  };
  const first = useMemo(make, []); // one starting question per drill

  if (result) {
    const ok = members.every((m) => streaks.current[m] >= STREAK_TO_CLEAR);
    return (
      <div className="mx-auto max-w-2xl text-center py-8">
        <h1 className="text-3xl font-semibold">{ok ? 'Case closed' : 'Drill paused'}</h1>
        <p className="mt-2 text-ink-soft">{ok ? `You reliably tell ${members.map((m) => BY_CODE[m].name).join(', ')} apart.` : 'Come back any time — the drill continues until each flag is right three times in a row.'}</p>
        <p className="mt-2 text-ink-soft">{result.answers.filter((a) => a.correct).length} of {result.answers.length} correct</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={onExit}>Back to comparison</Button>
          <Button onClick={onAgain}>Drill again</Button>
          <LinkButton to="/detective" variant="ghost">All groups</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl mb-4 flex flex-wrap items-center gap-3" aria-label="Drill progress">
        {members.map((m) => (
          <span key={m} className="flex items-center gap-2 rounded-xl bg-surface border border-line px-2.5 py-1.5 text-sm">
            <Flag code={m} height={18} maxWidth={34} />
            {BY_CODE[m].name}
            <span aria-label={`${Math.min(streaks.current[m], STREAK_TO_CLEAR)} of ${STREAK_TO_CLEAR}`} className="tracking-widest text-good">{'●'.repeat(Math.min(streaks.current[m], STREAK_TO_CLEAR))}<span className="text-line">{'●'.repeat(Math.max(0, STREAK_TO_CLEAR - streaks.current[m]))}</span></span>
          </span>
        ))}
      </div>
      <QuizRunner
        questions={[first]}
        mode="detective"
        graded={false}
        stopLabel="Stop drill"
        next={make}
        shouldStop={() => members.every((m) => streaks.current[m] >= STREAK_TO_CLEAR)}
        onAnswer={(a) => {
          streaks.current[a.code] = a.correct ? streaks.current[a.code] + 1 : 0;
          if (members.every((m) => streaks.current[m] >= STREAK_TO_CLEAR) && !group.id.startsWith('pair-')) clear(group.id);
          force((x) => x + 1);
        }}
        onFinish={setResult}
      />
    </div>
  );
}

