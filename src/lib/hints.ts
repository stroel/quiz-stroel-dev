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
  kind: 'revealed' | 'empty' | 'fixed';
}

/**
 * The mask a hint shows: revealed letters, empty slots for the rest, and
 * spaces, hyphens and apostrophes as they are. What the player types stays in
 * the input and is never poured into the mask (Steve, 18-10-2026): the answer
 * is always typed in full.
 */
export function buildMask(answer: string, state: HintState): MaskCell[] {
  return [...answer].map((char, index) => {
    if (!isSlot(char)) return { char, kind: 'fixed' };
    if (state.revealed.includes(index)) return { char, kind: 'revealed' };
    return { char: '', kind: 'empty' };
  });
}
