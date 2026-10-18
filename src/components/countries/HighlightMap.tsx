import { geoCentroid, geoGraticule10, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';

import { useGlobe, type View } from '@/components/countries/globe';
import { radiusAround, useSize, useWorld } from '@/components/countries/world';
import Icon from '@/components/Icon';
import { T } from '@/i18n/nl';

// Room between the context circle and the edge of the stage, in px.
// Meridians and parallels every 10°: without them a turning globe reads as a
// flat map sliding by.
const GRATICULE = geoGraticule10();

const PADDING = 16;

// How much of the surroundings to show: a circle around the target this many
// times its own radius, but never tighter than `minRadius` degrees (a microstate
// would fill the screen and show nothing around it) or wider than MAX_RADIUS.
const CONTEXT = 2.2;
const MAX_RADIUS = 70;

// Below this projected area (px²) a country gets a ring, or Monaco and Nauru
// would be a dot nobody sees. Only for `land`: a sea or range is never that small.
const TINY_AREA = 60;
const RING_RADIUS = 16;

/** How the target is drawn: a country, a sea under the land, a river, or a mountain range. */
export type HighlightKind = 'land' | 'sea' | 'line' | 'area';

/**
 * The world around one thing on the map, with that thing highlighted. The map
 * starts centred on it and fills the whole stage: the context circle fits the
 * shorter side, a wide screen shows more around it. It is the same globe as the
 * tap map: drag to turn it, zoom with + and −, the wheel or two fingers, and the
 * locate button brings the target back to the middle.
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

  // The quiz remounts the map per question, so every question starts here.
  const start = useMemo<View | null>(() => {
    if (!target || target.features.length === 0) return null;
    const centre = geoCentroid(target);
    return {
      centre,
      radius: Math.min(MAX_RADIUS, Math.max(minRadius, radiusAround(target, centre) * CONTEXT)),
    };
  }, [target, minRadius]);

  const globe = useGlobe({ start, size, padding: PADDING });
  const { projection } = globe;

  const drawing = useMemo(() => {
    if (!countries || !target || !start || !projection) return null;
    const path = geoPath(projection);
    const area = path.area(target);
    const point = projection(start.centre);
    return {
      sea: path({ type: 'Sphere' }) ?? '',
      graticule: path(GRATICULE) ?? '',
      land: countries
        .filter((country) => !exclude || country.id !== exclude)
        .map((country) => path(country) ?? '')
        .join(''),
      target: path(target) ?? '',
      rivers: rivers ? (path(rivers) ?? '') : '',
      ring: kind === 'land' && area < TINY_AREA && point ? point : null,
    };
  }, [countries, target, start, exclude, kind, rivers, projection]);

  // Turned or zoomed away from where the question started.
  const moved = !!start && !!globe.view && globe.view !== start;

  const zoomButton =
    'inline-flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-30';

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
          {/* A sea lies under the land, so the coast cuts it out. */}
          {kind === 'sea' && <path d={drawing.target} className="fill-accent-800/80" />}
          <path d={drawing.graticule} className="fill-none stroke-sky-200" strokeWidth={0.75} />
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
          {/* The edge of the globe, over everything, so the far side reads as space. */}
          <path d={drawing.sea} className="fill-none stroke-slate-300" strokeWidth={1} />
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
            disabled={!globe.canZoomIn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => globe.zoom(1)}
            className={zoomButton}
          >
            <Icon name="plus" />
          </button>
          <button
            type="button"
            aria-label={T.countries.zoomOut}
            disabled={!globe.canZoomOut}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => globe.zoom(-1)}
            className={zoomButton}
          >
            <Icon name="minus" />
          </button>
          {moved && (
            <button
              type="button"
              aria-label={T.countries.recentre}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => globe.setView(start)}
              className={zoomButton}
            >
              <Icon name="locate-fixed" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
