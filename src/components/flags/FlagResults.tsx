import Icon from '@/components/Icon';
import type { FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';
import { flagSrc } from '@/lib/flag-pool';
import type { QuestionResult } from '@/lib/history';

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <span className={`text-4xl font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="text-center text-sm leading-tight text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

function FlagList({ title, flags }: { title: string; flags: FlagEntry[] }) {
  if (flags.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {title}
      </h2>
      <ul className="flex flex-col divide-y divide-slate-200 rounded-2xl bg-white ring-1 ring-slate-200 dark:divide-slate-700 dark:bg-slate-800 dark:ring-slate-700">
        {flags.map((flag) => (
          <li key={flag.code} className="flex items-center gap-4 px-4 py-3">
            <img
              src={flagSrc(flag.code)}
              alt=""
              loading="lazy"
              className="h-9 w-12 shrink-0 rounded object-contain ring-1 ring-slate-900/10 dark:ring-white/10"
            />
            <span className="text-lg font-medium">{flag.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function FlagResults({
  flags,
  results,
  onRetry,
  onAgain,
}: {
  flags: FlagEntry[];
  results: QuestionResult[];
  onRetry: (flags: FlagEntry[]) => void;
  onAgain: () => void;
}) {
  const byCode = new Map(flags.map((flag) => [flag.code, flag]));
  const pick = (outcome: QuestionResult['outcome']) =>
    results.filter((r) => r.outcome === outcome).flatMap((r) => byCode.get(r.id) ?? []);

  const missed = pick('missed');
  const hinted = pick('hinted');
  const hints = results.reduce((sum, r) => sum + r.hints, 0);
  const wrongTries = results.reduce((sum, r) => sum + r.wrongTries, 0);
  const timedOut = results.filter((r) => r.timedOut).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className="flex flex-1 flex-col gap-8 px-4 pt-8 pb-40">
        <h1 className="text-3xl font-bold tracking-tight">{T.end.title}</h1>

        <div className="grid grid-cols-3 gap-2">
          <Stat
            value={results.length - missed.length - hinted.length}
            label={T.end.clean}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <Stat
            value={hinted.length}
            label={T.end.hinted}
            tone="text-amber-600 dark:text-amber-400"
          />
          <Stat
            value={missed.length}
            label={T.end.missed}
            tone="text-rose-600 dark:text-rose-400"
          />
        </div>

        <p className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
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

        <FlagList title={T.end.misses} flags={missed} />
        <FlagList title={T.end.hintedList} flags={hinted} />
      </main>

      <footer className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl flex-col gap-2 border-t border-slate-200 bg-slate-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {missed.length + hinted.length > 0 && (
          <button
            type="button"
            onClick={() => onRetry([...missed, ...hinted])}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-lg font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Icon name="rotate-ccw" />
            {T.end.retryMisses}
          </button>
        )}
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="flag" />
          {T.end.again}
        </button>
      </footer>
    </div>
  );
}
