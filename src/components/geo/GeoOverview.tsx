import { useMemo, useRef, useState } from 'react';

import type { View } from '@/components/countries/globe';
import TapMap, { type TapShape } from '@/components/countries/TapMap';
import { KIND, useGeo } from '@/components/geo/GeoMap';
import { BELGIUM, tapShapes } from '@/components/geo/GeoTapMap';
import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import type { TapState } from '@/components/quiz/QuizRound';
import { GEO, GEO_GROUPS, type GeoGroup } from '@/data/geo';
import { T } from '@/i18n/nl';
import { readJson, writeJson } from '@/lib/storage';

const GROUP_KEY = 'quiz:aardrijkskunde:overview';
const NAMES_KEY = 'quiz:aardrijkskunde:overview-names';

// Everything but the Belgian rivers is spread over the world; start wide, on Europe.
const WIDE: View = { centre: [15, 35], radius: 70 };

const BY_ID = new Map(GEO.map((entry) => [entry.id, entry]));
const NAMES = new Map(GEO.map((entry) => [entry.id, entry.name]));

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, 'nl');
}

/**
 * Every sea, river or range of one series on the map at once, with the names in
 * a list. A tap on a shape or a name marks it and shows its name; the series
 * are shown one at a time, so the map never mixes them.
 */
export default function GeoOverview() {
  const [group, setGroup] = useState<GeoGroup>(() => {
    const saved = readJson<GeoGroup>(GROUP_KEY, 'zeeen');
    return GEO_GROUPS.includes(saved) ? saved : 'zeeen';
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [showNames, setShowNames] = useState(() => readJson<boolean>(NAMES_KEY, true) !== false);
  // Only a name from the list moves the map; a shape tapped on the map is already in view.
  const [fromList, setFromList] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const geo = useGeo();

  const entries = useMemo(() => GEO.filter((entry) => entry.group === group).sort(byName), [group]);
  const shapes = useMemo<TapShape[] | null>(
    () => (geo ? tapShapes(geo, entries) : null),
    [geo, entries],
  );

  function choose(next: GeoGroup) {
    setGroup(next);
    setSelected(null);
    writeJson(GROUP_KEY, next);
  }

  function toggleNames() {
    setShowNames(!showNames);
    writeJson(NAMES_KEY, !showNames);
  }

  function pickFromList(id: string) {
    setSelected(id);
    setFromList(true);
    // On a phone the list lies under the map: bring the map back to see the shape.
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // The tap map shows the "target" in the accent once it is revealed: that is the selection.
  const tap: TapState = {
    pick: (id) => {
      setSelected(id);
      setFromList(false);
    },
    hintLevel: 0,
    status: selected ? 'revealed' : 'asking',
    picked: [],
  };
  const chosen = selected ? BY_ID.get(selected) : undefined;
  const kind = entries[0]?.kind ?? 'zee';

  // One map per layout: the phone shows it between the series and the list, a
  // wide screen next to the list. Only one of the two is visible, and a hidden
  // stage has no size, so TapMap draws nothing there.
  const stage = shapes ? (
    <>
      <TapMap
        // A new series starts on its own view.
        key={group}
        targetId={selected ?? ''}
        shapes={shapes}
        kind={KIND[kind]}
        startView={group === 'rivieren-be' ? BELGIUM : WIDE}
        tap={tap}
        frameAnswer={fromList}
        names={showNames ? NAMES : undefined}
        label={T.geo.overview.mapLabel}
        credit={T.geo.credit}
      />
      <button
        type="button"
        role="switch"
        aria-checked={showNames}
        onClick={toggleNames}
        className="absolute top-3 left-3 flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white pr-3 pl-2 text-sm font-semibold text-slate-700 shadow-sm"
      >
        <span
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
            showNames ? 'bg-accent-700' : 'bg-slate-200'
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              showNames ? 'translate-x-5' : ''
            }`}
          />
        </span>
        {T.geo.overview.names}
      </button>
      <p className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-16">
        <span
          className={`rounded-xl bg-white px-4 py-2 text-center shadow-md ${
            chosen ? 'text-lg font-semibold' : 'text-sm text-slate-500'
          }`}
        >
          {chosen ? chosen.name : T.geo.overview.tapHint}
        </span>
      </p>
    </>
  ) : (
    <div className="absolute inset-0 bg-slate-50" />
  );

  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Panel title={T.geo.overview.series}>
          <ul className="divide-y divide-slate-200" role="radiogroup">
            {GEO_GROUPS.map((option) => (
              <CheckRow
                key={option}
                radio
                on={group === option}
                label={T.geo.groups[option]}
                count={GEO.filter((entry) => entry.group === option).length}
                onClick={() => choose(option)}
              />
            ))}
          </ul>
        </Panel>

        <div
          ref={mapRef}
          className="relative h-[65dvh] scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 md:hidden"
        >
          {stage}
        </div>

        <Panel title={T.geo.groups[group]} action={<Count value={entries.length} />}>
          <ul className="divide-y divide-slate-200">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-pressed={entry.id === selected}
                  onClick={() => pickFromList(entry.id)}
                  className={`flex min-h-12 w-full flex-col justify-center px-4 py-2.5 text-left ${
                    entry.id === selected ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{entry.name}</span>
                  {entry.aliases && (
                    <span className="text-sm text-slate-500">
                      {T.overview.aliases(entry.aliases.join(', '))}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* As tall as the screen under the page header, so the whole map shows before scrolling. */}
      <div className="sticky top-4 hidden h-[calc(100dvh-7.5rem)] overflow-hidden rounded-xl border border-slate-200 md:block">
        {stage}
      </div>
    </div>
  );
}

function Count({ value }: { value: number }) {
  return <span className="text-sm text-slate-400 tabular-nums">{value}</span>;
}
