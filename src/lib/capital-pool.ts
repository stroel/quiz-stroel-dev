import { CAPITALS, type CapitalEntry } from '@/data/capitals';
import { FLAGS, type FlagEntry } from '@/data/flags';
import { selectFlags, type FlagSetup } from '@/lib/flag-pool';
import { normalize } from '@/lib/matcher';
import type { Candidates, Question } from '@/lib/question';

/** What the player types: the capital of a country, or the country of a capital. */
export type Direction = 'capital' | 'country';

const CAPITAL_BY_CODE = new Map(CAPITALS.map((capital) => [capital.code, capital]));
const FLAG_BY_CODE = new Map(FLAGS.map((flag) => [flag.code, flag]));

export function capitalOf(code: string): CapitalEntry | undefined {
  return CAPITAL_BY_CODE.get(code);
}

export function countryOf(code: string): FlagEntry | undefined {
  return FLAG_BY_CODE.get(code);
}

/**
 * The countries a setup plays. Organisations have no capital. Asking for a
 * capital that is the country's own name (Singapore, Luxemburg) gives the
 * answer away, so those only play the other way round.
 */
export function selectCapitals(setup: FlagSetup, direction: Direction): FlagEntry[] {
  return selectFlags({ ...setup, organisations: false }).filter((flag) => {
    const capital = CAPITAL_BY_CODE.get(flag.code);
    return capital !== undefined && !(direction === 'capital' && capital.trivial);
  });
}

function questionId(direction: Direction, code: string): string {
  return `${direction}:${code}`;
}

// Every name a capital goes by: a second official capital counts as correct too.
const CAPITAL_CANDIDATES: Candidates = CAPITALS.map((capital) => ({
  id: questionId('capital', capital.code),
  names: [capital.name, ...(capital.aliases ?? []), ...(capital.alsoAccepted ?? [])],
}));

// Some capitals share a name (Kingston is Jamaica's and Norfolk's), so for
// "which country?" every country with that capital counts as correct.
const COUNTRIES_BY_CAPITAL = new Map<string, FlagEntry[]>();
for (const capital of CAPITALS) {
  const key = normalize(capital.name);
  const country = FLAG_BY_CODE.get(capital.code);
  if (country) COUNTRIES_BY_CAPITAL.set(key, [...(COUNTRIES_BY_CAPITAL.get(key) ?? []), country]);
}

const COUNTRY_CANDIDATES: Candidates = CAPITALS.map((capital) => ({
  id: questionId('country', capital.code),
  names: (COUNTRIES_BY_CAPITAL.get(normalize(capital.name)) ?? []).flatMap((country) => [
    country.name,
    ...(country.aliases ?? []),
  ]),
}));

export function capitalCandidates(direction: Direction): Candidates {
  return direction === 'capital' ? CAPITAL_CANDIDATES : COUNTRY_CANDIDATES;
}

export function capitalQuestion(flag: FlagEntry, direction: Direction): Question {
  const capital = CAPITAL_BY_CODE.get(flag.code)!;
  return {
    id: questionId(direction, flag.code),
    answer: direction === 'capital' ? capital.name : flag.name,
    flag: flag.code,
    label: `${flag.name}: ${capital.name}`,
    ...(capital.note && { note: capital.note }),
  };
}
