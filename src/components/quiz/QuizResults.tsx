import Icon from '@/components/Icon';
import Panel from '@/components/Panel';
import { T } from '@/i18n/nl';
import { flagSrc } from '@/lib/flag-pool';
import type { QuestionResult } from '@/lib/history';
import type { Question } from '@/lib/question';

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white px-2 py-4">
      <span className={`text-4xl font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="text-center text-sm leading-tight text-slate-500">{label}</span>
    </div>
  );
}

function QuestionList({ title, questions }: { title: string; questions: Question[] }) {
  if (questions.length === 0) return null;
  return (
    <Panel title={title}>
      <ul className="divide-y divide-slate-200">
        {questions.map((question) => (
          <li key={question.id} className="flex min-h-14 items-center gap-4 px-4 py-2.5">
            {question.flag && (
              <img
                src={flagSrc(question.flag)}
                alt=""
                loading="lazy"
                className="h-9 w-12 shrink-0 rounded-sm object-contain ring-1 ring-slate-900/10"
              />
            )}
            <span className="font-medium">{question.label ?? question.answer}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** The end of a round: totals, and the questions that were missed or needed hints. */
export default function QuizResults({
  questions,
  results,
  onRetry,
  onAgain,
}: {
  questions: Question[];
  results: QuestionResult[];
  onRetry: (questions: Question[]) => void;
  onAgain: () => void;
}) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const pick = (outcome: QuestionResult['outcome']) =>
    results.filter((r) => r.outcome === outcome).flatMap((r) => byId.get(r.id) ?? []);

  const missed = pick('missed');
  const hinted = pick('hinted');
  const hints = results.reduce((sum, r) => sum + r.hints, 0);
  const wrongTries = results.reduce((sum, r) => sum + r.wrongTries, 0);
  const timedOut = results.filter((r) => r.timedOut).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight">{T.end.title}</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 pb-40">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 gap-px bg-slate-200">
            <Stat
              value={results.length - missed.length - hinted.length}
              label={T.end.clean}
              tone="text-emerald-700"
            />
            <Stat value={hinted.length} label={T.end.hinted} tone="text-amber-600" />
            <Stat value={missed.length} label={T.end.missed} tone="text-rose-700" />
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 px-4 py-2.5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="lightbulb" className="h-4 w-4" />
              {T.end.hintsUsed(hints)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="x" className="h-4 w-4" />
              {T.end.wrongTries(wrongTries)}
            </span>
            {timedOut > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="timer" className="h-4 w-4" />
                {T.end.timedOut(timedOut)}
              </span>
            )}
          </p>
        </section>

        <QuestionList title={T.end.misses} questions={missed} />
        <QuestionList title={T.end.hintedList} questions={hinted} />
      </main>

      <footer className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col gap-2 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {missed.length + hinted.length > 0 && (
          <button
            type="button"
            onClick={() => onRetry([...missed, ...hinted])}
            className="bg-accent-800 hover:bg-accent-900 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-semibold text-white"
          >
            <Icon name="rotate-ccw" />
            {T.end.retryMisses}
          </button>
        )}
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50"
        >
          <Icon name="play" />
          {T.end.again}
        </button>
      </footer>
    </div>
  );
}
