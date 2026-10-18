import { geoAzimuthalEqualArea, geoCircle, geoDistance, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

import type { HighlightKind } from '@/components/countries/HighlightMap';
import { clamp, useSize, useWorld } from '@/components/countries/world';
import Icon from '@/components/Icon';
import type { TapState } from '@/components/quiz/QuizRound';
import type { Region } from '@/data/flags';
import { T } from '@/i18n/nl';

export interface View {
  centre: [number, number];
  /** Degrees from the centre to the shorter edge of the stage. */
  radius: number;
}

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

const PADDING = 8;
const ZOOM_STEP = 1.6;
const MIN_RADIUS = 0.5;
const MAX_RADIUS = 90;

// A country smaller than this on screen (px²) also gets a dot to tap.
const TINY_AREA = 80;
const DOT_RADIUS = 5;

// Movement (px) below which a press counts as a tap rather than a drag.
const TAP_SLOP = 8;

// The hint circle: the first one this many degrees wide, each next one half of
// that, but never tighter than the country itself.
const HINT_RADIUS = 24;

interface Press {
  pointers: Map<number, [number, number]>;
  /** Where the single pointer went down, and the view at that moment. */
  start: [number, number] | null;
  startView: View;
  moved: boolean;
  pinch: number;
}

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
  const [view, setView] = useState<View>(startView);
  const code = targetId;
  const press = useRef<Press>({
    pointers: new Map(),
    start: null,
    startView: view,
    moved: false,
    pinch: 0,
  });

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
      radius: Math.min(current.radius, hintRadius * 1.5),
    }));
  }, [target, hintRadius]);
  useEffect(() => {
    if (!target || tap.status !== 'revealed') return;
    setView({ centre: target.centre, radius: Math.max(4, target.radius * 2.5) });
  }, [target, tap.status]);

  const drawing = useMemo(() => {
    if (!shapes || !countries || !size || size.width === 0) return null;
    const projection = geoAzimuthalEqualArea()
      .rotate([-view.centre[0], -view.centre[1]])
      .clipAngle(90)
      .fitExtent(
        [
          [PADDING, PADDING],
          [size.width - PADDING, size.height - PADDING],
        ],
        geoCircle().center(view.centre).radius(view.radius)(),
      );
    const path = geoPath(projection);
    return {
      projection,
      sea: path({ type: 'Sphere' }) ?? '',
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
  }, [shapes, countries, size, view, target, hintRadius, kind]);

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

  function zoom(steps: number) {
    setView((current) => ({
      ...current,
      radius: clamp(current.radius / ZOOM_STEP ** steps, MIN_RADIUS, MAX_RADIUS),
    }));
  }

  function degreesPerPixel(): number {
    if (!drawing) return 0;
    return 180 / Math.PI / drawing.projection.scale();
  }

  function onPointer(event: PointerEvent<HTMLDivElement>) {
    const state = press.current;
    const point: [number, number] = [event.clientX, event.clientY];

    if (event.type === 'pointerdown') {
      state.pointers.set(event.pointerId, point);
      if (state.pointers.size === 1) {
        state.start = point;
        state.startView = view;
        state.moved = false;
      } else {
        state.pinch = 0;
        state.moved = true;
      }
      return;
    }

    if (event.type === 'pointermove') {
      if (!state.pointers.has(event.pointerId)) return;
      state.pointers.set(event.pointerId, point);
      const points = [...state.pointers.values()];
      if (points.length === 2) {
        const [a, b] = points as [[number, number], [number, number]];
        const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (state.pinch === 0) {
          state.pinch = distance;
          state.startView = view;
        } else if (distance > 0) {
          const radius = state.startView.radius * (state.pinch / distance);
          setView({ ...state.startView, radius: clamp(radius, MIN_RADIUS, MAX_RADIUS) });
        }
        return;
      }
      if (!state.start) return;
      const dx = point[0] - state.start[0];
      const dy = point[1] - state.start[1];
      if (!state.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
      state.moved = true;
      // Drag the map under the finger: move the centre the other way.
      const perPixel = degreesPerPixel();
      const [lon, lat] = state.startView.centre;
      setView({
        ...state.startView,
        centre: [lon - dx * perPixel, clamp(lat + dy * perPixel, -80, 80)],
      });
      return;
    }

    // pointerup / pointercancel
    const wasTap = event.type === 'pointerup' && state.pointers.size === 1 && !state.moved;
    state.pointers.delete(event.pointerId);
    if (state.pointers.size === 0) state.start = null;
    if (!wasTap) return;
    const hit = (event.target as Element).closest<SVGElement>('[data-code]');
    const id = hit?.dataset.code;
    if (id) tap.pick(id);
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 cursor-grab touch-none bg-sky-100 select-none active:cursor-grabbing"
      onWheel={(event) => zoom(event.deltaY < 0 ? 0.5 : -0.5)}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      onPointerCancel={onPointer}
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
          <path d={drawing.background} className="fill-white stroke-slate-300" strokeWidth={0.75} />
          {kind !== 'sea' && shapePaths()}
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
            disabled={view.radius <= MIN_RADIUS}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => zoom(1)}
            className="inline-flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            <Icon name="plus" />
          </button>
          <button
            type="button"
            aria-label={T.countries.zoomOut}
            disabled={view.radius >= MAX_RADIUS}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => zoom(-1)}
            className="inline-flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30"
          >
            <Icon name="minus" />
          </button>
        </div>
      )}
    </div>
  );
}
