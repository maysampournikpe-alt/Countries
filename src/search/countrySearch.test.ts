import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../data/countries';
import { createSearcher, normalize } from './countrySearch';

const s = createSearcher(COUNTRIES);
const top = (q: string) => s.search(q)[0]?.code;
const inTop = (q: string, code: string, n = 5) => s.search(q, n).some((c) => c.code === code);

describe('normalize', () => {
  it('strips accents, case and punctuation', () => {
    expect(normalize("Côte d'Ivoire")).toBe('cote divoire');
    expect(normalize('  São-Tomé & Príncipe ')).toBe('sao tome and principe');
    expect(normalize('Saint Lucia')).toBe('st lucia');
  });
});

describe('spelling-tolerant search (required examples)', () => {
  it.each([
    ['Kazakstan', 'KAZ'],
    ['Kyrg', 'KGZ'],
    ['USA', 'USA'],
    ['Ivory Coast', 'CIV'],
    ['Bosna', 'BIH'],
  ])('%s → %s', (q, code) => expect(top(q)).toBe(code));
});

describe('typos, aliases, abbreviations', () => {
  it.each([
    ['phillipines', 'PHL'], ['Columbia', 'COL'], ['Kyrgistan', 'KGZ'], ['Turkmenstan', 'TKM'],
    ['cote divoire', 'CIV'], ['turkey', 'TUR'], ['Türkiye', 'TUR'], ['UK', 'GBR'], ['Great Britain', 'GBR'],
    ['UAE', 'ARE'], ['DRC', 'COD'], ['Burma', 'MMR'], ['Swaziland', 'SWZ'], ['Czech Republic', 'CZE'],
    ['East Timor', 'TLS'], ['Cape Verde', 'CPV'], ['Holy See', 'VAT'], ['vatican', 'VAT'], ['north korea', 'PRK'],
    ['south korea', 'KOR'], ['holland', 'NLD'], ['St Lucia', 'LCA'], ['saint kitts', 'KNA'], ['sao tome', 'STP'],
    ['Macedonia', 'MKD'], ['Lichtenstein', 'LIE'], ['Azerbijan', 'AZE'], ['Zimbabwi', 'ZWE'], ['Mauritious', 'MUS'],
    ['Venezuala', 'VEN'], ['Uraguay', 'URY'], ['Phillippines', 'PHL'], ['Seychelle', 'SYC'], ['Bangladash', 'BGD'],
    ['Lao', 'LAO'], ['america', 'USA'], ['NZ', 'NZL'], ['palestine', 'PSE'], ['congo brazzaville', 'COG'],
  ])('%s → %s', (q, code) => expect(inTop(q, code, 3)).toBe(true));
});

describe('near-collisions are suggested but never merged', () => {
  it('Niger query lists Niger first and Nigeria too', () => {
    const r = s.search('Niger').map((c) => c.code);
    expect(r[0]).toBe('NER');
    expect(r).toContain('NGA');
  });
  it.each([
    ['Dominica', 'DMA'], ['Guinea', 'GIN'], ['Sudan', 'SDN'], ['Austria', 'AUT'], ['Iran', 'IRN'], ['Iraq', 'IRQ'],
    ['Mali', 'MLI'], ['Gambia', 'GMB'], ['Slovakia', 'SVK'], ['Slovenia', 'SVN'], ['Mauritania', 'MRT'], ['Mauritius', 'MUS'],
  ])('exact "%s" ranks %s first', (q, code) => expect(top(q)).toBe(code));
  it('ambiguous Congo shows both Congos', () => {
    const r = s.search('Congo').map((c) => c.code);
    expect(r).toContain('COG');
    expect(r).toContain('COD');
  });
});

describe('robustness and fairness', () => {
  it('handles empty, whitespace, emoji and very long input', () => {
    expect(s.search('')).toEqual([]);
    expect(s.search('   ')).toEqual([]);
    expect(() => s.search('🇫🇷🇫🇷')).not.toThrow();
    expect(() => s.search('x'.repeat(500))).not.toThrow();
  });
  it('results are a pure function of the query (no hidden target bias)', () => {
    const a = s.search('ma').map((c) => c.code);
    const b = s.search('ma').map((c) => c.code);
    expect(a).toEqual(b);
  });
  it('every country is findable by its own display name', () => {
    for (const c of COUNTRIES) expect(top(c.name), c.name).toBe(c.code);
  });
});
