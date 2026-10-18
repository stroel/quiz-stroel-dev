import {
  geoAzimuthalEqualArea,
  geoBounds,
  geoCentroid,
  geoCircle,
  geoDistance,
  geoPath,
} from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { feature } from 'topojson-client';

import Icon from '@/components/Icon';
import { T } from '@/i18n/nl';

type Country = Feature<Geometry, null> & { id: string };

// Room between the context circle and the edge of the stage, in px.
const PADDING = 16;

// How much of the surroundings to show: a circle around the country this many
// times its own radius, but never tighter than MIN_RADIUS degrees (a microstate
// would fill the screen and show nothing around it) or wider than MAX_RADIUS.
const CONTEXT = 2.2;
const MIN_RADIUS = 7;
const MAX_RADIUS = 70;

// Zooming scales that circle: each step of + or − (or wheel notch) by this
// factor, from a close look at a microstate out to a whole hemisphere.
const ZOOM_STEP = 1.6;
const ZOOM_MIN_RADIUS = 0.5;
const ZOOM_MAX_RADIUS = 90;

// Below this projected area (px²) a country gets a ring, or Monaco and Nauru
// would be a dot nobody sees.
const TINY_AREA = 60;
const RING_RADIUS = 16;

let world: Promise<Country[]> | null = null;

/** Loads the map once per page; every question after the first draws instantly. */
export function loadWorld(): Promise<Country[]> {
  world ??= (async () => {
    const response = await fetch('/maps/countries.json');
    if (!response.ok) throw new Error(`Could not load the map: ${response.status}`);
    // The topology types live in a package we do not depend on directly.
    const topology = (await response.json()) as Parameters<typeof feature>[0] & {
      objects: { countries: Parameters<typeof feature>[1] };
    };
    const collection = feature(topology, topology.objects.countries) as FeatureCollection<
      Geometry,
      null
    >;
    return collection.features.map((f) => ({ ...f, id: String(f.id ?? '') }));
  })();
  return world;
}

/** The size of an element, kept up to date as the stage grows and shrinks (keyboard, rotation). */
function useSize<T extends Element>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

function useWorld(): Country[] | null {
  const [countries, setCountries] = useState<Country[] | null>(null);
  useEffect(() => {
    let current = true;
    loadWorld()
      .then((loaded) => {
        if (current) setCountries(loaded);
      })
      .catch((error: unknown) => {
        // The question still shows its hints and answer; only the map is missing.
        console.error(error);
      });
    return () => {
      current = false;
    };
  }, []);
  return countries;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Angular radius in degrees of the smallest circle around `centre` that holds the bounds. */
function radiusAround(target: FeatureCollection, centre: [number, number]): number {
  const [[west, south], [east, north]] = geoBounds(target);
  const corners: [number, number][] = [
    [west, south],
    [west, north],
    [east, south],
    [east, north],
  ];
  const radians = Math.max(...corners.map((corner) => geoDistance(centre, corner)));
  return (radians * 180) / Math.PI;
}

/**
 * The world around one country, with that country filled in. An azimuthal
 * projection centred on the country keeps it undistorted wherever it lies,
 * Greenland and New Zealand included. The map fills the whole stage: the
 * context circle fits the shorter side, a wide screen shows more around it.
 */
export default function CountryMap({ code }: { code: string }) {
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
    if (!countries || !size || size.width === 0 || size.height === 0) return null;
    const target: FeatureCollection = {
      type: 'FeatureCollection',
      features: countries.filter((country) => country.id === code),
    };
    if (target.features.length === 0) return null;

    const centre = geoCentroid(target);
    const fitted = Math.min(
      MAX_RADIUS,
      Math.max(MIN_RADIUS, radiusAround(target, centre) * CONTEXT),
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
        .filter((country) => country.id !== code)
        .map((country) => path(country) ?? '')
        .join(''),
      target: path(target) ?? '',
      ring: area < TINY_AREA && point ? point : null,
      // The zoom steps between the closest and the widest view, for this country.
      zoomIn: Math.log(fitted / ZOOM_MIN_RADIUS) / Math.log(ZOOM_STEP),
      zoomOut: Math.log(fitted / ZOOM_MAX_RADIUS) / Math.log(ZOOM_STEP),
    };
  }, [countries, code, size, zoom]);

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
          aria-label={T.countries.mapLabel}
          className="block"
        >
          <path d={drawing.sea} className="fill-sky-100" />
          <path d={drawing.land} className="fill-white stroke-slate-300" strokeWidth={0.75} />
          <path
            d={drawing.target}
            className="fill-accent-800 stroke-accent-800"
            strokeWidth={0.75}
          />
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
