import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryPicker } from '../components/CountryPicker';
import { Flag, StageFlag } from '../components/Flag';
import { Bar, Button, Chip, LinkButton, PageHeader, Panel } from '../components/ui';
import { BY_CODE, CORE_CODES } from '../data/countries';
import { CHECKPOINT_EVERY, DIAG_LABELS, summarize } from '../engine/diagnostic';
import { shuffle } from '../engine/time';
import type { DiagCategory, Settings } from '../engine/types';
import { useStore } from '../store/store';

export default function Diagnostic() {
  const diag = useStore((s) => s.diagnostic);
  const start = useStore((s) => s.startDiagnostic);
  if (!diag) return <Intro onStart={() => start(shuffle(CORE_CODES))} />;
  if (diag.completedAt) return <Results />;
  return <Runner />;
}

function Intro({ onStart }: { onStart: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Diagnostic assessment" subtitle="Find out which flags you already recognise, so you never have to relearn them." />
      <Panel className="p-6 space-y-3 text-[15px] text-ink-soft">
        <p><b className="text-ink">All 195 flags, in random order.</b> Type or pick the country. Spelling never matters.</p>
        <p><b className="text-ink">No answers are revealed until the end</b>, so earlier questions can't influence later ones.</p>
        <p><b className="text-ink">Be honest about confidence.</b> Use "I'm sure", "Just a guess" or "I don't know". It shapes your plan.</p>
        <p><b className="text-ink">Take breaks whenever you like.</b> There is a checkpoint every {CHECKPOINT_EVERY} flags, and everything is saved as you go.</p>
      </Panel>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="lg" onClick={onStart}>Start the diagnostic</Button>
        <Button size="lg" variant="ghost" onClick={() => navigate('/learn')}>Skip and learn from scratch</Button>
      </div>
    </div>
  );
}

function Runner() {
  const diag = useStore((s) => s.diagnostic)!;
  const answerDiagnostic = useStore((s) => s.answerDiagnostic);
  const finish = useStore((s) => s.finishDiagnostic);
  const navigate = useNavigate();
  const done = Object.keys(diag.answers).length;
  const remaining = diag.order.filter((c) => !diag.answers[c]);
  const [checkpoint, setCheckpoint] = useState(false);
  const shownAt = useRef(Date.now());
  const code = remaining[0];

  if (!code) {
    return (
      <div className="mx-auto max-w-xl text-center py-10">
        <h1 className="text-3xl font-semibold">All 195 answered</h1>
        <p className="mt-2 text-ink-soft">See what you already know and get your personal plan.</p>
        <Button size="lg" className="mt-6" onClick={finish}>See my results</Button>
      </div>
    );
  }

  if (checkpoint) {
    return (
      <div className="mx-auto max-w-xl py-6">
        <Panel className="p-8 text-center">
          <p className="text-ink-soft">Checkpoint {done / CHECKPOINT_EVERY} of {Math.ceil(195 / CHECKPOINT_EVERY)}</p>
          <h1 className="mt-1 text-3xl font-semibold">{done} of 195 done</h1>
          <Bar className="mt-5" value={done} max={195} label="Diagnostic progress" />
          <p className="mt-5 text-ink-soft">Your answers are saved. Take a break and come back any time, or keep going.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => { setCheckpoint(false); shownAt.current = Date.now(); }}>Keep going</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Take a break</Button>
            <Button variant="ghost" onClick={finish}>Finish now with {done} answers</Button>
          </div>
          <p className="mt-3 text-xs text-ink-faint">If you finish now, unanswered flags are treated as not yet studied.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1"><Bar value={done} max={195} label="Diagnostic progress" /></div>
        <span className="text-sm font-semibold tabular-nums text-ink-soft">{done + 1} / 195</span>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Pause</Button>
      </div>
      <StageFlag code={code} />
      <div className="mt-5">
        <CountryPicker
          key={code}
          variant="diagnostic"
          onSubmit={(chosen, confidence) => {
            answerDiagnostic(code, { answer: chosen, correct: chosen === code, ms: Date.now() - shownAt.current, confidence });
            shownAt.current = Date.now();
            const n = done + 1;
            if (n % CHECKPOINT_EVERY === 0 && n < 195) setCheckpoint(true);
          }}
        />
      </div>
      <p className="mt-4 text-sm text-ink-faint text-center">No feedback during the diagnostic. Results come at the end.</p>
    </div>
  );
}

const ORDER: DiagCategory[] = ['known', 'uncertain', 'confused', 'unfamiliar'];
const COLORS: Record<DiagCategory, string> = { known: 'var(--lvl-mastered)', uncertain: 'var(--lvl-reviewing)', confused: 'var(--lvl-learning)', unfamiliar: 'var(--lvl-new)' };

function Results() {
  const diag = useStore((s) => s.diagnostic)!;
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const discard = useStore((s) => s.discardDiagnostic);
  const groups = summarize(diag.answers);
  const [open, setOpen] = useState<DiagCategory>('confused');
  const toLearn = groups.confused.length + groups.unfamiliar.length + (195 - Object.keys(diag.answers).length);
  const perDay = Math.max(4, Math.round((settings.dailyMinutes || 30) / 2));
  const days = Math.ceil(toLearn / perDay);

  return (
    <div>
      <PageHeader title="Your diagnostic results" subtitle={`You answered ${Object.keys(diag.answers).length} flags. Here is where you stand and your personal learning plan.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((k) => (
          <button key={k} onClick={() => setOpen(k)} aria-pressed={open === k} className={`text-left rounded-2xl border-2 p-4 bg-surface transition ${open === k ? 'border-primary' : 'border-line hover:border-ink-faint'}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ background: COLORS[k] }} aria-hidden />
            <span className="font-semibold">{DIAG_LABELS[k].title}</span>
            <p className="font-display text-4xl font-semibold tabular-nums mt-1">{groups[k].length}</p>
            <p className="text-sm text-ink-soft mt-1">{DIAG_LABELS[k].blurb}</p>
          </button>
        ))}
      </div>

      <Panel className="mt-4 p-5">
        <h2 className="font-semibold text-lg">{DIAG_LABELS[open].title}</h2>
        {groups[open].length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups[open].sort((a, b) => BY_CODE[a].name.localeCompare(BY_CODE[b].name)).map((c) => {
              const a = diag.answers[c];
              return (
                <li key={c} className="flex items-center gap-3">
                  <Flag code={c} height={34} maxWidth={70} />
                  <span className="text-[15px]">
                    <b>{BY_CODE[c].name}</b>
                    {!a.correct && a.answer && <span className="block text-sm text-ink-soft">You said {BY_CODE[a.answer].name}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-ink-soft">None in this group.</p>
        )}
      </Panel>

      <Panel className="mt-4 p-6">
        <h2 className="text-xl font-semibold">Your learning plan</h2>
        <ol className="mt-3 space-y-2 text-[15px] text-ink-soft">
          <li><b className="text-ink">Keep what you know.</b> {groups.known.length} provisionally mastered flags get a delayed check in a few days instead of lessons.</li>
          <li><b className="text-ink">Firm up the uncertain ones.</b> {groups.uncertain.length} flags go straight into short spaced reviews.</li>
          <li><b className="text-ink">Untangle confusions first.</b> {groups.confused.length} confused flags are taught first, side by side with their look-alikes.</li>
          <li><b className="text-ink">Learn the rest in small groups.</b> {toLearn} flags to learn, 5–7 at a time. At about {perDay} new flags per day, that is roughly {days} study days.</li>
        </ol>
        <div className="mt-5">
          <p className="text-sm font-semibold mb-2">How much time per day?</p>
          <div className="flex flex-wrap gap-2">
            {([5, 10, 15, 20, 30, 0] as Settings['dailyMinutes'][]).map((m) => (
              <Chip key={m} active={settings.dailyMinutes === m} onClick={() => setSettings({ dailyMinutes: m })}>{m ? `${m} min` : 'Unlimited'}</Chip>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton to="/learn" size="lg">Start my first session</LinkButton>
          <Button variant="ghost" onClick={() => { if (confirm('Retake the diagnostic? Your current answers will be replaced; learning progress is kept.')) discard(); }}>Retake diagnostic</Button>
        </div>
      </Panel>
    </div>
  );
}
