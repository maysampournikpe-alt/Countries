// Builds src/data/generated/countries.json and public/flags/*.svg from verified sources.
// Sources: world-countries (mledoze/countries) for names/regions/capitals/codes,
// svg-country-flags (Wikimedia Commons SVGs, official proportions) for flags,
// flag-icons for designs changed after svg-country-flags' last release (Kyrgyzstan 2023),
// and a hand-drawn Syria 2025 flag.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const countries = require('world-countries/countries.json');
const flagDir = path.dirname(require.resolve('svg-country-flags/package.json')) + '/svg';
const flagIconsDir = path.dirname(require.resolve('flag-icons/package.json')) + '/flags/4x3';

const OUT_JSON = path.join(root, 'src/data/generated/countries.json');
const OUT_FLAGS = path.join(root, 'public/flags');
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.rmSync(OUT_FLAGS, { recursive: true, force: true });
fs.mkdirSync(OUT_FLAGS, { recursive: true });

// ---------- the 195-country core set ----------
const EXTRA_CORE = ['VAT', 'PSE']; // UN General Assembly observer states
const core = countries.filter((c) => c.unMember || EXTRA_CORE.includes(c.cca3));
if (core.length !== 195) throw new Error(`Expected 195 core countries, got ${core.length}`);

// ---------- bonus entities (scored separately) ----------
const BONUS_CCA2 = ['TW', 'XK', 'GL', 'PR', 'HK', 'MO', 'FO', 'BM', 'KY', 'GI', 'AW', 'CW', 'PF', 'GU', 'CK', 'NU', 'IM', 'AX', 'FK', 'EH'];
const BONUS_UK = [
  { code: 'ENG', cca2: 'gb-eng', name: 'England', official: 'England', capital: 'London', latlng: [52.5, -1.5] },
  { code: 'SCO', cca2: 'gb-sct', name: 'Scotland', official: 'Scotland', capital: 'Edinburgh', latlng: [56.5, -4.2] },
  { code: 'WLS', cca2: 'gb-wls', name: 'Wales', official: 'Wales', capital: 'Cardiff', latlng: [52.3, -3.7] },
];
const BONUS_STATUS = {
  TW: 'Self-governing; claimed by the PRC. Recognised by a small number of UN members.',
  XK: 'Declared independence in 2008; recognised by about half of UN members, not by Serbia.',
  GL: 'Autonomous territory within the Kingdom of Denmark.',
  PR: 'Unincorporated territory of the United States.',
  HK: 'Special Administrative Region of China.',
  MO: 'Special Administrative Region of China.',
  FO: 'Autonomous territory within the Kingdom of Denmark.',
  BM: 'British Overseas Territory.',
  KY: 'British Overseas Territory.',
  GI: 'British Overseas Territory.',
  AW: 'Constituent country of the Kingdom of the Netherlands.',
  CW: 'Constituent country of the Kingdom of the Netherlands.',
  PF: 'Overseas collectivity of France.',
  GU: 'Unincorporated territory of the United States.',
  CK: 'Self-governing in free association with New Zealand.',
  NU: 'Self-governing in free association with New Zealand.',
  IM: 'British Crown Dependency.',
  AX: 'Autonomous region of Finland.',
  FK: 'British Overseas Territory; claimed by Argentina.',
  EH: 'Disputed territory; flag shown is that of the Sahrawi Arab Democratic Republic.',
  'gb-eng': 'Constituent country of the United Kingdom.',
  'gb-sct': 'Constituent country of the United Kingdom.',
  'gb-wls': 'Constituent country of the United Kingdom.',
};

// ---------- display overrides (learner-friendly names, nuanced capitals) ----------
const NAME = {
  CIV: "Côte d'Ivoire",
  CPV: 'Cabo Verde',
  COD: 'DR Congo',
  COG: 'Republic of the Congo',
  FSM: 'Micronesia',
  STP: 'São Tomé and Príncipe',
  VAT: 'Vatican City',
  TUR: 'Türkiye',
  GMB: 'The Gambia',
  BHS: 'The Bahamas',
};
const CAPITAL = {
  BOL: 'Sucre (constitutional); La Paz (seat of government)',
  ZAF: 'Pretoria (executive), Cape Town (legislative), Bloemfontein (judicial)',
  SWZ: 'Mbabane (administrative); Lobamba (legislative)',
  NLD: 'Amsterdam (constitutional); The Hague (seat of government)',
  BEN: 'Porto-Novo (official); Cotonou (seat of government)',
  CIV: 'Yamoussoukro (official); Abidjan (economic centre)',
  MYS: 'Kuala Lumpur (official); Putrajaya (administrative)',
  LKA: 'Sri Jayawardenepura Kotte (legislative); Colombo (executive)',
  ISR: 'Jerusalem (proclaimed; international status disputed)',
  PSE: 'East Jerusalem (proclaimed); Ramallah (administrative)',
  NRU: 'Yaren (de facto; no official capital)',
  CHE: 'Bern (federal city)',
  MNG: 'Ulaanbaatar',
  USA: 'Washington, D.C.',
  KIR: 'South Tarawa (Tarawa)',
  MAC: 'Macau (city)',
  ATG: "St. John's",
  KNA: 'Basseterre',
  GRD: "St. George's",
};
// Extra aliases learners commonly type. Keys: cca3.
const ALIASES = {
  USA: ['USA', 'US', 'U.S.', 'America', 'United States of America', 'The States'],
  GBR: ['UK', 'U.K.', 'Britain', 'Great Britain', 'England (UK)'],
  ARE: ['UAE', 'Emirates', 'Arab Emirates'],
  CIV: ['Ivory Coast', 'Cote dIvoire'],
  CZE: ['Czech Republic', 'Czechia', 'Czech'],
  MKD: ['Macedonia', 'FYROM'],
  SWZ: ['Swaziland'],
  MMR: ['Burma'],
  TUR: ['Turkey', 'Turkiye'],
  TLS: ['East Timor'],
  CPV: ['Cape Verde'],
  COD: ['DRC', 'DR Congo', 'Congo-Kinshasa', 'Democratic Republic of the Congo', 'Zaire', 'Congo Kinshasa'],
  COG: ['Congo-Brazzaville', 'Congo Brazzaville', 'Congo Republic'],
  VAT: ['Holy See', 'Vatican', 'Vatican City State'],
  PRK: ['DPRK', 'North Korea', 'Korea North'],
  KOR: ['ROK', 'South Korea', 'Korea South', 'Korea'],
  LAO: ['Laos', 'Lao PDR'],
  BIH: ['Bosnia', 'BiH', 'Herzegovina'],
  NLD: ['Holland', 'The Netherlands'],
  KNA: ['St Kitts', 'Saint Kitts', 'St Kitts and Nevis', 'Nevis'],
  LCA: ['St Lucia'],
  VCT: ['St Vincent', 'Saint Vincent', 'St Vincent and the Grenadines', 'Grenadines'],
  STP: ['Sao Tome', 'Sao Tome and Principe'],
  GNB: ['Guinea Bissau'],
  TTO: ['Trinidad', 'Tobago'],
  ATG: ['Antigua', 'Barbuda'],
  FSM: ['Micronesia', 'FSM', 'Federated States of Micronesia'],
  CAF: ['CAR', 'Central Africa'],
  SAU: ['KSA', 'Saudi'],
  PNG: ['PNG', 'Papua'],
  NZL: ['NZ', 'Aotearoa'],
  DOM: ['Dominican Rep', 'DR (Dominican Republic)'],
  RUS: ['Russian Federation'],
  VNM: ['Viet Nam'],
  IRN: ['Persia', 'Islamic Republic of Iran'],
  SYR: ['Syrian Arab Republic'],
  MDA: ['Republic of Moldova'],
  TZA: ['United Republic of Tanzania'],
  BOL: ['Plurinational State of Bolivia'],
  VEN: ['Bolivarian Republic of Venezuela'],
  GMB: ['Gambia', 'The Gambia'],
  BHS: ['Bahamas', 'The Bahamas'],
  KGZ: ['Kyrgyz Republic', 'Kirghizia'],
  BRN: ['Brunei Darussalam'],
  PSE: ['State of Palestine', 'Palestinian Territories'],
  ZAF: ['RSA', 'S. Africa'],
  DEU: ['Deutschland'],
  ESP: ['Espana'],
  JPN: ['Nippon', 'Nihon'],
  CHN: ['PRC', "People's Republic of China"],
  IND: ['Bharat'],
  BLR: ['Byelorussia', 'White Russia'],
  SSD: ['S Sudan'],
  MHL: ['Marshall Is'],
  SLB: ['Solomons', 'Solomon Is'],
  GNQ: ['Eq Guinea', 'Equatorial Guinea'],
  TWN: ['ROC', 'Republic of China', 'Chinese Taipei', 'Formosa'],
  UNK: ['Kosova', 'Republic of Kosovo'],
  ESH: ['Sahrawi Republic', 'SADR', 'Western Sahara'],
};

const isGoodAlt = (s) =>
  s.length > 3 && /^[\p{Script=Latin}\s'.,()-]+$/u.test(s) && !s.includes(',');

const opaque = (code) => 'f' + crypto.createHash('sha256').update('flagmaster:' + code).digest('hex').slice(0, 12) + '.svg';

function ratioOf(svg) {
  const tag = svg.match(/<svg\b[^>]*>/)[0];
  const w = tag.match(/\swidth="([\d.]+)"/)?.[1];
  const h = tag.match(/\sheight="([\d.]+)"/)?.[1];
  if (w && h) return +w / +h;
  const vb = tag.match(/viewBox="([^"]+)"/)[1].trim().split(/[\s,]+/).map(Number);
  return vb[2] / vb[3];
}

function starPoints(cx, cy, R) {
  const r = R * 0.381966; // regular five-pointed star
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// Syria, flag adopted 2025: green-white-black horizontal tricolour with three red stars, 2:3.
function syria2025() {
  const R = 82.8;
  const cy = 300 + R * (1 - (1 + Math.cos(Math.PI / 5)) / 2); // centre the star's bounding box in the band
  const stars = [225, 450, 675].map((x) => `<polygon fill="#ce1126" points="${starPoints(x, cy, R)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="600" fill="#000"/><rect width="900" height="400" fill="#fff"/><rect width="900" height="200" fill="#007a3d"/>${stars}</svg>`;
}

// Kyrgyzstan, 2023 design (straight rays). flag-icons draws it at 4:3; re-frame to the official 3:5.
function kyrgyzstan2023() {
  let s = fs.readFileSync(path.join(flagIconsDir, 'kg.svg'), 'utf8');
  s = s.replace(/<svg\b[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-80 0 800 480"><rect x="-80" width="800" height="480" fill="#e8112d"/>');
  return s.replace(/fill="red"/g, 'fill="#e8112d"').replace(/fill="#ff0"/g, 'fill="#ffef00"');
}

const OVERRIDES = { SYR: syria2025, KGZ: kyrgyzstan2023 };

function cleanSvg(svg) {
  // Remove <title> and ids/comments that could reveal the country in the DOM or file.
  return svg
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
    .replace(/<desc>[\s\S]*?<\/desc>/g, '')
    .replace(/\s(sodipodi|inkscape):[\w-]+="[^"]*"/g, '')
    .replace(/(<svg\b[^>]*?)\sid="[^"]*"/, '$1')
    .trim();
}

function writeFlag(code, fileKey) {
  const raw = OVERRIDES[code] ? OVERRIDES[code]() : fs.readFileSync(path.join(flagDir, `${fileKey}.svg`), 'utf8');
  const svg = cleanSvg(raw);
  const file = opaque(code);
  fs.writeFileSync(path.join(OUT_FLAGS, file), svg);
  return { flag: file, ratio: +ratioOf(svg).toFixed(4) };
}

function continentOf(c) {
  if (c.region === 'Americas') return c.subregion === 'South America' ? 'South America' : 'North America';
  return c.region;
}

function aliasesOf(c, display) {
  const set = new Set([c.name.common, c.name.official, ...(ALIASES[c.cca3] || []), ...c.altSpellings.filter(isGoodAlt)]);
  set.delete(display);
  return [...set].filter(Boolean);
}

const out = [];
for (const c of core) {
  const name = NAME[c.cca3] || c.name.common;
  out.push({
    code: c.cca3,
    cca2: c.cca2,
    ccn3: c.ccn3,
    name,
    official: c.name.official,
    aliases: aliasesOf(c, name),
    continent: continentOf(c),
    subregion: c.subregion,
    capital: CAPITAL[c.cca3] || c.capital.join(', '),
    latlng: c.latlng,
    bonus: false,
    ...writeFlag(c.cca3, c.cca2.toLowerCase()),
  });
}
for (const k of BONUS_CCA2) {
  const c = countries.find((x) => x.cca2 === k);
  out.push({
    code: c.cca3,
    cca2: c.cca2,
    ccn3: c.ccn3,
    name: c.name.common,
    official: c.name.official,
    aliases: aliasesOf(c, c.name.common),
    continent: continentOf(c),
    subregion: c.subregion,
    capital: CAPITAL[c.cca3] || c.capital.join(', ') || '—',
    latlng: c.latlng,
    bonus: true,
    status: BONUS_STATUS[k],
    ...writeFlag(c.cca3, k.toLowerCase()),
  });
}
for (const b of BONUS_UK) {
  out.push({
    code: b.code, cca2: '', ccn3: '', name: b.name, official: b.official, aliases: [],
    continent: 'Europe', subregion: 'Northern Europe', capital: b.capital, latlng: b.latlng,
    bonus: true, status: BONUS_STATUS[b.cca2], ...writeFlag(b.code, b.cca2),
  });
}

const codes = new Set(out.map((c) => c.code));
if (codes.size !== out.length) throw new Error('Duplicate country codes');
fs.writeFileSync(OUT_JSON, JSON.stringify(out));
console.log(`build-data: ${out.filter((c) => !c.bonus).length} core + ${out.filter((c) => c.bonus).length} bonus entries, ${fs.readdirSync(OUT_FLAGS).length} flags`);
