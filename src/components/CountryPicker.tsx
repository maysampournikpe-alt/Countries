import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { COUNTRIES, type Country } from '../data/countries';
import type { Confidence } from '../engine/types';
import { createSearcher, normalize } from '../search/countrySearch';
import { Button, Kbd, Modal } from './ui';

const searchers = new WeakMap<Country[], ReturnType<typeof createSearcher>>();
const searcherFor = (pool: Country[]) => {
  let s = searchers.get(pool);
  if (!s) searchers.set(pool, (s = createSearcher(pool)));
  return s;
};

/**
 * Spelling-tolerant country selector. Suggestions depend only on what is typed
 * (never on the flag being asked) and never show flag images. An answer is only
 * evaluated after a country is selected and submitted.
 */
export function CountryPicker({
  pool = COUNTRIES,
  onSubmit,
  variant = 'practice',
  disabled = false,
}: {
  pool?: Country[];
  onSubmit: (code: string | null, confidence: Confidence) => void;
  variant?: 'practice' | 'diagnostic' | 'exam';
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Country | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [browse, setBrowse] = useState(false);
  const results = useMemo(() => (selected ? [] : searcherFor(pool).search(query, 8)), [pool, query, selected]);
  const showList = open && results.length > 0 && !selected;

  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true });
  }, [disabled]);

  const choose = (c: Country) => {
    setSelected(c);
    setQuery(c.name);
    setOpen(false);
    inputRef.current?.focus();
  };
  const reset = () => {
    setSelected(null);
    setQuery('');
    setActive(0);
  };
  const submit = (confidence: Confidence = 'sure') => {
    if (confidence === 'idk') {
      reset();
      onSubmit(null, 'idk');
      return;
    }
    if (!selected) return;
    const code = selected.code;
    reset();
    onSubmit(code, confidence);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showList && results[active]) choose(results[active]);
      else if (selected) submit(variant === 'diagnostic' && e.shiftKey ? 'guess' : 'sure');
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <label htmlFor={`${id}-input`} className="sr-only">Country name</label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          value={query}
          placeholder="Type any part of the country name…"
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          className={`w-full h-14 rounded-2xl border-2 bg-surface pl-4 pr-28 text-lg outline-none transition placeholder:text-ink-faint ${selected ? 'border-primary' : 'border-line focus:border-primary'}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button type="button" onClick={reset} className="h-9 px-2 rounded-lg text-sm text-ink-faint hover:text-ink" aria-label="Clear">✕</button>
          )}
          <button type="button" onClick={() => setBrowse(true)} disabled={disabled} className="h-9 px-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary-soft">A–Z</button>
        </div>
        {showList && (
          <ul id={`${id}-list`} role="listbox" aria-label="Suggestions" className="absolute z-20 left-0 right-0 mt-2 rounded-2xl border border-line bg-surface shadow-xl overflow-hidden">
            {results.map((c, i) => (
              <li
                key={c.code}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={`px-4 py-3 cursor-pointer text-[15px] ${i === active ? 'bg-primary-soft text-ink' : 'text-ink-soft'}`}
              >
                <span className="font-medium text-ink">{c.name}</span>
                {matchedAlias(c, query) && <span className="ml-2 text-sm text-ink-faint">({matchedAlias(c, query)})</span>}
              </li>
            ))}
          </ul>
        )}
        {open && query.trim().length > 1 && !results.length && !selected && (
          <p className="absolute left-0 right-0 mt-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-faint">No match. Try fewer letters or browse A–Z.</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {variant === 'diagnostic' ? (
          <>
            <Button onClick={() => submit('sure')} disabled={!selected || disabled}>I'm sure <Kbd>Enter</Kbd></Button>
            <Button variant="secondary" onClick={() => submit('guess')} disabled={!selected || disabled}>Just a guess <Kbd>⇧ Enter</Kbd></Button>
            <Button variant="ghost" onClick={() => submit('idk')} disabled={disabled} className="ml-auto">I don't know</Button>
          </>
        ) : (
          <>
            <Button onClick={() => submit('sure')} disabled={!selected || disabled}>Submit <Kbd>Enter</Kbd></Button>
            <Button variant="ghost" onClick={() => submit('idk')} disabled={disabled} className="ml-auto">I don't know</Button>
          </>
        )}
      </div>

      <AlphabetBrowser
        open={browse}
        pool={pool}
        onClose={() => setBrowse(false)}
        onPick={(c) => {
          setBrowse(false);
          choose(c);
        }}
      />
    </div>
  );
}

function matchedAlias(c: Country, q: string): string | null {
  const nq = normalize(q);
  if (nq.length < 2 || normalize(c.name).includes(nq)) return null;
  return c.aliases.find((a) => normalize(a).includes(nq)) ?? null;
}

function AlphabetBrowser({ open, pool, onClose, onPick }: { open: boolean; pool: Country[]; onClose: () => void; onPick: (c: Country) => void }) {
  const [filter, setFilter] = useState('');
  const list = useMemo(() => {
    const sorted = [...pool].sort((a, b) => a.name.localeCompare(b.name));
    if (!filter.trim()) return sorted;
    const hits = new Set(searcherFor(pool).search(filter, 40).map((c) => c.code));
    return sorted.filter((c) => hits.has(c.code));
  }, [pool, filter]);
  const groups = useMemo(() => {
    const m = new Map<string, Country[]>();
    for (const c of list) {
      const k = normalize(c.name)[0]?.toUpperCase() ?? '#';
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [list]);
  return (
    <Modal open={open} onClose={onClose} title="Choose a country">
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" aria-label="Filter countries" className="w-full h-11 rounded-xl border border-line bg-raised px-3 mb-3 outline-none focus:border-primary" />
      <nav aria-label="Letters" className="flex flex-wrap gap-1 mb-3">
        {groups.map(([k]) => (
          <a key={k} href={`#az-${k}`} className="h-7 min-w-7 px-1 grid place-items-center rounded-md text-xs font-semibold text-ink-soft hover:bg-primary-soft">{k}</a>
        ))}
      </nav>
      <div className="max-h-[52dvh] overflow-y-auto scrollbar-thin pr-1">
        {groups.map(([k, cs]) => (
          <div key={k} id={`az-${k}`}>
            <div className="sticky top-0 bg-surface py-1 text-xs font-bold text-ink-faint">{k}</div>
            <ul className="grid sm:grid-cols-2 gap-1 mb-2">
              {cs.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => onPick(c)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-soft text-[15px]">{c.name}</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!list.length && <p className="text-ink-faint text-sm">No countries match.</p>}
      </div>
    </Modal>
  );
}
