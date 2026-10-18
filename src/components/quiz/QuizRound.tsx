import { useEffect, useMemo, useRef, useState, type ReactNode, type SubmitEvent } from 'react';

import Confetti from '@/components/Confetti';
import Icon from '@/components/Icon';
import { T } from '@/i18n/nl';
import { buildMask, canHint, nextHint, NO_HINTS, type HintState, type MaskCell } from '@/lib/hints';
import { flagSrc } from '@/lib/flag-pool';
import type { QuestionResult } from '@/lib/history';
import { matchAnswer, normalize } from '@/lib/matcher';
import type { Candidates, Question } from '@/lib/question';

type Status = 'asking' | 'wrong' | 'correct' | 'revealed';

// How long a correct answer stays on screen before the next question.
const ADVANCE_DELAY_MS = 1100;

// Often enough for a smooth countdown bar, rarely enough to stay cheap.
const TIMER_TICK_MS = 100;

// Below this share of the time left, the countdown turns red.
const TIMER_WARNING_SHARE = 0.25;

// Taps on "Ja, stop" sooner than this after "Stop" are the same tap twice.
const STOP_GUARD_MS = 400;

const CLS = {
  // Fixed width on both ends of a bar, so the progress and timer bars match.
  barLabel: 'flex w-10 shrink-0 text-sm tabular-nums',
  track: 'h-2 flex-1 overflow-hidden rounded-full bg-slate-200',
  // Hint and reveal sit beside the input, square like the submit button.
  square:
    'inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40',
  close:
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100',
  // Shape only: two utilities of one property in a class list fight over the
  // result, so each confirm button brings its own colours.
  confirm:
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold',
};

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

/**
 * One round of a typed-answer quiz: the question on a grey stage, the answer
 * typed below it, with hints, a timer and an inline stop. The quiz draws the
 * question itself through `prompt`; everything else is shared.
 */
export default function QuizRound({
  questions,
  candidates,
  prompt,
  placeholder,
  timeLimit,
  onFinish,
}: {
  questions: Question[];
  /** Every answer the quiz knows; each question's own candidate shares its id. */
  candidates: Candidates;
  /** What the player answers about: a flag, a country, a capital. */
  prompt: (question: Question) => ReactNode;
  placeholder: string;
  /** Seconds per question, or null for no limit. */
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
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [burst, setBurst] = useState(0);
  const stopAskedAt = useRef(0);
  const [remainingMs, setRemainingMs] = useState(timeLimit === null ? 0 : timeLimit * 1000);
  const questionStart = useRef(0);
  const onTimeout = useRef(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const height = useVisibleHeight();

  const question = questions[index]!;
  const expected = candidates.find((candidate) => candidate.id === question.id)!;
  const answer = question.answer;
  const cells = useMemo(() => buildMask(answer, hint), [answer, hint]);
  const done = status === 'correct' || status === 'revealed';

  useEffect(() => {
    const following = questions[index + 1]?.flag;
    if (following) new Image().src = flagSrc(following);
  }, [questions, index]);

  useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  // With a hardware keyboard, typing always lands in the answer: a letter typed
  // while a button or the map has focus moves focus to the input first, and
  // the browser then puts the letter there. Touch keyboards only appear for the
  // input itself, so on a phone this never fires.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const field = inputRef.current;
      if (!field || document.activeElement === field) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1 && event.key !== 'Backspace') return;
      field.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // The clock restarts per question only; a wrong answer or a hint does not reset it.
  useEffect(() => {
    questionStart.current = Date.now();
    if (timeLimit !== null) setRemainingMs(timeLimit * 1000);
  }, [index, timeLimit]);

  useEffect(() => {
    onTimeout.current = () => {
      setTimedOut(true);
      setStatus('revealed');
      finishQuestion({
        id: question.id,
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
    if (index + 1 >= questions.length) {
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

    const match = matchAnswer(input, expected, candidates);

    if (!match.correct) {
      setStatus('wrong');
      setWrongTries(wrongTries + 1);
      setShakeKey(shakeKey + 1);
      inputRef.current?.select();
      return;
    }

    setStatus('correct');
    setApproximate(match.approximate);
    setBurst(burst + 1);
    const all = finishQuestion({
      id: question.id,
      outcome: hint.level > 0 ? 'hinted' : 'clean',
      hints: hint.level,
      wrongTries,
    });
    advanceTimer.current = window.setTimeout(() => advance(all), ADVANCE_DELAY_MS);
  }

  function takeHint() {
    // The answer stays in the input; only the red "wrong" state goes.
    if (status === 'wrong') setStatus('asking');
    setHint(nextHint(answer, hint));
    inputRef.current?.focus();
  }

  function reveal() {
    setStatus('revealed');
    finishQuestion({ id: question.id, outcome: 'missed', hints: hint.level, wrongTries });
  }

  function stop() {
    onFinish(results);
  }

  function confirmStop() {
    if (Date.now() - stopAskedAt.current < STOP_GUARD_MS) return;
    stop();
  }

  function askStop() {
    stopAskedAt.current = Date.now();
    setConfirmingStop(true);
  }

  function cancelStop() {
    setConfirmingStop(false);
    inputRef.current?.focus();
  }

  const warning =
    timeLimit !== null && !done && remainingMs < timeLimit * 1000 * TIMER_WARNING_SHARE;

  const feedback =
    status === 'correct'
      ? {
          tone: 'bg-emerald-600 text-white',
          icon: 'circle-check',
          text: approximate ? T.quiz.correctAs(answer) : T.quiz.correct,
        }
      : status === 'revealed'
        ? {
            tone: 'bg-rose-600 text-white',
            icon: timedOut ? 'timer' : 'circle-x',
            text: timedOut ? T.quiz.timedOut(answer) : T.quiz.revealed(answer),
          }
        : status === 'wrong'
          ? { tone: 'bg-rose-600 text-white', icon: 'x', text: T.quiz.wrong }
          : null;

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden bg-white"
      style={height === null ? undefined : { height: `${height}px` }}
    >
      {/* Both bars share the same columns, so they line up and are equally wide. */}
      <header className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-5">
        {confirmingStop ? (
          // "Ja, stop" sits where the close button was; a tap within STOP_GUARD_MS of
          // opening is ignored, so a double tap does not end the round by accident.
          <div className="flex h-11 items-center justify-end gap-2">
            <p className="mr-1 font-semibold">{T.quiz.confirmStop}</p>
            <button
              type="button"
              onClick={cancelStop}
              className={`${CLS.confirm} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
            >
              {T.quiz.keepPlaying}
            </button>
            <button
              type="button"
              onClick={confirmStop}
              className={`${CLS.confirm} bg-rose-600 text-white hover:bg-rose-700`}
            >
              <Icon name="x" className="h-4 w-4" />
              {T.quiz.stopConfirmed}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="flex flex-1 items-center gap-3"
              role="progressbar"
              aria-label={T.quiz.progress(index + 1, questions.length)}
              aria-valuemin={1}
              aria-valuemax={questions.length}
              aria-valuenow={index + 1}
            >
              <span className={`${CLS.barLabel} justify-start font-semibold text-slate-900`}>
                {index + 1}
              </span>
              <div className={CLS.track}>
                <div
                  className="bg-accent-700 h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${(index / questions.length) * 100}%` }}
                />
              </div>
              <span className={`${CLS.barLabel} justify-end font-medium text-slate-500`}>
                {questions.length}
              </span>
            </div>
            <button type="button" onClick={askStop} aria-label={T.quiz.stop} className={CLS.close}>
              <Icon name="x" className="h-6 w-6" />
            </button>
          </div>
        )}

        {timeLimit !== null && (
          <div className="flex items-center gap-3">
            <span className={CLS.barLabel}>
              <Icon
                name="timer"
                className={`h-5 w-5 ${warning ? 'text-rose-600' : 'text-slate-400'}`}
              />
            </span>
            <div className={CLS.track}>
              <div
                className={`h-full rounded-full ${warning ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${(remainingMs / (timeLimit * 1000)) * 100}%` }}
              />
            </div>
            <span
              className={`${CLS.barLabel} justify-end font-semibold ${
                warning ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              {T.quiz.secondsLeft(Math.ceil(remainingMs / 1000))}
            </span>
            {/* Room for the close button above, so both bars end at the same place. */}
            <span className="w-11 shrink-0" />
          </div>
        )}
      </header>

      <div className="relative mt-5 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 border-y border-slate-200 bg-slate-50 p-6">
        {prompt(question)}
        {done && question.note && (
          <p className="max-w-sm text-center text-sm text-slate-600">{question.note}</p>
        )}
      </div>

      <div className="relative mx-auto flex w-full max-w-xl flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Feedback and the hint mask float just above this panel, so neither makes it
            taller: the mask in a white pill, the feedback as a tooltip above that. */}
        <div className="pointer-events-none absolute inset-x-4 bottom-full mb-3 flex flex-col items-center gap-3">
          <div aria-live="polite">
            {feedback && (
              <p
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-center font-semibold shadow-md ${feedback.tone}`}
              >
                <Icon name={feedback.icon} className="h-5 w-5 shrink-0" />
                {feedback.text}
                <span
                  className={`absolute top-full left-1/2 -mt-1.5 h-3 w-3 -translate-x-1/2 rotate-45 ${feedback.tone}`}
                />
              </p>
            )}
          </div>
          {hint.level > 0 && !done && (
            <div className="rounded-[1.75rem] bg-white px-5 pt-1.5 pb-2.5 shadow-md ring-1 ring-slate-200">
              <Mask cells={cells} />
            </div>
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <button
            type="button"
            onClick={reveal}
            disabled={done}
            aria-label={T.quiz.revealLabel}
            className={CLS.square}
          >
            <Icon name="eye" className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={takeHint}
            disabled={done || !canHint(answer, hint)}
            aria-label={T.quiz.hint}
            className={`${CLS.square} relative`}
          >
            <Icon name="lightbulb" className="h-6 w-6 text-amber-600" />
            {hint.level > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-white tabular-nums">
                {hint.level}
              </span>
            )}
          </button>
          <input
            key={shakeKey}
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (status === 'wrong') setStatus('asking');
            }}
            placeholder={placeholder}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            enterKeyHint={done ? 'next' : 'go'}
            readOnly={done}
            className={`h-14 min-w-0 flex-1 rounded-xl border-2 bg-white px-3 text-xl uppercase placeholder:text-base placeholder:text-slate-400 placeholder:normal-case focus:outline-none ${
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
      </div>

      <Confetti burst={burst} />
    </div>
  );
}
