import Icon from '@/components/Icon';
import Panel from '@/components/Panel';
import { T } from '@/i18n/nl';
import { flagSrc } from '@/lib/flag-pool';
import type { QuestionResult } from '@/lib/history';
import type { Question } from '@/lib/question';

// Half the width on a phone, so the label is small and the icon waits for room.
const OUTLINE =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium whitespace-nowrap text-slate-700 hover:bg-slate-50 md:px-4 md:text-base';
const OUTLINE_ICON = 'hidden h-5 w-5 md:block';

/** One line of the tally: a coloured dot or an icon, a label and a number. */
function TallyRow({
  label,
  value,
  dot,
  icon,
}: {
  label: string;
  value: number;
  dot?: string;
  icon?: string;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      {dot && <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} />}
      {icon && <Icon name={icon} className="h-4 w-4 shrink-0 text-slate-400" />}
      <span className="flex-1 text-slate-700">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
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

/**
 * The end of a round, centred: a score with a bar split into correct, hinted
 * and missed, the details under it, and the questions that went wrong. The
 * footer leads back to the start page, to the setup, or plays the round again.
 */
export default function QuizResults({
  questions,
  results,
  againLabel,
  onRetry,
  onAgain,
}: {
  questions: Question[];
  results: QuestionResult[];
  /** "Andere vlaggen", "Andere landen": back to the setup of this quiz. */
  againLabel: string;
  onRetry: (questions: Question[]) => void;
  onAgain: () => void;
}) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const pick = (outcome: QuestionResult['outcome']) =>
    results.filter((r) => r.outcome === outcome).flatMap((r) => byId.get(r.id) ?? []);

  const missed = pick('missed');
  const hinted = pick('hinted');
  const clean = results.length - missed.length - hinted.length;
  const hints = results.reduce((sum, r) => sum + r.hints, 0);
  const wrongTries = results.reduce((sum, r) => sum + r.wrongTries, 0);
  const timedOut = results.filter((r) => r.timedOut).length;
  const played = results.flatMap((r) => byId.get(r.id) ?? []);
  const share = (count: number) => `${(count / results.length) * 100}%`;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-200 bg-white">
        <h1 className="flex min-h-11 items-center justify-center px-4 py-3 text-2xl font-bold tracking-tight">
          {T.end.title}
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4 pb-48 md:pb-28">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-4 px-4 pt-6 pb-5">
            <p className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums">{clean + hinted.length}</span>
              <span className="text-xl text-slate-400 tabular-nums">/ {results.length}</span>
            </p>
            <p className="-mt-2 text-slate-500">{T.end.correct}</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <span className="bg-emerald-600" style={{ width: share(clean) }} />
              <span className="bg-amber-500" style={{ width: share(hinted.length) }} />
              <span className="bg-rose-600" style={{ width: share(missed.length) }} />
            </div>
          </div>
          <ul className="divide-y divide-slate-200 border-t border-slate-200">
            <TallyRow label={T.end.clean} value={clean} dot="bg-emerald-600" />
            <TallyRow label={T.end.hinted} value={hinted.length} dot="bg-amber-500" />
            <TallyRow label={T.end.missed} value={missed.length} dot="bg-rose-600" />
            <TallyRow label={T.end.hintsUsed} value={hints} icon="lightbulb" />
            <TallyRow label={T.end.wrongTries} value={wrongTries} icon="x" />
            {timedOut > 0 && <TallyRow label={T.end.timedOut} value={timedOut} icon="timer" />}
          </ul>
        </section>

        <QuestionList title={T.end.misses} questions={missed} />
        <QuestionList title={T.end.hintedList} questions={hinted} />
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {/* Phone: the main action on top, the two ways out side by side below it. */}
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-2 md:flex md:max-w-3xl md:justify-center">
          <button
            type="button"
            onClick={() => onRetry(played)}
            className="bg-accent-800 hover:bg-accent-900 col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-lg font-semibold text-white md:order-last"
          >
            <Icon name="rotate-ccw" />
            {T.end.again}
          </button>
          <a href="/" className={OUTLINE}>
            <Icon name="house" className={OUTLINE_ICON} />
            {T.end.otherQuiz}
          </a>
          <button type="button" onClick={onAgain} className={OUTLINE}>
            <Icon name="arrow-left" className={OUTLINE_ICON} />
            {againLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
