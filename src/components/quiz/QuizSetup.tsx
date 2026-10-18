import { useMemo, useState, type ReactNode } from 'react';

import Icon from '@/components/Icon';
import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import { FLAGS, REGIONS, type FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';
import type { FlagSetup as Setup } from '@/lib/flag-pool';

// What a field starts at when its switch is turned on.
const DEFAULT_COUNT = 10;
const DEFAULT_TIMER = 20;
const MAX_TIMER = 600;

export type ExtraKey = 'microstates' | 'disputed' | 'territories' | 'organisations';

// Each extra with a few flags that show what it adds. Codes, not names, so the
// examples always match the dataset.
const EXTRAS: { key: ExtraKey; examples: string[] }[] = [
  { key: 'microstates', examples: ['mc', 'sm', 'va'] },
  { key: 'disputed', examples: ['xk', 'tw', 'eh'] },
  { key: 'territories', examples: ['gl', 'hk', 'pr'] },
  { key: 'organisations', examples: ['eu', 'un', 'arab'] },
];

const FLAG_NAMES = new Map(FLAGS.map((flag) => [flag.code, flag.name]));

const CLS = {
  field:
    'h-10 w-16 rounded-lg border border-slate-300 bg-white px-2 text-lg tabular-nums focus:border-accent-700 focus:outline-none',
};

/** A tile's heading that is also its on/off switch: the whole row is the tap target. */
function SwitchHeading({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex h-11 items-center gap-2.5 text-left"
    >
      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          on ? 'bg-accent-700' : 'bg-slate-200'
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            on ? 'translate-x-5' : ''
          }`}
        />
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

/** Whole numbers only, clamped to [1, max]; anything else is null. */
function parseCount(text: string, max: number): number | null {
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, max) : null;
}

/**
 * The setup screen every quiz shares: regions, extras, count and timer. A quiz
 * passes how it selects its pool, which extras apply to it, and optionally a
 * panel of its own above the regions.
 */
export default function QuizSetup({
  title,
  initial,
  select,
  extras,
  unit,
  before,
  overview,
  onStart,
}: {
  title: string;
  initial: Setup;
  /** The entries a setup plays; drives every count on the screen. */
  select: (setup: Setup) => FlagEntry[];
  extras: ExtraKey[];
  /** "vlaggen", "landen": the word after a count. */
  unit: (count: number) => string;
  before?: ReactNode;
  /** Link to the page that lists every question with its answer. */
  overview?: string;
  onStart: (setup: Setup) => void;
}) {
  const [setup, setSetup] = useState<Setup>(initial);
  const [countOn, setCountOn] = useState(initial.count !== null);
  const [countText, setCountText] = useState(String(initial.count ?? DEFAULT_COUNT));
  const [timerOn, setTimerOn] = useState(initial.timer !== null);
  const [timerText, setTimerText] = useState(String(initial.timer ?? DEFAULT_TIMER));

  const available = useMemo(() => select(setup).length, [select, setup]);
  const regionCounts = useMemo(
    () =>
      Object.fromEntries(
        REGIONS.map((region) => [
          region,
          select({ ...setup, regions: [region], microstates: false, organisations: false }).length,
        ]),
      ),
    [select, setup],
  );

  const count = countOn ? parseCount(countText, available) : null;
  const timer = timerOn ? parseCount(timerText, MAX_TIMER) : null;
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

  function toggle(key: ExtraKey) {
    setSetup((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-page mx-auto flex items-center gap-2 px-2 py-3">
          <a
            href="/"
            aria-label={T.site.home}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <Icon name="arrow-left" />
          </a>
          <h1 className="flex-1 text-2xl font-bold tracking-tight">{title}</h1>
          {overview && (
            <a
              href={overview}
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Icon name="book-open" />
              {T.overview.open}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-page mx-auto grid w-full flex-1 content-start items-start gap-4 p-4 pb-32 md:grid-cols-2 xl:grid-cols-3">
        {/* Fixed columns, whatever a quiz adds: its own panel and the regions,
            then the extras, then the round. On two columns the round wraps below. */}
        <div className="flex flex-col gap-4">
          {before}
          <Panel
            title={T.setup.regions}
            action={
              <button
                type="button"
                onClick={() => setSetup((s) => ({ ...s, regions: allRegions ? [] : [...REGIONS] }))}
                className="text-accent-800 -mr-2 h-10 px-2 text-sm font-semibold"
              >
                {allRegions ? T.setup.none : T.setup.all}
              </button>
            }
          >
            <ul className="divide-y divide-slate-200">
              {REGIONS.map((region) => (
                <CheckRow
                  key={region}
                  on={setup.regions.includes(region)}
                  label={T.regions[region]}
                  count={regionCounts[region] ?? 0}
                  onClick={() => toggleRegion(region)}
                />
              ))}
            </ul>
          </Panel>
        </div>
        <Panel title={T.setup.extra}>
          <ul className="divide-y divide-slate-200">
            {EXTRAS.filter(({ key }) => extras.includes(key)).map(({ key, examples }) => (
              <CheckRow
                key={key}
                on={setup[key]}
                label={T.setup[key]}
                detail={examples.map((code) => FLAG_NAMES.get(code)).join(', ')}
                onClick={() => toggle(key)}
              />
            ))}
          </ul>
        </Panel>
        <Panel title={T.setup.round}>
          <div className="grid grid-cols-2 gap-px bg-slate-200">
            <div className="flex flex-col gap-1 bg-white px-3 py-2">
              <SwitchHeading on={countOn} label={T.setup.count} onChange={setCountOn} />
              {countOn && (
                <label className="flex items-center gap-2 pb-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={available}
                    value={countText}
                    onChange={(event) => setCountText(event.target.value)}
                    className={CLS.field}
                  />
                  <span className="text-slate-500">{unit(count ?? 0)}</span>
                </label>
              )}
            </div>
            <div className="flex flex-col gap-1 bg-white px-3 py-2">
              <SwitchHeading on={timerOn} label={T.setup.timer} onChange={setTimerOn} />
              {timerOn && (
                <label className="flex items-center gap-2 pb-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_TIMER}
                    value={timerText}
                    onChange={(event) => setTimerText(event.target.value)}
                    className={CLS.field}
                  />
                  <span className="text-slate-500">{T.setup.timerUnit(timer ?? 0)}</span>
                </label>
              )}
            </div>
          </div>
        </Panel>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="max-w-page mx-auto flex justify-end">
          {available === 0 ? (
            <p className="flex h-14 w-full items-center justify-center text-slate-500 md:w-auto">
              {T.setup.empty}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onStart({ ...setup, count, timer })}
              className="bg-accent-800 hover:bg-accent-900 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-semibold text-white md:w-96"
            >
              <Icon name="play" />
              {T.setup.start(playing, unit(playing))}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
