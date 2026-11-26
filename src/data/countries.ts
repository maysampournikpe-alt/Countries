import raw from './generated/countries.json';
import { CONTENT, type FlagContent } from './content';
import { similarTo } from './similar';

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania';
export const CONTINENTS: Continent[] = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];

export interface Country extends FlagContent {
  code: string; // ISO 3166-1 alpha-3 (custom for England/Scotland/Wales)
  cca2: string;
  ccn3: string;
  name: string;
  official: string;
  aliases: string[];
  continent: Continent;
  subregion: string;
  capital: string;
  latlng: [number, number];
  bonus: boolean;
  status?: string;
  flag: string; // opaque file name under /flags
  ratio: number; // width / height, official proportions
  similar: string[];
}

export const ALL: Country[] = (raw as Omit<Country, keyof FlagContent | 'similar'>[]).map((c) => ({
  ...c,
  ...CONTENT[c.code],
  similar: similarTo(c.code),
})) as Country[];

export const COUNTRIES: Country[] = ALL.filter((c) => !c.bonus).sort((a, b) => a.name.localeCompare(b.name));
export const BONUS: Country[] = ALL.filter((c) => c.bonus).sort((a, b) => a.name.localeCompare(b.name));
export const BY_CODE: Record<string, Country> = Object.fromEntries(ALL.map((c) => [c.code, c]));
export const CORE_CODES = COUNTRIES.map((c) => c.code);
export const TOTAL = COUNTRIES.length;

export const flagUrl = (c: Country | string) => `/flags/${(typeof c === 'string' ? BY_CODE[c] : c).flag}`;
export const byContinent = (k: Continent) => COUNTRIES.filter((c) => c.continent === k);
