import { useRef, useState } from 'react';
import { Button, Chip, Modal, PageHeader, Panel } from '../components/ui';
import type { Settings as S } from '../engine/types';
import { useStore } from '../store/store';

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [typed, setTyped] = useState('');

  const exportData = () => {
    const raw = localStorage.getItem('flagmaster-v1') ?? '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flagmaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ ok: true, text: 'Backup downloaded.' });
  };
  const onImport = async (f: File) => {
    try {
      importData(await f.text());
      setMsg({ ok: true, text: 'Progress imported.' });
    } catch (e) {
      setMsg({ ok: false, text: `Import failed: ${(e as Error).message} Your current progress was not changed.` });
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="Settings" />
      <Panel className="p-5 space-y-5">
        <Row label="Appearance">
          {(['system', 'light', 'dark'] as S['theme'][]).map((t) => <Chip key={t} active={settings.theme === t} onClick={() => setSettings({ theme: t })}>{{ system: 'Match system', light: 'Light', dark: 'Dark' }[t]}</Chip>)}
        </Row>
        <Row label="Daily study time" hint="Sets your daily goal and the size of Smart Training sessions.">
          {([5, 10, 15, 20, 30, 0] as S['dailyMinutes'][]).map((m) => <Chip key={m} active={settings.dailyMinutes === m} onClick={() => setSettings({ dailyMinutes: m })}>{m ? `${m} min` : 'Unlimited'}</Chip>)}
        </Row>
        <Row label="New flags per lesson" hint="Auto adapts between 4 and 7 based on how well new flags stick.">
          {(['auto', 4, 5, 6, 7] as S['groupSize'][]).map((g) => <Chip key={g} active={settings.groupSize === g} onClick={() => setSettings({ groupSize: g })}>{g === 'auto' ? 'Auto' : g}</Chip>)}
        </Row>
        <Row label="Sound effects">
          <Chip active={settings.sound} onClick={() => setSettings({ sound: true })}>On</Chip>
          <Chip active={!settings.sound} onClick={() => setSettings({ sound: false })}>Off</Chip>
        </Row>
        <Row label="Reduce motion" hint="Turns off animations. Your system setting is always respected too.">
          <Chip active={settings.reducedMotion} onClick={() => setSettings({ reducedMotion: true })}>On</Chip>
          <Chip active={!settings.reducedMotion} onClick={() => setSettings({ reducedMotion: false })}>Off</Chip>
        </Row>
        <Row label="Bonus territories" hint="Show Taiwan, Kosovo, Greenland and others in the Atlas and Challenges. Never counted in the 195.">
          <Chip active={settings.showBonus} onClick={() => setSettings({ showBonus: true })}>Show</Chip>
          <Chip active={!settings.showBonus} onClick={() => setSettings({ showBonus: false })}>Hide</Chip>
        </Row>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-semibold text-lg">Your data</h2>
        <p className="mt-1 text-[15px] text-ink-soft">Everything is saved automatically in this browser. No account needed. Export a backup to move your progress to another device.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={exportData}>Export progress</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import progress</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset all progress</Button>
        </div>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-good' : 'text-bad'}`}>{msg.text}</p>}
      </Panel>

      <Panel className="p-5 text-sm text-ink-soft space-y-2">
        <h2 className="font-semibold text-base text-ink">About the data</h2>
        <p>Countries: the 193 UN member states plus the two observer states (Vatican City and Palestine), from the mledoze/countries dataset (world-countries). Flags: Wikimedia Commons SVGs at official proportions (svg-country-flags), with Kyrgyzstan (2023) and Syria (2025) updated to their current designs. Map: Natural Earth via world-atlas.</p>
        <p>Spaced repetition uses FSRS (ts-fsrs). Fuzzy search uses Fuse.js.</p>
      </Panel>

      <Modal open={confirmReset} onClose={() => { setConfirmReset(false); setTyped(''); }} title="Reset all progress?">
        <p className="text-[15px] text-ink-soft">This permanently deletes your diagnostic, mastery, review schedule, achievements and history in this browser. Consider exporting a backup first.</p>
        <label className="block mt-4 text-sm font-semibold" htmlFor="reset-confirm">Type RESET to confirm</label>
        <input id="reset-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-line bg-raised px-3" />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setConfirmReset(false); setTyped(''); }}>Cancel</Button>
          <Button variant="danger" disabled={typed !== 'RESET'} onClick={() => { resetAll(); setConfirmReset(false); setTyped(''); setMsg({ ok: true, text: 'All progress was reset.' }); }}>Reset everything</Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="font-semibold">{label}</legend>
      {hint && <p className="text-sm text-ink-soft">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
