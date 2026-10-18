import { geoAzimuthalEqualArea, geoCentroid, geoCircle, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import { useMemo, useRef, useState, type PointerEvent } from 'react';

import { clamp, radiusAround, useSize, useWorld } from '@/components/countries/world';
import Icon from '@/components/Icon';
import { T } from '@/i18n/nl';

// Room between the context circle and the edge of the stage, in px.
const PADDING = 16;

// How much of the surroundings to show: a circle around the target this many
// times its own radius, but never tighter than `minRadius` degrees (a microstate
// would fill the screen and show nothing around it) or wider than MAX_RADIUS.
const CONTEXT = 2.2;
const MAX_RADIUS = 70;

// Zooming scales that circle: each step of + or − (or wheel notch) by this
// factor, from a close look at a microstate out to a whole hemisphere.
const ZOOM_STEP = 1.6;
const ZOOM_MIN_RADIUS = 0.5;
const ZOOM_MAX_RADIUS = 90;

// Below this projected area (px²) a country gets a ring, or Monaco and Nauru
// would be a dot nobody sees. Only for `land`: a sea or range is never that small.
const TINY_AREA = 60;
const RING_RADIUS = 16;

/** How the target is drawn: a country, a sea under the land, a river, or a mountain range. */
export type HighlightKind = 'land' | 'sea' | 'line' | 'area';

/**
 * The world around one thing on the map, with that thing highlighted. An
 * azimuthal projection centred on it keeps it undistorted wherever it lies,
 * Greenland and New Zealand included. The map fills the whole stage: the
 * context circle fits the shorter side, a wide screen shows more around it.
 * Zoom with + and −, the wheel, or two fingers.
 */
export default function HighlightMap({
  target,
  kind,
  exclude,
  minRadius,
  rivers,
  credit,
  label,
}: {
  /** What to highlight; null while its data is still loading. */
  target: FeatureCollection | null;
  kind: HighlightKind;
  /** A country code left out of the land layer, because it is the target. */
  exclude?: string;
  /** The tightest context circle, in degrees: wide for a microstate, tight for a small river. */
  minRadius: number;
  /** Other rivers, drawn thin and blue so the map reads as a map. */
  rivers?: FeatureCollection | null;
  /** Data attribution, in the bottom-left corner (OpenStreetMap asks for it). */
  credit?: string;
  label: string;
}) {
  const countries = useWorld();
  const [ref, size] = useSize<HTMLDivElement>();
  // Zoom level in steps; fractional while pinching. The quiz remounts the map
  // per question, so every question starts at 0.
  const [zoom, setZoom] = useState(0);
  const pinch = useRef<{ pointers: Map<number, [number, number]>; start: number; zoom: number }>({
    pointers: new Map(),
    start: 0,
    zoom: 0,
  });

  const drawing = useMemo(() => {
    if (!countries || !target || !size || size.width === 0 || size.height === 0) return null;
    if (target.features.length === 0) return null;

    const centre = geoCentroid(target);
    const fitted = Math.min(
      MAX_RADIUS,
      Math.max(minRadius, radiusAround(target, centre) * CONTEXT),
    );
    const radius = clamp(fitted / ZOOM_STEP ** zoom, ZOOM_MIN_RADIUS, ZOOM_MAX_RADIUS);
    const projection = geoAzimuthalEqualArea()
      .rotate([-centre[0], -centre[1]])
      .clipAngle(90)
      .fitExtent(
        [
          [PADDING, PADDING],
          [size.width - PADDING, size.height - PADDING],
        ],
        geoCircle().center(centre).radius(radius)(),
      );
    const path = geoPath(projection);

    const area = path.area(target);
    const point = projection(centre);
    return {
      sea: path({ type: 'Sphere' }) ?? '',
      land: countries
        .filter((country) => !exclude || country.id !== exclude)
        .map((country) => path(country) ?? '')
        .join(''),
      target: path(target) ?? '',
      rivers: rivers ? (path(rivers) ?? '') : '',
      ring: kind === 'land' && area < TINY_AREA && point ? point : null,
      // The zoom steps between the closest and the widest view, for this country.
      zoomIn: Math.log(fitted / ZOOM_MIN_RADIUS) / Math.log(ZOOM_STEP),
      zoomOut: Math.log(fitted / ZOOM_MAX_RADIUS) / Math.log(ZOOM_STEP),
    };
  }, [countries, target, exclude, kind, minRadius, rivers, size, zoom]);

  // Functional updates: two taps before a re-render must both count.
  function zoomTo(next: (current: number) => number) {
    if (!drawing) return;
    const { zoomIn, zoomOut } = drawing;
    setZoom((current) => clamp(next(current), zoomOut, zoomIn));
  }

  function distance(points: [number, number][]): number {
    const [a, b] = points;
    return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 0;
  }

  // Two fingers pinch the zoom; one finger does nothing, so the page stays calm.
  function onPointer(event: PointerEvent<HTMLDivElement>) {
    const state = pinch.current;
    if (event.type === 'pointerdown')
      state.pointers.set(event.pointerId, [event.clientX, event.clientY]);
    else if (event.type === 'pointermove' && state.pointers.has(event.pointerId))
      state.pointers.set(event.pointerId, [event.clientX, event.clientY]);
    else state.pointers.delete(event.pointerId);

    const points = [...state.pointers.values()];
    if (points.length !== 2) {
      state.start = 0;
      return;
    }
    if (state.start === 0) {
      state.start = distance(points);
      state.zoom = zoom;
      return;
    }
    const ratio = distance(points) / state.start;
    if (ratio > 0) zoomTo(() => state.zoom + Math.log(ratio) / Math.log(ZOOM_STEP));
  }

  const zoomButton =
    'inline-flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30';

  return (
    <div
      ref={ref}
      className="absolute inset-0 touch-none bg-sky-100"
      onWheel={(event) => zoomTo((current) => current + (event.deltaY < 0 ? 0.5 : -0.5))}
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
          {/* A sea lies under the land, so the coast cuts it out. */}
          {kind === 'sea' && <path d={drawing.target} className="fill-accent-800/80" />}
          <path d={drawing.land} className="fill-white stroke-slate-300" strokeWidth={0.75} />
          {drawing.rivers && (
            <path
              d={drawing.rivers}
              className="fill-none stroke-sky-400"
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {kind === 'land' && (
            <path
              d={drawing.target}
              className="fill-accent-800 stroke-accent-800"
              strokeWidth={0.75}
            />
          )}
          {kind === 'area' && (
            <path
              d={drawing.target}
              className="fill-accent-800/60 stroke-accent-800"
              strokeWidth={1.5}
            />
          )}
          {kind === 'line' && (
            <>
              {/* A white halo first, so the river stands out from the borders it crosses. */}
              <path
                d={drawing.target}
                className="fill-none stroke-white"
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={drawing.target}
                className="stroke-accent-800 fill-none"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
          {drawing.ring && (
            <circle
              cx={drawing.ring[0]}
              cy={drawing.ring[1]}
              r={RING_RADIUS}
              className="stroke-accent-800 fill-none"
              strokeWidth={2.5}
            />
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
            disabled={zoom >= drawing.zoomIn}
            onClick={() => zoomTo((current) => Math.round(current) + 1)}
            className={zoomButton}
          >
            <Icon name="plus" />
          </button>
          <button
            type="button"
            aria-label={T.countries.zoomOut}
            disabled={zoom <= drawing.zoomOut}
            onClick={() => zoomTo((current) => Math.round(current) - 1)}
            className={zoomButton}
          >
            <Icon name="minus" />
          </button>
        </div>
      )}
    </div>
  );
}
