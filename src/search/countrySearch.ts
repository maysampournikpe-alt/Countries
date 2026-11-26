import Fuse from 'fuse.js';
import type { Country } from '../data/countries';

// Suggestions depend ONLY on the typed query and the candidate list — never on the
// flag being asked about. Ranking ties are broken alphabetically, so the correct
// answer can never be favoured.

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`.]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Optimal string alignment distance (Levenshtein + adjacent transpositions).
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

interface Entry {
  code: string;
  name: string; // display name, for alphabetical tie-breaks
  terms: string[]; // normalized names and aliases
  codes: string[]; // ISO codes, exact-match only
}

export interface CountrySearcher {
  search(query: string, limit?: number): Country[];
}

export function createSearcher(countries: Country[]): CountrySearcher {
  const byCode = new Map(countries.map((c) => [c.code, c]));
  const entries: Entry[] = countries.map((c) => ({
    code: c.code,
    name: c.name,
    terms: [...new Set([c.name, ...c.aliases].map(normalize).filter(Boolean))],
    codes: [c.code, c.cca2].filter(Boolean).map((x) => x.toLowerCase()),
  }));
  const fuse = new Fuse(entries, {
    keys: ['terms'],
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    minMatchCharLength: 2,
  });

  return {
    search(query: string, limit = 8) {
      const q = normalize(query);
      if (!q) return [];
      const scores = new Map<string, number>();
      const put = (code: string, s: number) => scores.set(code, Math.min(scores.get(code) ?? Infinity, s));

      for (const e of entries) {
        e.terms.forEach((t, i) => {
          const alias = i === 0 ? 0 : 0.01; // the display name outranks aliases at each tier
          if (t === q) put(e.code, 0 + alias);
          else if (t.startsWith(q)) put(e.code, 0.04 + alias);
          else if (t.split(' ').some((w) => w.startsWith(q))) put(e.code, 0.08 + alias);
        });
        if (e.codes.includes(q)) put(e.code, 0.02);
      }
      // Fuse finds fuzzy candidates; edit distance re-ranks them so "Kyrgistan" beats "Pakistan".
      if (q.length >= 3) {
        for (const r of fuse.search(q)) {
          const d = Math.min(...r.item.terms.map((t) => Math.min(editDistance(q, t), editDistance(q, t.slice(0, q.length)) + 0.5)));
          put(r.item.code, 0.15 + d / q.length);
        }
      }

      return [...scores.entries()]
        .sort((a, b) => a[1] - b[1] || byCode.get(a[0])!.name.localeCompare(byCode.get(b[0])!.name))
        .slice(0, limit)
        .map(([code]) => byCode.get(code)!);
    },
  };
}
