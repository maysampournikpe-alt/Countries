// Groups of easily confused flags with precise, verifiable differences.
// subtlety: 1 = clear once you know where to look, 2 = tricky, 3 = extremely subtle (near-identical).
export interface SimilarGroup {
  id: string;
  title: string;
  members: string[];
  subtlety: 1 | 2 | 3;
  differences: string[];
  cues: Record<string, string>;
}

export const SIMILAR_GROUPS: SimilarGroup[] = [
  {
    id: 'chad-romania', title: 'Blue–yellow–red verticals', members: ['TCD', 'ROU', 'AND', 'MDA'], subtlety: 3,
    differences: [
      'Chad and Romania are near-identical: same layout, same 2:3 proportions. The only difference is the shade of blue.',
      'Chad\'s blue is a dark indigo; Romania\'s is a brighter cobalt blue.',
      'Andorra and Moldova use the same colours but add a coat of arms in the yellow band.',
      'Andorra\'s shield shows a bishop\'s mitre and two cows; Moldova\'s shows an eagle holding a cross.',
    ],
    cues: { TCD: 'Darker indigo blue, no emblem', ROU: 'Brighter cobalt blue, no emblem', AND: 'Shield with mitre and cows', MDA: 'Eagle holding a cross' },
  },
  {
    id: 'red-white-halves', title: 'Red and white halves', members: ['IDN', 'MCO', 'POL', 'SGP'], subtlety: 3,
    differences: [
      'Indonesia and Monaco are red over white with identical colours; only the proportions differ.',
      'Indonesia is 2:3 (longer); Monaco is 4:5 (nearly square). On many devices they look identical.',
      'Poland is the reverse: white on top, red below.',
      'Singapore is red over white but adds a crescent and five stars.',
    ],
    cues: { IDN: 'Red over white, long (2:3)', MCO: 'Red over white, almost square (4:5)', POL: 'White over red', SGP: 'Crescent and five stars' },
  },
  {
    id: 'ireland-cote', title: 'Green–white–orange verticals', members: ['IRL', 'CIV', 'ITA'], subtlety: 2,
    differences: [
      'Ireland has green at the hoist (left); Côte d\'Ivoire has orange at the hoist.',
      'Ireland is long (1:2); Côte d\'Ivoire is shorter (2:3).',
      'Italy has the same green-at-hoist order as Ireland, but red instead of orange.',
    ],
    cues: { IRL: 'Green first, long flag', CIV: 'Orange first, shorter flag', ITA: 'Green–white–red' },
  },
  {
    id: 'aus-nz', title: 'Southern Cross ensigns', members: ['AUS', 'NZL'], subtlety: 2,
    differences: [
      'Australia\'s stars are white; New Zealand\'s are red with a white outline.',
      'Australia has six stars on the field, including a large seven-pointed star under the Union Jack; New Zealand has four stars only.',
      'Australia\'s stars are seven-pointed except one small five-pointed star; all four of New Zealand\'s stars are five-pointed.',
    ],
    cues: { AUS: 'White stars + big star below the Union Jack', NZL: 'Four red stars' },
  },
  {
    id: 'blue-ensigns-light', title: 'Light-blue British ensigns', members: ['TUV', 'FJI'], subtlety: 1,
    differences: [
      'Both are light-blue ensigns with the Union Jack.',
      'Tuvalu has nine yellow stars; Fiji has a shield with a lion, crops and a dove.',
    ],
    cues: { TUV: 'Nine yellow stars', FJI: 'Shield with lion and crops' },
  },
  {
    id: 'nl-lux', title: 'Red–white–blue horizontals', members: ['NLD', 'LUX', 'PRY', 'HRV'], subtlety: 3,
    differences: [
      'The Netherlands and Luxembourg share the same layout; Luxembourg\'s bottom stripe is a lighter sky blue.',
      'Luxembourg is longer (3:5) than the Netherlands (2:3).',
      'Paraguay adds a small circular seal in the centre and is longer still.',
      'Croatia adds a large red-and-white checkerboard shield.',
    ],
    cues: { NLD: 'Dark blue, plain', LUX: 'Light blue, plain, longer', PRY: 'Small round seal', HRV: 'Checkerboard shield' },
  },
  {
    id: 'slavic-tricolours', title: 'White–blue–red horizontals', members: ['RUS', 'SVK', 'SVN', 'SRB'], subtlety: 2,
    differences: [
      'Russia, Slovakia and Slovenia share the white–blue–red order.',
      'Russia has no emblem.',
      'Slovakia\'s shield (white double cross on blue hills) sits toward the hoist, centred vertically, and is fairly large.',
      'Slovenia\'s shield (a white mountain with wavy lines and three stars) sits high in the upper hoist; the flag is longer (1:2).',
      'Serbia reverses the order: red–blue–white, with a crowned double-headed eagle.',
    ],
    cues: { RUS: 'Plain white–blue–red', SVK: 'Shield with double cross', SVN: 'Mountain shield in upper corner', SRB: 'Red on top, eagle' },
  },
  {
    id: 'gran-colombia', title: 'Yellow–blue–red horizontals', members: ['COL', 'ECU', 'VEN'], subtlety: 2,
    differences: [
      'Colombia and Ecuador both have a yellow top half; Colombia is plain, Ecuador adds a coat of arms with a condor.',
      'Venezuela has three equal stripes and an arc of eight white stars in the blue.',
    ],
    cues: { COL: 'Big yellow half, plain', ECU: 'Big yellow half + condor crest', VEN: 'Equal stripes + arc of stars' },
  },
  {
    id: 'bahrain-qatar', title: 'Serrated white bands', members: ['BHR', 'QAT'], subtlety: 2,
    differences: [
      'Bahrain is bright red; Qatar is maroon.',
      'Bahrain has five white points; Qatar has nine.',
      'Qatar is very long (11:28); Bahrain is 3:5.',
    ],
    cues: { BHR: 'Bright red, 5 points', QAT: 'Maroon, 9 points, very long' },
  },
  {
    id: 'west-africa-tricolours', title: 'Green–yellow–red verticals', members: ['MLI', 'GIN', 'SEN', 'CMR'], subtlety: 2,
    differences: [
      'Mali is green–yellow–red from the hoist, with no emblem.',
      'Guinea reverses it: red–yellow–green from the hoist.',
      'Senegal is Mali plus a green star in the yellow.',
      'Cameroon is green–red–yellow, with a yellow star in the red centre.',
    ],
    cues: { MLI: 'Green first, plain', GIN: 'Red first, plain', SEN: 'Green star in yellow', CMR: 'Red middle, yellow star' },
  },
  {
    id: 'pan-african-horizontals', title: 'Red–yellow–green horizontals', members: ['GHA', 'BOL', 'LTU', 'ETH'], subtlety: 2,
    differences: [
      'Ghana is red–yellow–green with a black star.',
      'Bolivia has the same order (red on top) without a star (the state flag has a coat of arms).',
      'Lithuania is yellow–green–red: yellow on top.',
      'Ethiopia is green–yellow–red with a blue disc and star.',
    ],
    cues: { GHA: 'Black star', BOL: 'Red on top, no star', LTU: 'Yellow on top', ETH: 'Green on top, blue disc' },
  },
  {
    id: 'nordic-crosses', title: 'Nordic crosses', members: ['NOR', 'SWE', 'FIN', 'DNK', 'ISL'], subtlety: 1,
    differences: [
      'Denmark: red field, white cross.',
      'Norway: red field, blue cross outlined in white.',
      'Iceland: blue field, red cross outlined in white (the reverse of Norway).',
      'Sweden: blue field, yellow cross.',
      'Finland: white field, blue cross.',
    ],
    cues: { DNK: 'Red + white cross', NOR: 'Red + blue cross (white edge)', ISL: 'Blue + red cross (white edge)', SWE: 'Blue + yellow cross', FIN: 'White + blue cross' },
  },
  {
    id: 'italy-mexico', title: 'Green–white–red verticals', members: ['ITA', 'MEX'], subtlety: 1,
    differences: [
      'Mexico has an eagle on a cactus eating a snake in the centre; Italy is plain.',
      'Mexico is longer (4:7) and uses a darker green than Italy (2:3).',
    ],
    cues: { ITA: 'Plain', MEX: 'Eagle emblem, longer' },
  },
  {
    id: 'arab-tricolours', title: 'Red–white–black horizontals', members: ['EGY', 'IRQ', 'YEM', 'SYR'], subtlety: 2,
    differences: [
      'Egypt adds a golden eagle in the white stripe.',
      'Iraq adds green Arabic script in the white stripe.',
      'Yemen is plain red–white–black.',
      'Syria changed in 2025: green–white–black with three red stars (green on top, not red).',
    ],
    cues: { EGY: 'Golden eagle', IRQ: 'Green script', YEM: 'Plain', SYR: 'Green on top, three red stars' },
  },
  {
    id: 'hoist-triangles', title: 'Pan-Arab flags with a hoist shape', members: ['JOR', 'PSE', 'SDN', 'KWT', 'ARE'], subtlety: 2,
    differences: [
      'Jordan and Palestine: black–white–green with a red triangle. Jordan adds a white seven-pointed star.',
      'Sudan: red–white–black (red on top) with a green triangle.',
      'Kuwait: green–white–red with a black trapezoid.',
      'UAE: a vertical red band, not a triangle.',
    ],
    cues: { JOR: 'Red triangle with star', PSE: 'Red triangle, no star', SDN: 'Green triangle, red on top', KWT: 'Black trapezoid', ARE: 'Vertical red band' },
  },
  {
    id: 'central-america', title: 'Blue–white–blue horizontals', members: ['HND', 'NIC', 'SLV', 'GTM'], subtlety: 3,
    differences: [
      'Honduras has five blue stars in the centre.',
      'Nicaragua and El Salvador both have a coat of arms with a triangle — very subtle.',
      'Nicaragua\'s emblem is a ring of text with a triangle showing volcanoes and a rainbow.',
      'El Salvador\'s emblem has a laurel wreath and flags around the triangle.',
      'Guatemala uses vertical stripes and a quetzal bird.',
    ],
    cues: { HND: 'Five stars', NIC: 'Rainbow, text ring', SLV: 'Laurel wreath', GTM: 'Vertical stripes, bird' },
  },
  {
    id: 'austria-latvia', title: 'Red–white–red horizontals', members: ['AUT', 'LVA', 'LBN'], subtlety: 2,
    differences: [
      'Austria has three equal stripes in bright red.',
      'Latvia is dark carmine with a much thinner white stripe (2:1:2).',
      'Lebanon has a wide white stripe with a green cedar tree.',
    ],
    cues: { AUT: 'Equal stripes, bright red', LVA: 'Dark red, thin white', LBN: 'Cedar tree' },
  },
  {
    id: 'red-white-green', title: 'Red, white and green horizontals', members: ['HUN', 'BGR', 'TJK', 'IRN'], subtlety: 2,
    differences: [
      'Hungary: red–white–green, plain.',
      'Bulgaria: white–green–red (white on top).',
      'Tajikistan: red–white–green like Hungary, but the white is wider and holds a crown and seven stars.',
      'Iran: green–white–red with a red emblem and script along the edges.',
    ],
    cues: { HUN: 'Red on top, plain', BGR: 'White on top', TJK: 'Crown and stars', IRN: 'Green on top, emblem' },
  },
  {
    id: 'thailand-costa-rica', title: 'Five-stripe red, white and blue', members: ['THA', 'CRI'], subtlety: 2,
    differences: [
      'Thailand: red–white–BLUE–white–red (wide blue centre).',
      'Costa Rica: blue–white–RED–white–blue (wide red centre).',
    ],
    cues: { THA: 'Blue centre', CRI: 'Red centre' },
  },
  {
    id: 'haiti-liechtenstein', title: 'Blue over red', members: ['HTI', 'LIE'], subtlety: 1,
    differences: [
      'Haiti has a white panel with a coat of arms (palm tree) in the centre.',
      'Liechtenstein has a golden crown in the top-left corner.',
    ],
    cues: { HTI: 'White centre panel', LIE: 'Crown in the corner' },
  },
  {
    id: 'quartered', title: 'Quartered red, white and blue', members: ['DOM', 'PAN'], subtlety: 1,
    differences: [
      'The Dominican Republic has a white cross separating blue and red quarters, with a shield in the centre.',
      'Panama has two white quarters, each with a star (blue and red), and no cross.',
    ],
    cues: { DOM: 'White cross and shield', PAN: 'Two stars, no cross' },
  },
  {
    id: 'stars-and-stripes', title: 'Stars and stripes', members: ['USA', 'LBR', 'MYS'], subtlety: 1,
    differences: [
      'USA: 13 stripes and 50 stars.',
      'Liberia: 11 stripes and a single white star.',
      'Malaysia: 14 stripes and a yellow crescent with a 14-pointed star.',
    ],
    cues: { USA: '50 stars', LBR: 'One star', MYS: 'Yellow crescent and star' },
  },
  {
    id: 'sun-discs', title: 'Discs on a plain field', members: ['JPN', 'BGD', 'PLW'], subtlety: 1,
    differences: [
      'Japan: red disc on white, centred.',
      'Bangladesh: red disc on green, slightly toward the hoist.',
      'Palau: yellow disc on light blue, slightly toward the hoist.',
    ],
    cues: { JPN: 'Red on white', BGD: 'Red on green', PLW: 'Yellow on blue' },
  },
  {
    id: 'niger-india', title: 'Orange–white–green with a centre disc', members: ['NER', 'IND'], subtlety: 2,
    differences: [
      'India has a navy-blue wheel with 24 spokes; Niger has a plain orange disc.',
      'Niger is nearly square (6:7); India is 2:3.',
    ],
    cues: { NER: 'Orange disc, almost square', IND: 'Blue wheel' },
  },
  {
    id: 'crescents-on-red', title: 'White crescent on red', members: ['TUR', 'TUN'], subtlety: 1,
    differences: [
      'Türkiye: crescent and star directly on the red field, toward the hoist.',
      'Tunisia: a white disc in the centre containing a red crescent and star.',
    ],
    cues: { TUR: 'No disc', TUN: 'White disc' },
  },
  {
    id: 'hoist-wedge', title: 'Triangle at the hoist, two halves', members: ['CZE', 'PHL'], subtlety: 1,
    differences: [
      'Czechia: white over red with a plain blue triangle.',
      'Philippines: blue over red with a white triangle holding a sun and three stars.',
    ],
    cues: { CZE: 'Blue triangle', PHL: 'White triangle with sun' },
  },
  {
    id: 'congo-diagonals', title: 'Diagonal bands in Africa', members: ['COG', 'COD', 'TZA', 'NAM'], subtlety: 2,
    differences: [
      'Republic of the Congo: green–yellow–red diagonal, no star.',
      'DR Congo: sky blue with a red diagonal and a yellow star.',
      'Tanzania: green and blue split by a black band edged in yellow.',
      'Namibia: blue, red and green with a golden sun in the blue.',
    ],
    cues: { COG: 'Green–yellow–red, no star', COD: 'Sky blue + yellow star', TZA: 'Green/blue + black band', NAM: 'Golden sun' },
  },
  {
    id: 'caribbean-diagonals', title: 'Black diagonal bands', members: ['TTO', 'KNA'], subtlety: 1,
    differences: [
      'Trinidad and Tobago: red field with a black diagonal edged in white.',
      'St Kitts and Nevis: green and red triangles with a black diagonal edged in yellow holding two white stars.',
    ],
    cues: { TTO: 'All red, white edges', KNA: 'Green/red, two stars' },
  },
  {
    id: 'west-africa-blocks', title: 'Vertical band at the hoist', members: ['BEN', 'GNB', 'MDG'], subtlety: 2,
    differences: [
      'Benin: green hoist band, yellow over red.',
      'Guinea-Bissau: red hoist band with a black star, yellow over green.',
      'Madagascar: white hoist band, red over green.',
    ],
    cues: { BEN: 'Green band', GNB: 'Red band + black star', MDG: 'White band' },
  },
  {
    id: 'black-red-green', title: 'Black–red–green horizontals', members: ['KEN', 'MWI', 'SSD'], subtlety: 2,
    differences: [
      'Kenya: white edges between stripes and a Maasai shield in the centre.',
      'Malawi: a red rising sun in the top black stripe.',
      'South Sudan: a blue triangle with a yellow star at the hoist.',
    ],
    cues: { KEN: 'Maasai shield', MWI: 'Rising sun', SSD: 'Blue triangle' },
  },
  {
    id: 'green-white-blue', title: 'Three-stripe greens and blues', members: ['SLE', 'GAB'], subtlety: 2,
    differences: [
      'Sierra Leone: green–white–blue.',
      'Gabon: green–yellow–blue, and nearly square (3:4).',
    ],
    cues: { SLE: 'White middle', GAB: 'Yellow middle' },
  },
  {
    id: 'eagles', title: 'Double-headed eagles on red', members: ['ALB', 'MNE'], subtlety: 1,
    differences: [
      'Albania: a black eagle on plain red.',
      'Montenegro: a golden eagle on red with a gold border.',
    ],
    cues: { ALB: 'Black eagle', MNE: 'Gold eagle, gold border' },
  },
  {
    id: 'senegal-burkina', title: 'Stars on red and green', members: ['BFA', 'VNM', 'MRT'], subtlety: 1,
    differences: [
      'Burkina Faso: red over green with a yellow star.',
      'Vietnam: all red with a yellow star.',
      'Mauritania: green with a gold crescent and star, with red edges.',
    ],
    cues: { BFA: 'Red over green', VNM: 'All red', MRT: 'Green + crescent' },
  },
];

export const GROUP_BY_ID = Object.fromEntries(SIMILAR_GROUPS.map((g) => [g.id, g]));

export function similarTo(code: string): string[] {
  const out = new Set<string>();
  for (const g of SIMILAR_GROUPS) if (g.members.includes(code)) g.members.forEach((m) => m !== code && out.add(m));
  return [...out];
}

export function groupsFor(code: string): SimilarGroup[] {
  return SIMILAR_GROUPS.filter((g) => g.members.includes(code));
}
