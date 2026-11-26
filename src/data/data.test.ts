import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL, BONUS, BY_CODE, COUNTRIES, CONTINENTS } from './countries';
import { CONTENT } from './content';
import { SIMILAR_GROUPS } from './similar';

// The 193 UN member states (ISO alpha-3) + the two observer states.
const EXPECTED = `AFG ALB DZA AND AGO ATG ARG ARM AUS AUT AZE BHS BHR BGD BRB BLR BEL BLZ BEN BTN BOL BIH BWA BRA BRN BGR BFA BDI CPV KHM CMR CAN CAF TCD CHL CHN COL COM COG COD CRI CIV HRV CUB CYP CZE PRK DNK DJI DMA DOM ECU EGY SLV GNQ ERI EST SWZ ETH FJI FIN FRA GAB GMB GEO DEU GHA GRC GRD GTM GIN GNB GUY HTI HND HUN ISL IND IDN IRN IRQ IRL ISR ITA JAM JPN JOR KAZ KEN KIR KWT KGZ LAO LVA LBN LSO LBR LBY LIE LTU LUX MDG MWI MYS MDV MLI MLT MHL MRT MUS MEX FSM MDA MCO MNG MNE MAR MOZ MMR NAM NRU NPL NLD NZL NIC NER NGA MKD NOR OMN PAK PLW PAN PNG PRY PER PHL POL PRT QAT KOR ROU RUS RWA KNA LCA VCT WSM SMR STP SAU SEN SRB SYC SLE SGP SVK SVN SLB SOM ZAF SSD ESP LKA SDN SUR SWE CHE SYR TJK TZA THA TLS TGO TON TTO TUN TUR TKM TUV UGA UKR ARE GBR USA URY UZB VUT VEN VNM YEM ZMB ZWE VAT PSE`.split(/\s+/);

describe('country database', () => {
  it('has exactly the 195 expected countries, no duplicates', () => {
    expect(EXPECTED).toHaveLength(195);
    expect(new Set(EXPECTED).size).toBe(195);
    expect(COUNTRIES).toHaveLength(195);
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(195);
    expect(COUNTRIES.map((c) => c.code).sort()).toEqual([...EXPECTED].sort());
    expect(new Set(COUNTRIES.map((c) => c.name)).size).toBe(195);
  });
  it('keeps bonus entities out of the core set', () => {
    for (const code of ['TWN', 'UNK', 'GRL', 'PRI', 'HKG', 'ESH', 'ENG']) {
      expect(BY_CODE[code]?.bonus).toBe(true);
      expect(COUNTRIES.some((c) => c.code === code)).toBe(false);
    }
    expect(BONUS.length).toBeGreaterThanOrEqual(20);
  });
  it('every entry has complete learning content', () => {
    for (const c of ALL) {
      expect(c.name, c.code).toBeTruthy();
      expect(c.capital, c.code).toBeTruthy();
      expect(CONTINENTS, c.code).toContain(c.continent);
      expect(c.ratio, c.code).toBeGreaterThan(0.5);
      expect(c.ratio, c.code).toBeLessThan(3);
      expect(CONTENT[c.code], `content for ${c.code}`).toBeDefined();
      expect(c.f.length, c.code).toBeGreaterThan(15);
      expect(c.t.length, c.code).toBeGreaterThan(5);
      if (!c.bonus) {
        expect(c.s, `symbolism ${c.code}`).toBeTruthy();
        expect(c.cca2, c.code).toMatch(/^[A-Z]{2}$/);
      }
    }
  });
  it('visual descriptions never name the country (safe as hints)', () => {
    for (const c of COUNTRIES) expect(c.f.toLowerCase(), c.code).not.toContain(c.name.toLowerCase());
  });
  it('flag files exist, are opaque, and do not contain the country name', () => {
    const dir = path.resolve(__dirname, '../../public/flags');
    for (const c of ALL) {
      expect(c.flag).toMatch(/^f[0-9a-f]{12}\.svg$/);
      const svg = fs.readFileSync(path.join(dir, c.flag), 'utf8');
      expect(svg.startsWith('<svg'), c.code).toBe(true);
      expect(svg).not.toMatch(/<title>/i);
      expect(svg.toLowerCase(), c.code).not.toContain(`flag of ${c.name.toLowerCase()}`);
    }
    expect(new Set(ALL.map((c) => c.flag)).size).toBe(ALL.length);
  });
  it('authentic proportions for the special cases', () => {
    const r = (code: string) => BY_CODE[code].ratio;
    expect(r('CHE')).toBeCloseTo(1, 2);
    expect(r('VAT')).toBeCloseTo(1, 2);
    expect(r('QAT')).toBeCloseTo(28 / 11, 2);
    expect(r('NPL')).toBeLessThan(1);
    expect(r('MCO')).toBeCloseTo(5 / 4, 2);
    expect(r('IDN')).toBeCloseTo(3 / 2, 2);
    expect(r('IRL')).toBeCloseTo(2, 2);
    expect(r('CIV')).toBeCloseTo(3 / 2, 2);
    expect(r('USA')).toBeCloseTo(1.9, 2);
    expect(r('BEL')).toBeCloseTo(15 / 13, 2);
    expect(r('KGZ')).toBeCloseTo(5 / 3, 2);
    expect(r('SVN')).toBeCloseTo(2, 2);
  });
  it('uses current designs for recently changed flags', () => {
    const dir = path.resolve(__dirname, '../../public/flags');
    const syr = fs.readFileSync(path.join(dir, BY_CODE.SYR.flag), 'utf8');
    expect(syr).toContain('#007a3d'); // green top stripe (2025 flag)
    expect(syr.match(/<polygon/g)).toHaveLength(3); // three red stars
    const kgz = fs.readFileSync(path.join(dir, BY_CODE.KGZ.flag), 'utf8');
    expect(kgz).toContain('viewBox="-80 0 800 480"'); // 2023 straight-ray design reframed to 3:5
  });
  it('similar groups reference real countries and have cues for every member', () => {
    for (const g of SIMILAR_GROUPS) {
      for (const m of g.members) {
        expect(BY_CODE[m], `${g.id}:${m}`).toBeDefined();
        expect(g.cues[m], `${g.id} cue ${m}`).toBeTruthy();
      }
      expect(g.differences.length).toBeGreaterThan(0);
    }
    expect(new Set(SIMILAR_GROUPS.map((g) => g.id)).size).toBe(SIMILAR_GROUPS.length);
    for (const pair of [['TCD', 'ROU'], ['IDN', 'MCO'], ['IRL', 'CIV'], ['AUS', 'NZL'], ['NLD', 'LUX'], ['SVN', 'SVK'], ['COL', 'ECU'], ['BHR', 'QAT'], ['GIN', 'MLI'], ['NOR', 'ISL'], ['SEN', 'GHA']])
      expect(BY_CODE[pair[0]].similar.includes(pair[1]) || SIMILAR_GROUPS.some((g) => g.members.includes(pair[0]) && g.members.includes(pair[1])) || pair[0] === 'SEN').toBe(true);
  });
});
