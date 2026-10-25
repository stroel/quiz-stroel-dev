import { ANIMALS, type Animal } from '@/data/animals';
import {
  COUNT_WORDS,
  GREEK,
  NATO,
  PHOBIAS,
  ROMAN_NUMBERS,
  SCIENCES,
  toRoman,
  type WordEntry,
} from '@/data/words';
import { T } from '@/i18n/nl';
import type { Candidates, Question } from '@/lib/question';

/** One series on the setup screen of the language quiz. */
export type WordSeries =
  | 'jong'
  | 'mannetje'
  | 'vrouwtje'
  | 'groep'
  | 'geluid'
  | 'verblijf'
  | 'navo'
  | 'grieks'
  | 'logie'
  | 'fobie'
  | 'telwoord'
  | 'romeins-lezen'
  | 'romeins-schrijven';

/** The panels on the setup screen, each with its series in order. */
export const SERIES_GROUPS = {
  dieren: ['jong', 'mannetje', 'vrouwtje', 'groep', 'geluid', 'verblijf'],
  woorden: ['navo', 'grieks', 'logie', 'fobie'],
  getallen: ['telwoord', 'romeins-lezen', 'romeins-schrijven'],
} as const satisfies Record<string, readonly WordSeries[]>;

export type SeriesGroup = keyof typeof SERIES_GROUPS;

export const ALL_SERIES: WordSeries[] = Object.values(SERIES_GROUPS).flat();

/** A question of the language quiz: what it shows, and the answers that count. */
export interface WordQuestion {
  /** `<series>:<key>`, stable: it keys the history. */
  id: string;
  series: WordSeries;
  /** The small line above the prompt: "Het jong van een". */
  ask: string;
  /** The large text: "paard", "Κ κ", "MCMXCIV". */
  prompt: string;
  /** The first is the answer shown; the rest also count. */
  answers: string[];
  note?: string;
  /** Numbers and Roman numerals: one character off is another answer. */
  exact?: true;
  /** For a prompt not in Dutch, so it is read and rendered right. */
  lang?: string;
}

type AnimalField = 'young' | 'male' | 'female' | 'group' | 'sound' | 'home';

const ANIMAL_SERIES: [WordSeries, AnimalField][] = [
  ['jong', 'young'],
  ['mannetje', 'male'],
  ['vrouwtje', 'female'],
  ['groep', 'group'],
  ['geluid', 'sound'],
  ['verblijf', 'home'],
];

function fromAnimals(series: WordSeries, field: AnimalField): WordQuestion[] {
  return ANIMALS.flatMap((animal: Animal) => {
    const answers = animal[field];
    if (!answers || answers.length === 0) return [];
    return [
      {
        id: `${series}:${animal.id}`,
        series,
        ask: T.language.ask[series],
        // A group is of many animals: "een groep wolven".
        prompt: field === 'group' ? animal.plural : animal.name,
        answers,
      },
    ];
  });
}

function fromWords(
  series: WordSeries,
  entries: WordEntry[],
  extra: Partial<WordQuestion> = {},
): WordQuestion[] {
  return entries.map((entry) => ({
    id: `${series}:${entry.key}`,
    series,
    ask: T.language.ask[series],
    prompt: entry.prompt,
    answers: entry.answers,
    ...(entry.note && { note: entry.note }),
    ...extra,
  }));
}

/** Every question the language quiz knows, in series order. */
export const WORD_QUESTIONS: WordQuestion[] = [
  ...ANIMAL_SERIES.flatMap(([series, field]) => fromAnimals(series, field)),
  ...fromWords('navo', NATO),
  ...fromWords('grieks', GREEK, { lang: 'el' }),
  ...fromWords('logie', SCIENCES),
  ...fromWords('fobie', PHOBIAS),
  ...COUNT_WORDS.map((entry): WordQuestion => ({
    id: `telwoord:${entry.key}`,
    series: 'telwoord',
    ask: T.language.askCount[entry.unit],
    prompt: entry.prompt,
    answers: entry.answers,
    exact: true,
    ...(entry.note && { note: entry.note }),
  })),
  ...ROMAN_NUMBERS.map((value): WordQuestion => ({
    id: `romeins-lezen:${value}`,
    series: 'romeins-lezen',
    ask: T.language.ask['romeins-lezen'],
    prompt: toRoman(value),
    answers: [String(value)],
    exact: true,
  })),
  ...ROMAN_NUMBERS.map((value): WordQuestion => ({
    id: `romeins-schrijven:${value}`,
    series: 'romeins-schrijven',
    ask: T.language.ask['romeins-schrijven'],
    prompt: String(value),
    answers: [toRoman(value)],
    exact: true,
  })),
];

export const WORD_BY_ID = new Map(WORD_QUESTIONS.map((question) => [question.id, question]));

export function questionsIn(series: WordSeries): WordQuestion[] {
  return WORD_QUESTIONS.filter((question) => question.series === series);
}

/** "paard: veulen, koe: kalf": a few pairs that show what a series asks. */
export function seriesExamples(series: WordSeries): string {
  return questionsIn(series)
    .slice(0, 2)
    .map((question) => `${question.prompt}: ${question.answers[0]}`)
    .join(', ');
}

// Every answer of every series, so a near-miss on another answer is still
// caught. Exact questions never reach the collision check.
export const WORD_CANDIDATES: Candidates = WORD_QUESTIONS.map((question) => ({
  id: question.id,
  names: question.answers,
}));

// Prompts that read as a question and get a question mark: "Het jong van een paard?"
const ASKS_QUESTION: ReadonlySet<WordSeries> = new Set([
  'jong',
  'mannetje',
  'vrouwtje',
  'groep',
  'geluid',
  'verblijf',
  'logie',
  'fobie',
  'telwoord',
  'romeins-lezen',
]);

export function promptText(question: WordQuestion): string {
  return ASKS_QUESTION.has(question.series) ? `${question.prompt}?` : question.prompt;
}

export function toQuestion(word: WordQuestion): Question {
  return {
    id: word.id,
    answer: word.answers[0]!,
    label: `${word.ask} ${word.prompt}: ${word.answers[0]}`,
    ...(word.note && { note: word.note }),
    ...(word.exact && { exact: true }),
  };
}
