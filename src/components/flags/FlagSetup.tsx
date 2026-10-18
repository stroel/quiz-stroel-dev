import { useMemo, useState } from 'react';

import Icon from '@/components/Icon';
import { REGIONS } from '@/data/flags';
import { T } from '@/i18n/nl';
import { selectFlags, type FlagSetup as Setup } from '@/lib/flag-pool';

const QUICK_COUNTS = [5, 10, 25];
const TIMER_SECONDS = [10, 20, 30];

const CLS = {
  section: 'flex flex-col gap-3',
  label: 'text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400',
  chipRow: 'flex flex-wrap gap-2',
  chip: 'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-base font-medium transition-colors',
  chipOn:
    'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900',
  chipOff:
    'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500',
  chipCount: 'text-sm tabular-nums opacity-60',
};

function Chip({
  on,
  label,
  count,
  onClick,
}: {
  on: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`${CLS.chip} ${on ? CLS.chipOn : CLS.chipOff}`}
    >
      {label}
      {count !== undefined && <span className={CLS.chipCount}>{count}</span>}
    </button>
  );
}

export default function FlagSetup({
  initial,
  onStart,
}: {
  initial: Setup;
  onStart: (setup: Setup) => void;
}) {
  const [setup, setSetup] = useState<Setup>(initial);
  const [countText, setCountText] = useState(initial.count === null ? '' : String(initial.count));

  const available = useMemo(() => selectFlags(setup).length, [setup]);
  const regionCounts = useMemo(
    () =>
      Object.fromEntries(
        REGIONS.map((region) => [
          region,
          selectFlags({ ...setup, regions: [region], microstates: false, organisations: false })
            .length,
        ]),
      ),
    [setup],
  );

  const parsedCount = Number.parseInt(countText, 10);
  const count =
    Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, available) : null;
  const playing = count ?? available;
  const allRegions = setup.regions.length === REGIONS.length;

  function toggleRegion(region: (typeof REGIONS)[number]) {
    setSetup((current) => ({
      ...current,
      regions: current.regions.includes(region)
        ? current.regions.filter((r) => r !== region)
        : [...current.regions, region],
    }));
  }

  function toggle(key: 'microstates' | 'disputed' | 'territories' | 'organisations') {
    setSetup((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        <a
          href="/"
          aria-label={T.site.home}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="arrow-left" />
        </a>
        <h1 className="text-2xl font-bold tracking-tight">{T.quizzes.vlaggen.title}</h1>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-4 pt-4 pb-32">
        <section className={CLS.section}>
          <div className="flex items-center justify-between">
            <h2 className={CLS.label}>{T.setup.regions}</h2>
            <button
              type="button"
              onClick={() => setSetup((s) => ({ ...s, regions: allRegions ? [] : [...REGIONS] }))}
              className="h-9 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {allRegions ? T.setup.none : T.setup.all}
            </button>
          </div>
          <div className={CLS.chipRow}>
            {REGIONS.map((region) => (
              <Chip
                key={region}
                on={setup.regions.includes(region)}
                label={T.regions[region]}
                count={regionCounts[region] ?? 0}
                onClick={() => toggleRegion(region)}
              />
            ))}
          </div>
        </section>

        <section className={CLS.section}>
          <h2 className={CLS.label}>{T.setup.extra}</h2>
          <div className={CLS.chipRow}>
            <Chip
              on={setup.microstates}
              label={T.setup.microstates}
              onClick={() => toggle('microstates')}
            />
            <Chip on={setup.disputed} label={T.setup.disputed} onClick={() => toggle('disputed')} />
            <Chip
              on={setup.territories}
              label={T.setup.territories}
              onClick={() => toggle('territories')}
            />
            <Chip
              on={setup.organisations}
              label={T.setup.organisations}
              onClick={() => toggle('organisations')}
            />
          </div>
        </section>

        <section className={CLS.section}>
          <h2 className={CLS.label}>{T.setup.count}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={available}
              value={countText}
              placeholder={String(available)}
              onChange={(event) => setCountText(event.target.value)}
              className="h-11 w-24 rounded-xl border border-slate-300 bg-white px-3 text-lg tabular-nums placeholder:text-slate-400 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:focus:border-white"
            />
            {QUICK_COUNTS.filter((quick) => quick < available).map((quick) => (
              <Chip
                key={quick}
                on={count === quick}
                label={String(quick)}
                onClick={() => setCountText(String(quick))}
              />
            ))}
            <Chip on={count === null} label={T.setup.countAll} onClick={() => setCountText('')} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{T.setup.countHint}</p>
        </section>

        <section className={CLS.section}>
          <h2 className={CLS.label}>{T.setup.timer}</h2>
          <div className={CLS.chipRow}>
            <Chip
              on={setup.timer === null}
              label={T.setup.timerOff}
              onClick={() => setSetup((s) => ({ ...s, timer: null }))}
            />
            {TIMER_SECONDS.map((seconds) => (
              <Chip
                key={seconds}
                on={setup.timer === seconds}
                label={T.setup.seconds(seconds)}
                onClick={() => setSetup((s) => ({ ...s, timer: seconds }))}
              />
            ))}
          </div>
          {setup.timer !== null && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{T.setup.timerHint}</p>
          )}
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 mx-auto max-w-xl border-t border-slate-200 bg-slate-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {available === 0 ? (
          <p className="flex h-14 items-center justify-center text-slate-500">{T.setup.empty}</p>
        ) : (
          <button
            type="button"
            onClick={() => onStart({ ...setup, count })}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-lg font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Icon name="play" />
            {T.setup.start(playing)}
          </button>
        )}
      </footer>
    </div>
  );
}
