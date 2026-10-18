/**
 * Decides whether a typed answer means the expected one, forgiving typos and
 * Dutch spelling-by-ear, but never accepting an answer that is closer to some
 * other known answer (Mali is not Malawi, Niger is not Nigeria).
 */

export interface MatchCandidate {
  id: string;
  /** The canonical name first, then any aliases. */
  names: string[];
}

export interface MatchResult {
  correct: boolean;
  /** True when the input was accepted but not spelled like any known name. */
  approximate: boolean;
}

// Words that carry no information in a country name and that people drop or
// add freely ("Republiek Congo" vs "Congo").
const FILLER_WORDS = new Set(['republiek', 'van', 'de', 'het', 'en']);

/** Lower case, no accents, letters and single spaces only, filler words removed. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word !== '' && !FILLER_WORDS.has(word))
    .join(' ');
}

/**
 * Collapses spellings that sound the same in Dutch onto one form, so the
 * distance check only has to absorb real typos. Order matters: digraphs go
 * before the single letters they contain.
 */
export function phoneticKey(text: string): string {
  return (
    normalize(text)
      .replace(/ /g, '')
      .replace(/ij|ei|y/g, 'ei')
      .replace(/ch/g, 'g')
      .replace(/ph/g, 'f')
      .replace(/th/g, 't')
      .replace(/au/g, 'ou')
      .replace(/c(?=[eiy])/g, 's')
      .replace(/c/g, 'k')
      .replace(/q/g, 'k')
      .replace(/x/g, 'ks')
      .replace(/z/g, 's')
      .replace(/v/g, 'f')
      .replace(/(dt|d)$/, 't')
      // Double letters become single, so "Marokko" and "Maroko" meet.
      .replace(/(.)\1+/g, '$1')
  );
}

/** Optimal string alignment distance: Levenshtein plus adjacent swaps. */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = d[i]!;
      const prev = d[i - 1]!;
      let best = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, d[i - 2]![j - 2]! + 1);
      }
      row[j] = best;
    }
  }
  return d[a.length]![b.length]!;
}

/** Short names must be exact; longer names absorb one or two typos. */
export function tolerance(key: string): number {
  if (key.length <= 4) return 0;
  if (key.length <= 8) return 1;
  return 2;
}

function closestDistance(input: string, names: string[]): number {
  return Math.min(...names.map((name) => editDistance(input, phoneticKey(name))));
}

/**
 * Checks `input` against `expected`. `all` is every answer the quiz knows, so an
 * input that is nearer to another answer than to the expected one is rejected
 * even when it is within tolerance. A tie with another answer is accepted: both
 * Congos answer to "Congo".
 */
export function matchAnswer(
  input: string,
  expected: MatchCandidate,
  all: MatchCandidate[],
): MatchResult {
  const typed = phoneticKey(input);
  if (typed === '') return { correct: false, approximate: false };

  const exactSpelling = expected.names.some((name) => normalize(name) === normalize(input));
  if (exactSpelling) return { correct: true, approximate: false };

  // Tolerance follows the name being matched, so a short alias like "VS" does
  // not make "Verenigde Staten" strict.
  const withinTolerance = expected.names.some((name) => {
    const key = phoneticKey(name);
    return editDistance(typed, key) <= tolerance(key);
  });
  if (!withinTolerance) return { correct: false, approximate: false };

  const distance = closestDistance(typed, expected.names);

  const closerElsewhere = all.some(
    (other) => other.id !== expected.id && closestDistance(typed, other.names) < distance,
  );
  if (closerElsewhere) return { correct: false, approximate: false };

  return { correct: true, approximate: true };
}
