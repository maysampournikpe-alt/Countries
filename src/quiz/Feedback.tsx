import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from '../components/Flag';
import { Button, Kbd } from '../components/ui';
import { BY_CODE } from '../data/countries';
import { SIMILAR_GROUPS } from '../data/similar';

/** Immediate corrective feedback: on a miss, show the flag you saw next to the flag of the country you named, with the distinguishing cue. */
export function Feedback({ code, chosen, onNext, xp }: { code: string; chosen: string | null; onNext: () => void; xp?: number }) {
  const correct = chosen === code;
  const c = BY_CODE[code];
  const other = chosen && chosen !== code ? BY_CODE[chosen] : null;
  const group = other ? SIMILAR_GROUPS.find((g) => g.members.includes(code) && g.members.includes(other.code)) : undefined;
  const btn = useRef<HTMLButtonElement>(null);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;
  useEffect(() => {
    btn.current?.focus({ preventScroll: true });
    if (!correct) return;
    const t = setTimeout(() => nextRef.current(), 1400); // correct answers move on by themselves; misses wait for you
    return () => clearTimeout(t);
  }, [correct]);

  return (
    <div role="status" aria-live="assertive" className={`anim-rise rounded-2xl border-2 p-4 sm:p-5 ${correct ? 'border-good bg-good-soft anim-pop' : 'border-bad bg-bad-soft anim-shake'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold">
          {correct ? <span className="text-good">✓ Correct — {c.name}</span> : <span className="text-bad">✗ This is {c.name}</span>}
        </p>
        {!!xp && <span className="text-sm font-semibold text-brass">+{xp} XP</span>}
      </div>

      {other && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-6">
          <figure className="min-w-0">
            <Flag code={c.code} height={64} maxWidth={150} />
            <figcaption className="mt-2 text-sm"><b>{c.name}</b> (shown){group && <span className="block text-ink-soft">{group.cues[c.code]}</span>}</figcaption>
          </figure>
          <figure className="min-w-0">
            <Flag code={other.code} height={64} maxWidth={150} />
            <figcaption className="mt-2 text-sm"><b>{other.name}</b> (your answer){group && <span className="block text-ink-soft">{group.cues[other.code]}</span>}</figcaption>
          </figure>
        </div>
      )}

      <p className="mt-3 text-[15px] text-ink-soft"><span className="font-semibold text-ink">Memory trick: </span>{c.t}</p>
      {group?.subtlety === 3 && <p className="mt-1 text-sm text-ink-faint">These flags are nearly identical — this is one of the hardest distinctions in the world of flags.</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button ref={btn} onClick={onNext}>Continue <Kbd>Enter</Kbd></Button>
        {group && <Link to={`/detective/${group.id}`} className="text-sm font-semibold text-primary hover:underline">Train this look-alike group</Link>}
      </div>
    </div>
  );
}
