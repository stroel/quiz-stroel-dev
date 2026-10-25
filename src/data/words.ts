/**
 * Word series for the language quiz that are not about animals: the NATO
 * spelling alphabet, Greek letters, sciences, phobias, old counting words and
 * the numbers used for the Roman numeral series. See docs/taal.md.
 *
 * Every entry is a prompt and its answers: the first answer is the one shown,
 * the rest also count. Keys are stable: they key the history.
 */

export interface WordEntry {
  /** Stable within its series; the question id is `<series>:<key>`. */
  key: string;
  /** What the player sees in large type. */
  prompt: string;
  answers: string[];
  /** A short Dutch note shown once answered. */
  note?: string;
}

/** ICAO/NATO spelling alphabet: the official spellings are Alfa and Juliett. */
export const NATO: WordEntry[] = [
  { key: 'a', prompt: 'A', answers: ['Alfa', 'Alpha'] },
  { key: 'b', prompt: 'B', answers: ['Bravo'] },
  { key: 'c', prompt: 'C', answers: ['Charlie'] },
  { key: 'd', prompt: 'D', answers: ['Delta'] },
  { key: 'e', prompt: 'E', answers: ['Echo'] },
  { key: 'f', prompt: 'F', answers: ['Foxtrot'] },
  { key: 'g', prompt: 'G', answers: ['Golf'] },
  { key: 'h', prompt: 'H', answers: ['Hotel'] },
  { key: 'i', prompt: 'I', answers: ['India'] },
  { key: 'j', prompt: 'J', answers: ['Juliett', 'Juliet'] },
  { key: 'k', prompt: 'K', answers: ['Kilo'] },
  { key: 'l', prompt: 'L', answers: ['Lima'] },
  { key: 'm', prompt: 'M', answers: ['Mike'] },
  { key: 'n', prompt: 'N', answers: ['November'] },
  { key: 'o', prompt: 'O', answers: ['Oscar'] },
  { key: 'p', prompt: 'P', answers: ['Papa'] },
  { key: 'q', prompt: 'Q', answers: ['Quebec'] },
  { key: 'r', prompt: 'R', answers: ['Romeo'] },
  { key: 's', prompt: 'S', answers: ['Sierra'] },
  { key: 't', prompt: 'T', answers: ['Tango'] },
  { key: 'u', prompt: 'U', answers: ['Uniform'] },
  { key: 'v', prompt: 'V', answers: ['Victor'] },
  { key: 'w', prompt: 'W', answers: ['Whiskey', 'Whisky'] },
  { key: 'x', prompt: 'X', answers: ['X-ray', 'Xray'] },
  { key: 'y', prompt: 'Y', answers: ['Yankee'] },
  { key: 'z', prompt: 'Z', answers: ['Zulu'] },
];

/** Dutch spelling first (Van Dale: bèta, thèta, jota, omikron, ypsilon), then the usual English one. */
export const GREEK: WordEntry[] = [
  { key: 'alfa', prompt: 'Α α', answers: ['alfa', 'alpha'] },
  { key: 'beta', prompt: 'Β β', answers: ['bèta', 'beta'] },
  { key: 'gamma', prompt: 'Γ γ', answers: ['gamma'] },
  { key: 'delta', prompt: 'Δ δ', answers: ['delta'] },
  { key: 'epsilon', prompt: 'Ε ε', answers: ['epsilon'] },
  { key: 'zeta', prompt: 'Ζ ζ', answers: ['zèta', 'zeta'] },
  { key: 'eta', prompt: 'Η η', answers: ['èta', 'eta'] },
  { key: 'theta', prompt: 'Θ θ', answers: ['thèta', 'theta'] },
  { key: 'jota', prompt: 'Ι ι', answers: ['jota', 'iota'] },
  { key: 'kappa', prompt: 'Κ κ', answers: ['kappa'] },
  { key: 'lambda', prompt: 'Λ λ', answers: ['lambda'] },
  { key: 'mu', prompt: 'Μ μ', answers: ['mu', 'my'] },
  { key: 'nu', prompt: 'Ν ν', answers: ['nu', 'ny'] },
  { key: 'xi', prompt: 'Ξ ξ', answers: ['xi', 'ksi'] },
  { key: 'omikron', prompt: 'Ο ο', answers: ['omikron', 'omicron'] },
  { key: 'pi', prompt: 'Π π', answers: ['pi'] },
  { key: 'rho', prompt: 'Ρ ρ', answers: ['rho', 'ro'] },
  { key: 'sigma', prompt: 'Σ σ', answers: ['sigma'] },
  { key: 'tau', prompt: 'Τ τ', answers: ['tau'] },
  { key: 'ypsilon', prompt: 'Υ υ', answers: ['ypsilon', 'upsilon'] },
  { key: 'phi', prompt: 'Φ φ', answers: ['phi', 'fi'] },
  { key: 'chi', prompt: 'Χ χ', answers: ['chi', 'khi'] },
  { key: 'psi', prompt: 'Ψ ψ', answers: ['psi'] },
  { key: 'omega', prompt: 'Ω ω', answers: ['omega'] },
];

/**
 * "De studie van vogels" → ornithologie. Asked this way round because the
 * term has one spelling, while its subject can be put in many words.
 */
export const SCIENCES: WordEntry[] = [
  { key: 'ornithologie', prompt: 'vogels', answers: ['ornithologie', 'ornitologie'] },
  { key: 'entomologie', prompt: 'insecten', answers: ['entomologie'] },
  { key: 'ichtyologie', prompt: 'vissen', answers: ['ichtyologie', 'ichthyologie'] },
  { key: 'herpetologie', prompt: 'reptielen en amfibieën', answers: ['herpetologie'] },
  { key: 'arachnologie', prompt: 'spinnen', answers: ['arachnologie'] },
  { key: 'malacologie', prompt: 'weekdieren', answers: ['malacologie', 'malakologie'] },
  { key: 'cetologie', prompt: 'walvissen en dolfijnen', answers: ['cetologie'] },
  { key: 'primatologie', prompt: 'apen en andere primaten', answers: ['primatologie'] },
  { key: 'mycologie', prompt: 'paddenstoelen en schimmels', answers: ['mycologie'] },
  { key: 'dendrologie', prompt: 'bomen', answers: ['dendrologie'] },
  { key: 'cardiologie', prompt: 'het hart', answers: ['cardiologie'] },
  { key: 'dermatologie', prompt: 'de huid', answers: ['dermatologie'] },
  { key: 'oncologie', prompt: 'kanker', answers: ['oncologie'] },
  { key: 'neurologie', prompt: 'het zenuwstelsel', answers: ['neurologie'] },
  { key: 'hematologie', prompt: 'het bloed', answers: ['hematologie', 'haematologie'] },
  { key: 'oftalmologie', prompt: 'het oog', answers: ['oftalmologie', 'ophthalmologie'] },
  { key: 'nefrologie', prompt: 'de nieren', answers: ['nefrologie'] },
  {
    key: 'gynaecologie',
    prompt: 'de vrouwelijke geslachtsorganen',
    answers: ['gynaecologie', 'gynecologie'],
  },
  { key: 'gerontologie', prompt: 'het ouder worden', answers: ['gerontologie'] },
  { key: 'seismologie', prompt: 'aardbevingen', answers: ['seismologie'] },
  { key: 'vulkanologie', prompt: 'vulkanen', answers: ['vulkanologie', 'volcanologie'] },
  { key: 'meteorologie', prompt: 'het weer', answers: ['meteorologie'] },
  { key: 'klimatologie', prompt: 'het klimaat', answers: ['klimatologie'] },
  { key: 'glaciologie', prompt: 'gletsjers en ijs', answers: ['glaciologie'] },
  { key: 'speleologie', prompt: 'grotten', answers: ['speleologie'] },
  { key: 'kosmologie', prompt: 'het heelal als geheel', answers: ['kosmologie', 'cosmologie'] },
  { key: 'egyptologie', prompt: 'het oude Egypte', answers: ['egyptologie'] },
  { key: 'etymologie', prompt: 'de herkomst van woorden', answers: ['etymologie'] },
  { key: 'musicologie', prompt: 'muziek', answers: ['musicologie', 'muziekwetenschap'] },
  { key: 'criminologie', prompt: 'misdaad', answers: ['criminologie'] },
  { key: 'oenologie', prompt: 'wijn', answers: ['oenologie', 'enologie'] },
  { key: 'grafologie', prompt: 'het handschrift', answers: ['grafologie'] },
];

/** "Angst voor spinnen" → arachnofobie. */
export const PHOBIAS: WordEntry[] = [
  { key: 'arachnofobie', prompt: 'spinnen', answers: ['arachnofobie'] },
  { key: 'claustrofobie', prompt: 'kleine, afgesloten ruimtes', answers: ['claustrofobie'] },
  {
    key: 'agorafobie',
    prompt: 'open ruimtes en mensenmassa’s',
    answers: ['agorafobie', 'pleinvrees'],
  },
  { key: 'acrofobie', prompt: 'hoogtes', answers: ['acrofobie', 'hoogtevrees'] },
  { key: 'aerofobie', prompt: 'vliegen', answers: ['aerofobie', 'aviofobie', 'vliegangst'] },
  { key: 'hydrofobie', prompt: 'water', answers: ['hydrofobie', 'aquafobie'] },
  { key: 'cynofobie', prompt: 'honden', answers: ['cynofobie'] },
  { key: 'ailurofobie', prompt: 'katten', answers: ['ailurofobie', 'felinofobie'] },
  { key: 'ofidiofobie', prompt: 'slangen', answers: ['ofidiofobie', 'ophidiofobie'] },
  { key: 'ornithofobie', prompt: 'vogels', answers: ['ornithofobie'] },
  { key: 'entomofobie', prompt: 'insecten', answers: ['entomofobie'] },
  { key: 'hemofobie', prompt: 'bloed', answers: ['hemofobie', 'hematofobie'] },
  { key: 'trypanofobie', prompt: 'naalden en injecties', answers: ['trypanofobie'] },
  { key: 'nyctofobie', prompt: 'het donker', answers: ['nyctofobie'] },
  { key: 'astrafobie', prompt: 'onweer', answers: ['astrafobie', 'brontofobie'] },
  { key: 'pyrofobie', prompt: 'vuur', answers: ['pyrofobie'] },
  { key: 'thanatofobie', prompt: 'de dood', answers: ['thanatofobie'] },
  { key: 'emetofobie', prompt: 'braken', answers: ['emetofobie'] },
  { key: 'mysofobie', prompt: 'vuil en bacteriën', answers: ['mysofobie', 'smetvrees'] },
  { key: 'glossofobie', prompt: 'spreken in het openbaar', answers: ['glossofobie'] },
  { key: 'coulrofobie', prompt: 'clowns', answers: ['coulrofobie'] },
  { key: 'trypofobie', prompt: 'groepjes kleine gaatjes', answers: ['trypofobie'] },
  { key: 'xenofobie', prompt: 'vreemdelingen', answers: ['xenofobie'] },
  { key: 'nomofobie', prompt: 'zonder gsm zitten', answers: ['nomofobie'] },
  { key: 'triskaidekafobie', prompt: 'het getal 13', answers: ['triskaidekafobie'] },
  {
    key: 'paraskevidekatriafobie',
    prompt: 'vrijdag de dertiende',
    answers: ['paraskevidekatriafobie'],
  },
  {
    key: 'arachibutyrofobie',
    prompt: 'pindakaas die aan je verhemelte plakt',
    answers: ['arachibutyrofobie'],
  },
  {
    key: 'hippopotomonstrosesquippedaliofobie',
    prompt: 'lange woorden',
    answers: ['hippopotomonstrosesquippedaliofobie'],
  },
];

/** What a counting word counts: things, or years and hours, which the question names. */
export type CountUnit = 'stuks' | 'jaar' | 'uur';

export interface CountEntry extends WordEntry {
  unit: CountUnit;
}

/**
 * Old counting words and time spans (Van Dale). Where the number varied, the
 * older one counts too and the note says so.
 */
export const COUNT_WORDS: CountEntry[] = [
  { key: 'paar', prompt: 'een paar', answers: ['2'], unit: 'stuks' },
  { key: 'dozijn', prompt: 'een dozijn', answers: ['12'], unit: 'stuks' },
  {
    key: 'bakkersdozijn',
    prompt: 'een bakkersdozijn',
    answers: ['13'],
    unit: 'stuks',
    note: 'Een bakker gaf er één extra bij.',
  },
  {
    key: 'mandel',
    prompt: 'een mandel',
    answers: ['15', '16'],
    unit: 'stuks',
    note: 'Vooral voor schoven en eieren; soms 16.',
  },
  { key: 'stijg', prompt: 'een stijg', answers: ['20'], unit: 'stuks' },
  { key: 'schok', prompt: 'een schok', answers: ['60'], unit: 'stuks' },
  { key: 'gros', prompt: 'een gros', answers: ['144'], unit: 'stuks', note: 'Twaalf dozijn.' },
  {
    key: 'groot-gros',
    prompt: 'een groot gros',
    answers: ['1728'],
    unit: 'stuks',
    note: 'Twaalf gros.',
  },
  {
    key: 'boek',
    prompt: 'een boek papier',
    answers: ['25', '24'],
    unit: 'stuks',
    note: 'Vellen; vroeger 24.',
  },
  {
    key: 'riem',
    prompt: 'een riem papier',
    answers: ['500', '480'],
    unit: 'stuks',
    note: 'Vellen, of twintig boek; vroeger 480.',
  },
  { key: 'etmaal', prompt: 'een etmaal', answers: ['24'], unit: 'uur' },
  { key: 'lustrum', prompt: 'een lustrum', answers: ['5'], unit: 'jaar' },
  { key: 'decennium', prompt: 'een decennium', answers: ['10'], unit: 'jaar' },
  { key: 'eeuw', prompt: 'een eeuw', answers: ['100'], unit: 'jaar' },
  { key: 'millennium', prompt: 'een millennium', answers: ['1000'], unit: 'jaar' },
];

/**
 * The numbers for the Roman numeral series: every rule shows up somewhere
 * (IV, IX, XL, XC, CD, CM), plus years a quiz player meets on a building or
 * in a film's credits.
 */
export const ROMAN_NUMBERS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 19, 20, 24, 29, 39, 40, 44, 49, 50, 69, 90, 99,
  100, 400, 444, 500, 900, 999, 1000, 1302, 1492, 1515, 1648, 1789, 1815, 1830, 1914, 1918, 1940,
  1944, 1945, 1958, 1984, 1999, 2000, 2026, 3999,
];

const ROMAN_DIGITS: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** 1994 → MCMXCIV, in the standard subtractive form (1–3999). */
export function toRoman(value: number): string {
  let rest = value;
  let roman = '';
  for (const [amount, digits] of ROMAN_DIGITS) {
    while (rest >= amount) {
      roman += digits;
      rest -= amount;
    }
  }
  return roman;
}
