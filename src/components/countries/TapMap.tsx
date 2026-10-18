import { geoCircle, geoDistance, geoGraticule10, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import { useEffect, useMemo } from 'react';

import { useGlobe, type View } from '@/components/countries/globe';
import type { HighlightKind } from '@/components/countries/HighlightMap';
import { useSize, useWorld } from '@/components/countries/world';
import Icon from '@/components/Icon';
import type { TapState } from '@/components/quiz/QuizRound';
import type { Region } from '@/data/flags';
import { T } from '@/i18n/nl';

/** Something to tap: a country, a sea, a river or a range, with its centre and size in degrees. */
export interface TapShape {
  id: string;
  collection: FeatureCollection;
  centre: [number, number];
  radius: number;
}

// Where a question starts: the region it lies in, so a phone screen shows land
// big enough to tap. Which region it is, is the only thing given away.
export const REGION_VIEW: Record<Region, View> = {
  europa: { centre: [15, 52], radius: 20 },
  azie: { centre: [90, 32], radius: 42 },
  afrika: { centre: [20, 2], radius: 38 },
  'noord-amerika': { centre: [-100, 52], radius: 32 },
  'midden-amerika': { centre: [-75, 17], radius: 17 },
  'zuid-amerika': { centre: [-60, -20], radius: 32 },
  oceanie: { centre: [155, -15], radius: 40 },
};

// Meridians and parallels every 10°: without them a turning globe reads as a
// flat map sliding by.
const GRATICULE = geoGraticule10();

const PADDING = 8;

// A country smaller than this on screen (px²) also gets a dot to tap.
const TINY_AREA = 80;
const DOT_RADIUS = 5;

// The hint circle: the first one this many degrees wide, each next one half of
// that, but never tighter than the country itself.
const HINT_RADIUS = 24;

// The wide, invisible stroke a river is tapped by: a 3 px line is too thin for a finger.
const LINE_HIT_WIDTH = 22;

/**
 * The world to tap on. Starts on `startView`; drag to pan, pinch, scroll or use
 * + and − to zoom. Every shape is a target: countries (small ones also get a
 * dot), seas under the land, ranges as light areas, rivers as blue lines with a
 * wide invisible edge. Wrong taps turn red, the answer shows once found or
 * given up.
 */
export default function TapMap({
  targetId,
  shapes,
  kind,
  startView,
  tap,
  label,
  credit,
}: {
  targetId: string;
  /** What can be tapped; null while it loads. */
  shapes: TapShape[] | null;
  kind: HighlightKind;
  startView: View;
  tap: TapState;
  label: string;
  credit?: string;
}) {
  const countries = useWorld();
  const [ref, size] = useSize<HTMLDivElement>();
  const code = targetId;
  const globe = useGlobe({
    start: startView,
    size,
    padding: PADDING,
    onTap: (element) => {
      const id = element.closest<SVGElement>('[data-code]')?.dataset.code;
      if (id) tap.pick(id);
    },
  });
  const { setView, projection } = globe;
  // TapMap always has a start view, so the globe always has a view.
  const view = globe.view ?? startView;

  const target = shapes?.find((shape) => shape.id === code);

  const hintRadius =
    target && tap.hintLevel > 0
      ? Math.max(HINT_RADIUS / 2 ** (tap.hintLevel - 1), target.radius * 1.4)
      : null;

  // A hint, or the answer, brings the map to the place it is about.
  useEffect(() => {
    if (!target || hintRadius === null) return;
    // Centre on the hint, but never zoom out: a hint only ever narrows things.
    setView((current) => ({
      centre: target.centre,
      radius: Math.min(current?.radius ?? hintRadius * 1.5, hintRadius * 1.5),
    }));
  }, [target, hintRadius, setView]);
  useEffect(() => {
    if (!target || tap.status !== 'revealed') return;
    setView({ centre: target.centre, radius: Math.max(4, target.radius * 2.5) });
  }, [target, tap.status, setView]);

  const drawing = useMemo(() => {
    if (!shapes || !countries || !size || !projection) return null;
    const path = geoPath(projection);
    return {
      sea: path({ type: 'Sphere' }) ?? '',
      graticule: path(GRATICULE) ?? '',
      // Land that is not a target: for countries the shapes we never ask about
      // (Antarctica), for everything else all of it.
      background: countries
        .filter((country) => kind !== 'land' || !country.id)
        .map((country) => path(country) ?? '')
        .join(''),
      shapes: shapes.map((shape) => {
        const d = path(shape.collection) ?? '';
        // Only on the near side of the globe, and only if the shape is too small to hit.
        const facing = geoDistance(shape.centre, view.centre) < Math.PI / 2;
        const tiny = kind === 'land' && path.area(shape.collection) < TINY_AREA;
        const point = facing && d && tiny ? projection(shape.centre) : null;
        return { id: shape.id, d, dot: point };
      }),
      hint:
        target && hintRadius !== null
          ? (path(geoCircle().center(target.centre).radius(hintRadius)()) ?? '')
          : '',
    };
  }, [shapes, countries, size, view, projection, target, hintRadius, kind]);

  // Colour per state; a river is a stroke, everything else a fill.
  function fill(id: string): string {
    const line = kind === 'line';
    if (id === code && tap.status === 'correct')
      return line ? 'stroke-emerald-600' : 'fill-emerald-600 stroke-emerald-700';
    if (id === code && tap.status === 'revealed')
      return line ? 'stroke-accent-800' : 'fill-accent-800 stroke-accent-800';
    if (tap.picked.includes(id)) return line ? 'stroke-rose-500' : 'fill-rose-300 stroke-rose-500';
    switch (kind) {
      case 'land':
        return 'fill-white stroke-slate-300 hover:fill-slate-100';
      case 'sea':
        return 'fill-sky-100 stroke-sky-400/70 hover:fill-sky-200';
      case 'area':
        return 'fill-slate-500/20 stroke-slate-400 hover:fill-slate-500/35';
      case 'line':
        return 'stroke-sky-500';
    }
  }

  function shapePaths() {
    if (!drawing) return null;
    return drawing.shapes.map((shape) =>
      kind === 'line' ? (
        <g key={shape.id} data-code={shape.id} className="group cursor-pointer">
          <path
            d={shape.d}
            className="fill-none stroke-transparent"
            strokeWidth={LINE_HIT_WIDTH}
            strokeLinecap="round"
            pointerEvents="stroke"
          />
          <path
            d={shape.d}
            className={`fill-none transition-colors group-hover:stroke-sky-700 ${fill(shape.id)}`}
            strokeWidth={emphasised(shape.id) ? 4 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <path
          key={shape.id}
          d={shape.d}
          data-code={shape.id}
          className={`cursor-pointer transition-colors ${fill(shape.id)}`}
          strokeWidth={kind === 'land' ? 0.75 : 1.25}
        />
      ),
    );
  }

  // A river that is answered or picked is drawn thicker, so its colour shows.
  function emphasised(shapeId: string): boolean {
    return (
      (shapeId === code && tap.status !== 'asking' && tap.status !== 'wrong') ||
      tap.picked.includes(shapeId)
    );
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 cursor-grab touch-none bg-slate-50 select-none active:cursor-grabbing"
      {...globe.handlers}
    >
      {drawing && size && (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          role="img"
          aria-label={label}
          className="block"
        >
          <path d={drawing.sea} className="fill-sky-100" />
          {/* Seas lie under the land, so the coast cuts them out. */}
          {kind === 'sea' && shapePaths()}
          <path
            d={drawing.graticule}
            className="pointer-events-none fill-none stroke-sky-200"
            strokeWidth={0.75}
          />
          <path d={drawing.background} className="fill-white stroke-slate-300" strokeWidth={0.75} />
          {kind !== 'sea' && shapePaths()}
          {/* The edge of the globe, over the shapes, so the far side reads as space. */}
          <path
            d={drawing.sea}
            className="pointer-events-none fill-none stroke-slate-300"
            strokeWidth={1}
          />
          {drawing.hint && (
            <path
              d={drawing.hint}
              className="pointer-events-none fill-amber-400/15 stroke-amber-500"
              strokeWidth={2}
              strokeDasharray="6 5"
            />
          )}
          {drawing.shapes.map(
            (shape) =>
              shape.dot && (
                <circle
                  key={`dot-${shape.id}`}
                  cx={shape.dot[0]}
                  cy={shape.dot[1]}
                  r={DOT_RADIUS}
                  data-code={shape.id}
                  className={`cursor-pointer ${fill(shape.id)}`}
                  strokeWidth={1.5}
                />
              ),
          )}
        </svg>
      )}
      {credit && (
        <p className="pointer-events-none absolute bottom-1 left-2 text-[10px] text-slate-500">
          {credit}
        </p>
      )}
      {drawing && (
        <div className="absolute top-3 right-3 flex flex-col divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            aria-label={T.countries.zoomIn}
            disabled={!globe.canZoomIn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => globe.zoom(1)}
            className="inline-flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            <Icon name="plus" />
          </button>
          <button
            type="button"
            aria-label={T.countries.zoomOut}
            disabled={!globe.canZoomOut}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => globe.zoom(-1)}
            className="inline-flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            <Icon name="minus" />
          </button>
        </div>
      )}
    </div>
  );
}
