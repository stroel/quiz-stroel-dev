// Builds public/geo/geo.json, the shapes of the seas, rivers and mountain ranges
// in src/data/geo.ts, from downloaded source files. Run it again only when the
// dataset changes; its output is committed, so builds need no network.
//
//   node scripts/build-geo-map.ts <natural-earth-dir> <osm-dir>
//
// <natural-earth-dir> holds the GeoJSON files from
// github.com/nvkelso/natural-earth-vector (geojson/): ne_10m_geography_marine_polys,
// ne_10m_rivers_lake_centerlines, ne_10m_rivers_europe, ne_10m_geography_regions_polys.
// <osm-dir> holds one Overpass answer per relation, `rel-<id>.json`, fetched with
// `[out:json];rel(id:<id>);out geom;`. docs/aardrijkskunde.md has the details.
//
// Shapes are simplified (Douglas–Peucker) and rounded, so the file stays small
// enough for a phone: tolerances per kind below.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { GEO, type GeoEntry } from '../src/data/geo.ts';

type Point = [number, number];
type Line = Point[];

interface NeFeature {
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown } | null;
}

const LAYER_FILES = {
  marine: 'ne_10m_geography_marine_polys.geojson',
  rivers: 'ne_10m_rivers_lake_centerlines.geojson',
  'rivers-europe': 'ne_10m_rivers_europe.geojson',
  regions: 'ne_10m_geography_regions_polys.geojson',
} as const;

// Degrees. Oceans need little detail; a Belgian river is only a few km wide on screen.
function toleranceFor(entry: GeoEntry): number {
  if (entry.osm) return 0.002;
  if (entry.kind === 'rivier') return 0.01;
  return 0.03;
}

function decimalsFor(entry: GeoEntry): number {
  return entry.osm ? 4 : 3;
}

function perpendicular(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / length;
}

function simplify(line: Line, tolerance: number): Line {
  if (line.length <= 2) return line;
  let index = 0;
  let max = 0;
  for (let i = 1; i < line.length - 1; i++) {
    const distance = perpendicular(line[i]!, line[0]!, line.at(-1)!);
    if (distance > max) {
      index = i;
      max = distance;
    }
  }
  if (max <= tolerance) return [line[0]!, line.at(-1)!];
  return [
    ...simplify(line.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(line.slice(index), tolerance),
  ];
}

function round(line: Line, decimals: number): Line {
  const factor = 10 ** decimals;
  return line.map(([x, y]) => [Math.round(x * factor) / factor, Math.round(y * factor) / factor]);
}

/** Every line or ring in a GeoJSON geometry, flattened. */
function linesOf(geometry: NeFeature['geometry']): { lines: Line[]; polygon: boolean } {
  if (!geometry) return { lines: [], polygon: false };
  const c = geometry.coordinates as unknown;
  switch (geometry.type) {
    case 'LineString':
      return { lines: [c as Line], polygon: false };
    case 'MultiLineString':
      return { lines: c as Line[], polygon: false };
    case 'Polygon':
      return { lines: c as Line[], polygon: true };
    case 'MultiPolygon':
      return { lines: (c as Line[][]).flat(), polygon: true };
    default:
      return { lines: [], polygon: false };
  }
}

function inBox(line: Line, box: [number, number, number, number]): boolean {
  return line.some(([x, y]) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]);
}

async function main() {
  const [neDir, osmDir] = process.argv.slice(2);
  if (!neDir || !osmDir) throw new Error('Usage: node scripts/build-geo-map.ts <ne-dir> <osm-dir>');

  const layers = new Map<string, NeFeature[]>();
  for (const [layer, file] of Object.entries(LAYER_FILES)) {
    const json = JSON.parse(await readFile(join(neDir, file), 'utf8')) as { features: NeFeature[] };
    layers.set(layer, json.features);
  }

  const features = [];
  for (const entry of GEO) {
    let lines: Line[] = [];
    let polygon = false;

    if (entry.ne) {
      const { names, bbox } = entry.ne;
      const matches = layers.get(entry.ne.layer)!.filter((feature) => {
        const name = feature.properties.name ?? feature.properties.NAME;
        return typeof name === 'string' && names.includes(name);
      });
      for (const feature of matches) {
        const shape = linesOf(feature.geometry);
        polygon ||= shape.polygon;
        lines.push(...shape.lines.filter((line) => !bbox || inBox(line, bbox)));
      }
    } else if (entry.osm) {
      const json = JSON.parse(await readFile(join(osmDir, `rel-${entry.osm}.json`), 'utf8')) as {
        elements: { members: { type: string; geometry?: { lat: number; lon: number }[] }[] }[];
      };
      for (const member of json.elements[0]?.members ?? []) {
        if (member.type === 'way' && member.geometry) {
          lines.push(member.geometry.map(({ lat, lon }): Point => [lon, lat]));
        }
      }
    }

    lines = lines
      .map((line) => round(simplify(line, toleranceFor(entry)), decimalsFor(entry)))
      .filter((line) => line.length >= (polygon ? 4 : 2));
    if (lines.length === 0) throw new Error(`No shape for ${entry.id}`);

    features.push({
      type: 'Feature',
      id: entry.id,
      properties: {},
      // Rings of every polygon kept as separate polygons: holes are rare at this scale.
      geometry: polygon
        ? { type: 'MultiPolygon', coordinates: lines.map((ring) => [ring]) }
        : { type: 'MultiLineString', coordinates: lines },
    });
  }

  await mkdir('public/geo', { recursive: true });
  const output = JSON.stringify({ type: 'FeatureCollection', features });
  await writeFile('public/geo/geo.json', output);
  console.log(`Wrote ${features.length} shapes to public/geo/geo.json (${output.length} bytes)`);
}

await main();
