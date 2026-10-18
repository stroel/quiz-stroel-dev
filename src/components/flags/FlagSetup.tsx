import { useMemo, useState } from 'react';

import Icon from '@/components/Icon';
import Panel from '@/components/Panel';
import { FLAGS, REGIONS } from '@/data/flags';
import { T } from '@/i18n/nl';
import { selectFlags, type FlagSetup as Setup } from '@/lib/flag-pool';

// What a field starts at when its switch is turned on.
const DEFAULT_COUNT = 10;
const DEFAULT_TIMER = 20;
const MAX_TIMER = 600;

type ExtraKey = 'microstates' | 'disputed' | 'territories' | 'organisations';

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
    'h-10 w-16 rounded-lg border border-stone-300 bg-white px-2 text-lg tabular-nums focus:border-accent-700 focus:outline-none',
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
          on ? 'bg-accent-700' : 'bg-stone-200'
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

/** One option in a panel: a full-width row with a check box at the right. */
function CheckRow({
  on,
  label,
  detail,
  count,
  onClick,
}: {
  on: boolean;
  label: string;
  /** A second, smaller line under the label. */
  detail?: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        onClick={onClick}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50"
      >
        <span className="flex flex-1 flex-col">
          <span className="font-medium">{label}</span>
          {detail && <span className="text-sm text-stone-500">{detail}</span>}
        </span>
        {count !== undefined && (
          <span className="text-sm text-stone-400 tabular-nums">{count}</span>
        )}
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            on ? 'border-accent-700 bg-accent-700 text-white' : 'border-stone-300 bg-white'
          }`}
        >
          {on && <Icon name="check" className="h-4 w-4" />}
        </span>
      </button>
    </li>
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
  const [countOn, setCountOn] = useState(initial.count !== null);
  const [countText, setCountText] = useState(String(initial.count ?? DEFAULT_COUNT));
  const [timerOn, setTimerOn] = useState(initial.timer !== null);
  const [timerText, setTimerText] = useState(String(initial.timer ?? DEFAULT_TIMER));

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
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex items-center gap-2 border-b border-stone-200 bg-white px-2 py-3">
        <a
          href="/"
          aria-label={T.site.home}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
        >
          <Icon name="arrow-left" />
        </a>
        <h1 className="text-2xl font-bold tracking-tight">{T.quizzes.vlaggen.title}</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 pb-32">
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
          <ul className="divide-y divide-stone-200">
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

        <Panel title={T.setup.extra}>
          <ul className="divide-y divide-stone-200">
            {EXTRAS.map(({ key, examples }) => (
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
          <div className="grid grid-cols-2 gap-px bg-stone-200">
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
                  <span className="text-stone-500">{T.setup.countUnit(count ?? 0)}</span>
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
                  <span className="text-stone-500">{T.setup.timerUnit(timer ?? 0)}</span>
                </label>
              )}
            </div>
          </div>
        </Panel>
      </main>

      <footer className="fixed inset-x-0 bottom-0 mx-auto max-w-xl border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {available === 0 ? (
          <p className="flex h-14 items-center justify-center text-stone-500">{T.setup.empty}</p>
        ) : (
          <button
            type="button"
            onClick={() => onStart({ ...setup, count, timer })}
            className="bg-accent-800 hover:bg-accent-900 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-semibold text-white"
          >
            <Icon name="play" />
            {T.setup.start(playing)}
          </button>
        )}
      </footer>
    </div>
  );
}
