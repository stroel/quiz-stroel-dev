import { geoBounds, geoDistance } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { useEffect, useRef, useState } from 'react';
import { feature } from 'topojson-client';

/** One shape on the world map, with our flag code as id ('' for shapes we never ask about). */
export type Country = Feature<Geometry, null> & { id: string };

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
export function useSize<T extends Element>() {
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

export function useWorld(): Country[] | null {
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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Angular radius in degrees of the smallest circle around `centre` that holds the bounds. */
export function radiusAround(target: FeatureCollection, centre: [number, number]): number {
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
