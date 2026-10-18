import { geoCentroid, geoDistance } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { useMemo } from 'react';

import type { View } from '@/components/countries/globe';
import TapMap, { REGION_VIEW, type TapShape } from '@/components/countries/TapMap';
import { radiusAround } from '@/components/countries/world';
import { KIND, useGeo, type GeoShapes } from '@/components/geo/GeoMap';
import type { TapState } from '@/components/quiz/QuizRound';
import type { Region } from '@/data/flags';
import { GEO, type GeoEntry, type GeoKind } from '@/data/geo';
import { T } from '@/i18n/nl';

// Belgian rivers start on Belgium itself: at continent scale they are invisible.
export const BELGIUM: View = { centre: [4.6, 50.6], radius: 1.7 };

// Rough boxes [west, south, east, north] to pick the continent a shape lies in.
const CONTINENTS: [Region, [number, number, number, number]][] = [
  ['europa', [-25, 34, 45, 72]],
  ['afrika', [-20, -36, 55, 37]],
  ['noord-amerika', [-170, 24, -50, 85]],
  ['midden-amerika', [-118, 7, -58, 24]],
  ['zuid-amerika', [-85, -56, -30, 13]],
  ['oceanie', [110, -50, 180, -1]],
  ['azie', [25, -11, 180, 80]],
];

/**
 * Where a question starts: Belgium for a Belgian river, otherwise the continent
 * the shape lies in, widened when the shape itself is bigger (an ocean).
 */
function startView(entry: GeoEntry, shape: TapShape | undefined): View {
  if (entry.group === 'rivieren-be') return BELGIUM;
  if (!shape) return { centre: [10, 30], radius: 90 };
  const [lon, lat] = shape.centre;
  const continent = CONTINENTS.find(
    ([, [w, s, e, n]]) => lon >= w && lon <= e && lat >= s && lat <= n,
  )?.[0];
  const view = continent ? REGION_VIEW[continent] : { centre: shape.centre, radius: 60 };
  return shape.radius * 1.3 > view.radius
    ? { centre: shape.centre, radius: Math.min(90, shape.radius * 1.3) }
    : view;
}

/** The entries that have a shape, each with its centre and size, ready to tap. */
export function tapShapes(geo: GeoShapes, entries: GeoEntry[]): TapShape[] {
  return entries.flatMap((entry) => {
    const geometry = geo.get(entry.id);
    if (!geometry) return [];
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry }],
    };
    const centre = geoCentroid(collection);
    const radius = radiusAround(collection, centre);
    const anchor = lineAnchor(geometry, centre);
    return [{ id: entry.id, collection, centre, radius, ...(anchor && { anchor }) }];
  });
}

/**
 * A point on a river for its name: the bend nearest its centre. The centre of
 * a winding river often lies beside it, and a name next to the wrong river
 * misleads. Null for anything that is not a line.
 */
function lineAnchor(geometry: Geometry, centre: [number, number]): [number, number] | null {
  const lines =
    geometry.type === 'LineString'
      ? [geometry.coordinates]
      : geometry.type === 'MultiLineString'
        ? geometry.coordinates
        : null;
  if (!lines) return null;
  let best: [number, number] | null = null;
  let bestDistance = Infinity;
  for (const [lon, lat] of lines.flat()) {
    if (lon === undefined || lat === undefined) continue;
    const distance = geoDistance([lon, lat], centre);
    if (distance < bestDistance) {
      best = [lon, lat];
      bestDistance = distance;
    }
  }
  return best;
}

// Centres and sizes per kind, computed once per page.
const shapesByKind = new Map<GeoKind, TapShape[]>();

/** Tap on the map where a named sea, river or range lies. Only shapes of that kind can be tapped. */
export default function GeoTapMap({ entry, tap }: { entry: GeoEntry; tap: TapState }) {
  const geo = useGeo();

  const shapes = useMemo<TapShape[] | null>(() => {
    if (!geo) return null;
    const cached = shapesByKind.get(entry.kind);
    if (cached) return cached;
    const built = tapShapes(
      geo,
      GEO.filter((other) => other.kind === entry.kind),
    );
    shapesByKind.set(entry.kind, built);
    return built;
  }, [geo, entry.kind]);

  // The map's first view is fixed once the shapes are there.
  const start = useMemo(
    () =>
      startView(
        entry,
        shapes?.find((shape) => shape.id === entry.id),
      ),
    [entry, shapes],
  );

  if (!shapes) return <div className="absolute inset-0 bg-slate-50" />;
  return (
    <TapMap
      targetId={entry.id}
      shapes={shapes}
      kind={KIND[entry.kind]}
      startView={start}
      tap={tap}
      label={T.geo.tapMapLabel}
      credit={T.geo.credit}
    />
  );
}
