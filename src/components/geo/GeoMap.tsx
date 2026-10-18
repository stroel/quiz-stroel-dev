import type { FeatureCollection, Geometry } from 'geojson';
import { useEffect, useMemo, useState } from 'react';

import HighlightMap, { type HighlightKind } from '@/components/countries/HighlightMap';
import { GEO, type GeoEntry } from '@/data/geo';
import { T } from '@/i18n/nl';

type GeoShapes = Map<string, Geometry>;

let shapes: Promise<GeoShapes> | null = null;

/** The shapes of every sea, river and range, loaded once per page (public/geo/geo.json). */
export function loadGeo(): Promise<GeoShapes> {
  shapes ??= (async () => {
    const response = await fetch('/geo/geo.json');
    if (!response.ok) throw new Error(`Could not load the geography shapes: ${response.status}`);
    const collection = (await response.json()) as FeatureCollection;
    return new Map(collection.features.map((f) => [String(f.id), f.geometry]));
  })();
  return shapes;
}

export function useGeo(): GeoShapes | null {
  const [loaded, setLoaded] = useState<GeoShapes | null>(null);
  useEffect(() => {
    let current = true;
    loadGeo()
      .then((map) => {
        if (current) setLoaded(map);
      })
      .catch((error: unknown) => {
        // The question still has its hints and answer; only the highlight is missing.
        console.error(error);
      });
    return () => {
      current = false;
    };
  }, []);
  return loaded;
}

export const KIND: Record<GeoEntry['kind'], HighlightKind> = {
  zee: 'sea',
  rivier: 'line',
  gebergte: 'area',
};

// The tightest view per kind, in degrees: a Belgian river is short, an ocean never is.
function minRadius(entry: GeoEntry): number {
  if (entry.group === 'rivieren-be') return 0.9;
  if (entry.kind === 'zee') return 5;
  return 2.5;
}

/** The map with one sea, river or mountain range highlighted. */
export default function GeoMap({ entry }: { entry: GeoEntry }) {
  const geo = useGeo();
  const target = useMemo<FeatureCollection | null>(() => {
    const geometry = geo?.get(entry.id);
    if (!geometry) return null;
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry }],
    };
  }, [geo, entry.id]);

  // Every other river as context, whatever is asked: it is how a map is read.
  const rivers = useMemo<FeatureCollection | null>(() => {
    if (!geo) return null;
    return {
      type: 'FeatureCollection',
      features: GEO.filter((other) => other.kind === 'rivier' && other.id !== entry.id).flatMap(
        (other) => {
          const geometry = geo.get(other.id);
          return geometry ? [{ type: 'Feature' as const, properties: {}, geometry }] : [];
        },
      ),
    };
  }, [geo, entry.id]);

  return (
    <HighlightMap
      target={target}
      rivers={rivers}
      kind={KIND[entry.kind]}
      minRadius={minRadius(entry)}
      credit={T.geo.credit}
      label={T.geo.mapLabel}
    />
  );
}
