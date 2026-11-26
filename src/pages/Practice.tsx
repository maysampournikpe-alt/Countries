import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LinkButton } from '../components/ui';
import { BY_CODE } from '../data/countries';
import { shuffle } from '../engine/time';
import { Lesson } from '../quiz/Lesson';
import { QuizRunner, type QuizResult } from '../quiz/QuizRunner';
import { Summary } from '../quiz/Summary';
import { useStore } from '../store/store';

/** Targeted practice for one flag: a lesson if it is new, otherwise recall mixed with its look-alikes. */
export default function Practice() {
  const { code = '' } = useParams();
  const c = BY_CODE[code.toUpperCase()];
  const p = useStore((s) => (c ? s.progress[c.code] : undefined));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isNew] = useState(() => !p?.introduced && !p?.card);
  const questions = useMemo(() => {
    if (!c) return [];
    const mix = shuffle([c.code, ...c.similar.slice(0, 3)]);
    return [...mix, c.code].map((x) => ({ code: x, format: 'recall' as const }));
  }, [c]);

  if (!c || c.bonus) return <div className="py-16 text-center"><h1 className="text-2xl font-semibold">Nothing to practise here</h1><LinkButton to="/atlas" className="mt-4">Back to the Atlas</LinkButton></div>;
  if (isNew) return <Lesson newCodes={[c.code]} reviewCodes={c.similar.filter((s) => useStore.getState().progress[s]?.introduced).slice(0, 3)} title={`${c.name} learned`} />;
  if (result) return <Summary title={`Practice: ${c.name}`} answers={result.answers} />;
  return <QuizRunner questions={questions} mode="practice" requeueWrong onFinish={setResult} header={<p className="mb-3 text-sm text-ink-soft">{c.name} mixed with its look-alikes.</p>} />;
}
