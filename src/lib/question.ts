import type { MatchCandidate } from '@/lib/matcher';

/**
 * One question in a typed-answer quiz. The round only knows these fields; what
 * the player sees above the input (a flag, a country name) is drawn by the quiz.
 */
export interface Question {
  /** Id in the quiz's history; the matcher's candidate with the same id is the expected answer. */
  id: string;
  /** The answer as shown: in the mask, in the feedback and after "Toon". */
  answer: string;
  /** Flag code, for the picture in the results list and to preload the next one. */
  flag?: string;
  /** Line in the results list; the answer when absent. */
  label?: string;
  /** A short note shown once the question is answered. */
  note?: string;
}

/** Every answer a quiz knows, so a near-miss on another one is still caught. */
export type Candidates = MatchCandidate[];
