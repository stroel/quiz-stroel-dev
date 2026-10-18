/**
 * Hints for a typed answer. The first hint shows the shape of the answer (one
 * slot per letter, spaces and punctuation as they are); every hint after that
 * reveals one random letter that is not shown yet.
 */

export interface HintState {
  /** Number of hints taken for this question. 0 means no mask is shown. */
  level: number;
  /** Indexes into the answer whose letter is revealed. */
  revealed: number[];
}

export const NO_HINTS: HintState = { level: 0, revealed: [] };

/** A slot holds a letter the player has to supply; anything else is shown as is. */
export function isSlot(char: string): boolean {
  return /\p{L}/u.test(char);
}

function slotIndexes(answer: string): number[] {
  return [...answer].flatMap((char, index) => (isSlot(char) ? [index] : []));
}

/** Whether another hint would show anything new. */
export function canHint(answer: string, state: HintState): boolean {
  if (state.level === 0) return true;
  return state.revealed.length < slotIndexes(answer).length - 1;
}

/**
 * Takes the next hint. Never reveals the last hidden letter: at that point the
 * answer is given away and "Toon antwoord" is the honest button.
 */
export function nextHint(answer: string, state: HintState, random = Math.random): HintState {
  if (!canHint(answer, state)) return state;
  if (state.level === 0) return { level: 1, revealed: [] };
  const hidden = slotIndexes(answer).filter((index) => !state.revealed.includes(index));
  const pick = hidden[Math.floor(random() * hidden.length)];
  if (pick === undefined) return state;
  return { level: state.level + 1, revealed: [...state.revealed, pick] };
}

export interface MaskCell {
  char: string;
  kind: 'revealed' | 'typed' | 'empty' | 'fixed';
}

/**
 * Lays the typed letters over the mask: revealed letters stay put and typed
 * letters fill the remaining slots from left to right, so the player never
 * has to type a letter that a hint already gave.
 */
export function buildMask(answer: string, state: HintState, typed: string): MaskCell[] {
  const letters = [...typed].filter(isSlot);
  let next = 0;
  return [...answer].map((char, index) => {
    if (!isSlot(char)) return { char, kind: 'fixed' };
    if (state.revealed.includes(index)) return { char, kind: 'revealed' };
    const letter = letters[next];
    next++;
    return letter === undefined ? { char: '', kind: 'empty' } : { char: letter, kind: 'typed' };
  });
}

/** The answer as the mask spells it, for matching alongside the raw input. */
export function maskText(cells: MaskCell[]): string {
  return cells.map((cell) => (cell.kind === 'empty' ? '' : cell.char)).join('');
}
