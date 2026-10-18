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

// Often enough for a smooth countdown bar, rarely enough to stay cheap.
const TIMER_TICK_MS = 100;

// Below this share of the time left, the countdown turns red.
const TIMER_WARNING_SHARE = 0.25;

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
              <span key={c} className="flex h-9 w-3 items-end justify-center text-xl font-semibold">
                {cell.char}
              </span>
            ) : (
              <span
                key={c}
                className={`flex h-9 w-6 items-end justify-center border-b-2 pb-0.5 text-xl font-semibold uppercase ${
                  cell.kind === 'revealed'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-slate-300 text-slate-900'
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
  timeLimit,
  onFinish,
}: {
  flags: FlagEntry[];
  /** Seconds per flag, or null for no limit. */
  timeLimit: number | null;
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
  const [timedOut, setTimedOut] = useState(false);
  const [remainingMs, setRemainingMs] = useState(timeLimit === null ? 0 : timeLimit * 1000);
  const questionStart = useRef(0);
  const onTimeout = useRef(() => {});
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

  // The clock restarts per flag only; a wrong answer or a hint does not reset it.
  useEffect(() => {
    questionStart.current = Date.now();
    if (timeLimit !== null) setRemainingMs(timeLimit * 1000);
  }, [index, timeLimit]);

  useEffect(() => {
    onTimeout.current = () => {
      setTimedOut(true);
      setStatus('revealed');
      finishQuestion({
        id: flag.code,
        outcome: 'missed',
        hints: hint.level,
        wrongTries,
        timedOut: true,
      });
    };
  });

  useEffect(() => {
    if (timeLimit === null || done) return;
    const tick = () => {
      const left = timeLimit * 1000 - (Date.now() - questionStart.current);
      setRemainingMs(Math.max(0, left));
      if (left <= 0) onTimeout.current();
    };
    const timer = window.setInterval(tick, TIMER_TICK_MS);
    return () => window.clearInterval(timer);
  }, [timeLimit, done, index]);

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
    setTimedOut(false);
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

  const warning =
    timeLimit !== null && !done && remainingMs < timeLimit * 1000 * TIMER_WARNING_SHARE;

  const feedback =
    status === 'correct'
      ? {
          tone: 'text-emerald-700',
          icon: 'circle-check',
          text: approximate ? T.quiz.correctAs(flag.name) : T.quiz.correct,
        }
      : status === 'revealed'
        ? {
            tone: 'text-rose-700',
            icon: 'circle-x',
            text: timedOut ? T.quiz.timedOut(flag.name) : T.quiz.revealed(flag.name),
          }
        : status === 'wrong'
          ? { tone: 'text-rose-700', icon: 'x', text: T.quiz.wrong }
          : null;

  return (
    <div
      className="mx-auto flex h-dvh max-w-xl flex-col overflow-hidden bg-white"
      style={height === null ? undefined : { height: `${height}px` }}
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <button
          type="button"
          onClick={stop}
          aria-label={T.quiz.stop}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <Icon name="x" />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="bg-accent-700 h-full rounded-full transition-[width] duration-300"
            style={{ width: `${(index / flags.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-slate-500 tabular-nums">
          {T.quiz.progress(index + 1, flags.length)}
        </span>
      </header>

      {timeLimit !== null && (
        <div className="flex items-center gap-3 px-4 pt-2">
          <span className="flex w-11 shrink-0 justify-center">
            <Icon
              name="timer"
              className={`h-5 w-5 ${warning ? 'text-rose-600' : 'text-slate-400'}`}
            />
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${warning ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${(remainingMs / (timeLimit * 1000)) * 100}%` }}
            />
          </div>
          <span
            className={`w-12 shrink-0 text-right text-sm font-semibold tabular-nums ${
              warning ? 'text-rose-700' : 'text-slate-500'
            }`}
          >
            {T.quiz.secondsLeft(Math.ceil(remainingMs / 1000))}
          </span>
        </div>
      )}

      <div className="mt-2 flex min-h-0 flex-1 items-center justify-center border-y border-slate-200 bg-slate-50 p-6">
        <img
          key={flag.code}
          src={flagSrc(flag.code)}
          alt={T.quiz.flagAlt}
          className="max-h-full max-w-full rounded object-contain shadow-md ring-1 ring-slate-900/10"
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
            className={`h-14 min-w-0 flex-1 rounded-xl border-2 bg-white px-4 text-xl placeholder:text-slate-400 focus:outline-none ${
              status === 'wrong'
                ? 'animate-shake border-rose-600'
                : status === 'correct'
                  ? 'border-emerald-600'
                  : 'focus:border-accent-700 border-slate-300'
            }`}
          />
          <button
            type="submit"
            aria-label={done ? T.quiz.next : T.quiz.check}
            className="bg-accent-800 hover:bg-accent-900 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white"
          >
            <Icon name={done ? 'arrow-right' : 'corner-down-left'} className="h-6 w-6" />
          </button>
        </form>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={takeHint}
            disabled={done || !canHint(flag.name, hint)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Icon name="lightbulb" className="h-5 w-5 text-amber-600" />
            {T.quiz.hint}
            {hint.level > 0 && <span className="tabular-nums opacity-70">{hint.level}</span>}
          </button>
          <button
            type="button"
            onClick={reveal}
            disabled={done}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Icon name="eye" />
            {T.quiz.reveal}
          </button>
        </div>
      </div>
    </div>
  );
}
