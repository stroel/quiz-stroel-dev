import { CAPITALS, type CapitalEntry } from '@/data/capitals';
import { COUNTRY_FACTS, type CountryFacts } from '@/data/country-facts';
import { FLAGS, type FlagEntry } from '@/data/flags';
import { selectFlags, type FlagSetup } from '@/lib/flag-pool';
import { normalize } from '@/lib/matcher';
import type { Candidates, Question } from '@/lib/question';

/**
 * What the player types. The first four ask about a country shown with its
 * flag; the last three show a capital, an extension or a plate code and ask
 * for the country.
 */
export type Direction =
  'capital' | 'demonym' | 'adjective' | 'currency' | 'country' | 'tld' | 'plate';

export const DIRECTIONS: Direction[] = [
  'capital',
  'demonym',
  'adjective',
  'currency',
  'country',
  'tld',
  'plate',
];

/** Directions that show something about the country and ask which country it is. */
export function asksCountry(direction: Direction): direction is 'country' | 'tld' | 'plate' {
  return direction === 'country' || direction === 'tld' || direction === 'plate';
}

const CAPITAL_BY_CODE = new Map(CAPITALS.map((capital) => [capital.code, capital]));
const FACTS_BY_CODE = new Map(COUNTRY_FACTS.map((facts) => [facts.code, facts]));
const FLAG_BY_CODE = new Map(FLAGS.map((flag) => [flag.code, flag]));

export function capitalOf(code: string): CapitalEntry | undefined {
  return CAPITAL_BY_CODE.get(code);
}

export function factsOf(code: string): CountryFacts | undefined {
  return FACTS_BY_CODE.get(code);
}

export function countryOf(code: string): FlagEntry | undefined {
  return FLAG_BY_CODE.get(code);
}

/** The answers a direction expects for one country, the shown one first; empty when unknown. */
function answersFor(code: string, direction: Direction): string[] {
  const capital = CAPITAL_BY_CODE.get(code);
  const facts = FACTS_BY_CODE.get(code);
  switch (direction) {
    case 'capital':
      return capital
        ? [capital.name, ...(capital.aliases ?? []), ...(capital.alsoAccepted ?? [])]
        : [];
    case 'demonym':
      return facts?.demonym ?? [];
    case 'adjective':
      return facts?.adjective ?? [];
    case 'currency':
      return facts?.currency ?? [];
    case 'country':
      return capital ? [capital.name] : [];
    case 'tld':
      return facts?.tld ? [facts.tld] : [];
    case 'plate':
      return facts?.plate ? [facts.plate] : [];
  }
}

/** What a reverse question shows in large type: the capital, ".ch", "CH". */
export function shownFor(code: string, direction: 'country' | 'tld' | 'plate'): string {
  return answersFor(code, direction)[0] ?? '';
}

/**
 * The countries a setup plays in a direction: those with a known answer.
 * Organisations have none. Asking for a capital that is the country's own name
 * (Singapore, Luxemburg) gives the answer away, so those only play the other
 * way round.
 */
export function selectFacts(setup: FlagSetup, direction: Direction): FlagEntry[] {
  return selectFlags({ ...setup, organisations: false }).filter((flag) => {
    if (answersFor(flag.code, direction).length === 0) return false;
    return !(direction === 'capital' && CAPITAL_BY_CODE.get(flag.code)?.trivial);
  });
}

// `capital:be` and `country:be` are the ids the capitals quiz used, so its
// history carries over.
function questionId(direction: Direction, code: string): string {
  return `${direction}:${code}`;
}

function countryNames(country: FlagEntry): string[] {
  return [country.name, ...(country.aliases ?? [])];
}

/**
 * Some shown values belong to more than one country (Kingston is the capital of
 * Jamaica and Norfolk), so for "which country?" every country with that value
 * counts as correct.
 */
function reverseCandidates(direction: 'country' | 'tld' | 'plate'): Candidates {
  const byShown = new Map<string, FlagEntry[]>();
  for (const flag of FLAGS) {
    const shown = shownFor(flag.code, direction);
    if (shown === '') continue;
    const key = normalize(shown);
    byShown.set(key, [...(byShown.get(key) ?? []), flag]);
  }
  return FLAGS.flatMap((flag) => {
    const shown = shownFor(flag.code, direction);
    if (shown === '') return [];
    return [
      {
        id: questionId(direction, flag.code),
        names: (byShown.get(normalize(shown)) ?? []).flatMap(countryNames),
      },
    ];
  });
}

const CANDIDATES = new Map<Direction, Candidates>(
  DIRECTIONS.map((direction) => [
    direction,
    asksCountry(direction)
      ? reverseCandidates(direction)
      : FLAGS.flatMap((flag) => {
          const names = answersFor(flag.code, direction);
          return names.length === 0 ? [] : [{ id: questionId(direction, flag.code), names }];
        }),
  ]),
);

export function factCandidates(direction: Direction): Candidates {
  return CANDIDATES.get(direction) ?? [];
}

function noteFor(code: string, direction: Direction): string | undefined {
  if (direction === 'capital' || direction === 'country') return CAPITAL_BY_CODE.get(code)?.note;
  if (direction === 'currency') return FACTS_BY_CODE.get(code)?.currencyNote;
  if (direction === 'demonym' || direction === 'adjective') {
    return FACTS_BY_CODE.get(code)?.demonymNote;
  }
  return undefined;
}

export function factQuestion(flag: FlagEntry, direction: Direction): Question {
  const answer = asksCountry(direction) ? flag.name : answersFor(flag.code, direction)[0]!;
  const shown = asksCountry(direction) ? shownFor(flag.code, direction) : answer;
  const note = noteFor(flag.code, direction);
  return {
    id: questionId(direction, flag.code),
    answer,
    flag: flag.code,
    label: `${flag.name}: ${shown}`,
    ...(note && { note }),
  };
}
