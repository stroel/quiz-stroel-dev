import { readJson, writeJson } from '@/lib/storage';

export type Outcome = 'clean' | 'hinted' | 'missed';

export interface QuestionResult {
  id: string;
  outcome: Outcome;
  hints: number;
  wrongTries: number;
  /** Set when the time limit ran out; the outcome is then `missed`. */
  timedOut?: true;
}

/** Running totals per question id, kept across rounds for a later "weak spots" mode. */
export interface HistoryEntry {
  seen: number;
  clean: number;
  hinted: number;
  missed: number;
  lastSeen: string;
}

export type History = Record<string, HistoryEntry>;

function historyKey(quiz: string): string {
  return `quiz:${quiz}:history`;
}

export function recordResults(quiz: string, results: QuestionResult[]): void {
  const history = readJson<History>(historyKey(quiz), {});
  const now = new Date().toISOString();
  for (const result of results) {
    const entry = history[result.id] ?? { seen: 0, clean: 0, hinted: 0, missed: 0, lastSeen: now };
    entry.seen++;
    entry[result.outcome]++;
    entry.lastSeen = now;
    history[result.id] = entry;
  }
  writeJson(historyKey(quiz), history);
}
