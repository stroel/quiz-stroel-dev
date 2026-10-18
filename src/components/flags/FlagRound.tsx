import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react';

import Icon from '@/components/Icon';
import { FLAGS, type FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';
import {
  buildMask,
  canHint,
  maskText,
  nextHint,
  NO_HINTS,
  type HintState,
  type MaskCell,
} from '@/lib/hints';
import { flagSrc } from '@/lib/flag-pool';
import type { QuestionResult } from '@/lib/history';
import { matchAnswer, normalize, type MatchCandidate } from '@/lib/matcher';

type Status = 'asking' | 'wrong' | 'correct' | 'revealed';

// How long a correct answer stays on screen before the next flag.
const ADVANCE_DELAY_MS = 1100;

// Every known answer, not just this round's, so a near-miss on a flag outside
// the selection is still caught by the collision check.
const CANDIDATES: MatchCandidate[] = FLAGS.map((flag) => ({
  id: flag.code,
  names: [flag.name, ...(flag.aliases ?? [])],
}));

/**
 * Keeps the round exactly as tall as the visible viewport. iOS Safari lays the
 * keyboard over the page instead of shrinking it, so `100dvh` alone would hide
 * the input behind it.
 */
function useVisibleHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      setHeight(viewport.height);
      window.scrollTo(0, 0);
    };
    update();
    viewport.addEventListener('resize', update);
    return () => viewport.removeEventListener('resize', update);
  }, []);
  return height;
}

function Mask({ cells }: { cells: MaskCell[] }) {
  // Group per word so a long name wraps between words, never inside one.
  const words: MaskCell[][] = [[]];
  for (const cell of cells) {
    if (cell.char === ' ' && cell.kind === 'fixed') words.push([]);
    else words.at(-1)!.push(cell);
  }
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2" aria-hidden>
      {words.map((word, w) => (
        <div key={w} className="flex gap-1">
          {word.map((cell, c) =>
            cell.kind === 'fixed' ? (
              <span key={c} className="flex h-9 w-3 items-end justify-center text-xl font-bold">
                {cell.char}
              </span>
            ) : (
              <span
                key={c}
                className={`flex h-9 w-6 items-end justify-center border-b-2 pb-0.5 text-xl font-bold uppercase ${
                  cell.kind === 'revealed'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-slate-400 text-slate-900 dark:border-slate-500 dark:text-slate-100'
                }`}
              >
                {cell.char}
              </span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

export default function FlagRound({
  flags,
  onFinish,
}: {
  flags: FlagEntry[];
  onFinish: (results: QuestionResult[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [hint, setHint] = useState<HintState>(NO_HINTS);
  const [status, setStatus] = useState<Status>('asking');
  const [approximate, setApproximate] = useState(false);
  const [wrongTries, setWrongTries] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const height = useVisibleHeight();

  const flag = flags[index]!;
  const expected = CANDIDATES.find((candidate) => candidate.id === flag.code)!;
  const cells = useMemo(() => buildMask(flag.name, hint, input), [flag.name, hint, input]);
  const done = status === 'correct' || status === 'revealed';

  useEffect(() => {
    const following = flags[index + 1];
    if (following) new Image().src = flagSrc(following.code);
  }, [flags, index]);

  useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  function finishQuestion(result: QuestionResult): QuestionResult[] {
    const next = [...results, result];
    setResults(next);
    return next;
  }

  function advance(all: QuestionResult[] = results) {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    if (index + 1 >= flags.length) {
      onFinish(all);
      return;
    }
    setIndex(index + 1);
    setInput('');
    setHint(NO_HINTS);
    setStatus('asking');
    setApproximate(false);
    setWrongTries(0);
    inputRef.current?.focus();
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (done) {
      advance();
      return;
    }
    if (normalize(input) === '') return;

    const attempts = hint.level > 0 ? [input, maskText(cells)] : [input];
    const match = attempts
      .map((attempt) => matchAnswer(attempt, expected, CANDIDATES))
      .find((result) => result.correct);

    if (!match) {
      setStatus('wrong');
      setWrongTries(wrongTries + 1);
      setShakeKey(shakeKey + 1);
      inputRef.current?.select();
      return;
    }

    setStatus('correct');
    setApproximate(match.approximate);
    const all = finishQuestion({
      id: flag.code,
      outcome: hint.level > 0 ? 'hinted' : 'clean',
      hints: hint.level,
      wrongTries,
    });
    advanceTimer.current = window.setTimeout(() => advance(all), ADVANCE_DELAY_MS);
  }

  function takeHint() {
    // A rejected answer would otherwise be poured into the fresh mask.
    if (status === 'wrong') {
      setInput('');
      setStatus('asking');
    }
    setHint(nextHint(flag.name, hint));
    inputRef.current?.focus();
  }

  function reveal() {
    setStatus('revealed');
    finishQuestion({ id: flag.code, outcome: 'missed', hints: hint.level, wrongTries });
  }

  function stop() {
    onFinish(results);
  }

  const feedback =
    status === 'correct'
      ? {
          tone: 'text-emerald-600 dark:text-emerald-400',
          icon: 'circle-check',
          text: approximate ? T.quiz.correctAs(flag.name) : T.quiz.correct,
        }
      : status === 'revealed'
        ? {
            tone: 'text-rose-600 dark:text-rose-400',
            icon: 'circle-x',
            text: T.quiz.revealed(flag.name),
          }
        : status === 'wrong'
          ? { tone: 'text-rose-600 dark:text-rose-400', icon: 'x', text: T.quiz.wrong }
          : null;

  return (
    <div
      className="mx-auto flex h-dvh max-w-xl flex-col overflow-hidden"
      style={height === null ? undefined : { height: `${height}px` }}
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <button
          type="button"
          onClick={stop}
          aria-label={T.quiz.stop}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="x" />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-slate-900 transition-[width] duration-300 dark:bg-white"
            style={{ width: `${(index / flags.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-slate-500 tabular-nums dark:text-slate-400">
          {T.quiz.progress(index + 1, flags.length)}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <img
          key={flag.code}
          src={flagSrc(flag.code)}
          alt={T.quiz.flagAlt}
          className="max-h-full max-w-full rounded-lg object-contain shadow-lg ring-1 ring-slate-900/10 dark:ring-white/10"
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {hint.level > 0 && !done && <Mask cells={cells} />}

        <p
          className={`flex min-h-7 items-center justify-center gap-2 text-center text-lg font-semibold ${feedback?.tone ?? ''}`}
          aria-live="polite"
        >
          {feedback && (
            <>
              <Icon name={feedback.icon} className="h-5 w-5 shrink-0" />
              {feedback.text}
            </>
          )}
        </p>

        <form onSubmit={submit} className="flex gap-2">
          <input
            key={shakeKey}
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (status === 'wrong') setStatus('asking');
            }}
            placeholder={T.quiz.placeholder}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            enterKeyHint={done ? 'next' : 'go'}
            readOnly={done}
            className={`h-14 min-w-0 flex-1 rounded-2xl border-2 bg-white px-4 text-xl focus:outline-none dark:bg-slate-800 ${
              status === 'wrong'
                ? 'animate-shake border-rose-500'
                : status === 'correct'
                  ? 'border-emerald-500'
                  : 'border-slate-300 focus:border-slate-900 dark:border-slate-700 dark:focus:border-white'
            }`}
          />
          <button
            type="submit"
            aria-label={done ? T.quiz.next : T.quiz.check}
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Icon name={done ? 'arrow-right' : 'corner-down-left'} className="h-6 w-6" />
          </button>
        </form>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={takeHint}
            disabled={done || !canHint(flag.name, hint)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-40 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
          >
            <Icon name="lightbulb" />
            {T.quiz.hint}
            {hint.level > 0 && <span className="tabular-nums opacity-70">{hint.level}</span>}
          </button>
          <button
            type="button"
            onClick={reveal}
            disabled={done}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="eye" />
            {T.quiz.reveal}
          </button>
        </div>
      </div>
    </div>
  );
}
