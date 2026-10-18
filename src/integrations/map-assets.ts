// Writes the world map the country quiz draws to `public/maps/countries.json`:
// world-atlas' Natural Earth 1:50m TopoJSON, with every shape relabelled from
// its ISO numeric id to our flag code (see src/data/atlas-shapes.ts) and the
// English names dropped. Shapes we do not ask about (Antarctica, the French
// Southern Lands) keep an empty id: they are drawn as plain land around the
// question.
//
// Runs on `astro:config:setup`, like flag-assets. `public/maps/` is generated
// and gitignored.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AstroIntegration } from 'astro';

import { ATLAS_SHAPES } from '../data/atlas-shapes.ts';

interface Geometry {
  id?: string;
  properties?: { name?: string };
}

interface Topology {
  objects: { countries: { geometries: Geometry[] } };
}

export function mapAssets(): AstroIntegration {
  return {
    name: 'map-assets',
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        const require = createRequire(import.meta.url);
        const source = require.resolve('world-atlas/countries-50m.json');
        const target = join(fileURLToPath(config.publicDir), 'maps');

        const topology = JSON.parse(await readFile(source, 'utf8')) as Topology;
        const codeByShape = new Map<string, string>();
        for (const [code, shapes] of Object.entries(ATLAS_SHAPES)) {
          for (const shape of shapes) codeByShape.set(shape, code);
        }

        const found = new Set<string>();
        for (const geometry of topology.objects.countries.geometries) {
          const key = geometry.id ?? geometry.properties?.name ?? '';
          const code = codeByShape.get(key) ?? codeByShape.get(geometry.properties?.name ?? '');
          if (code) found.add(code);
          geometry.id = code ?? '';
          delete geometry.properties;
        }

        const lost = Object.keys(ATLAS_SHAPES).filter((code) => !found.has(code));
        if (lost.length > 0) {
          throw new Error(`world-atlas has no shape for: ${lost.join(', ')}`);
        }

        await mkdir(target, { recursive: true });
        await writeFile(join(target, 'countries.json'), JSON.stringify(topology));
        logger.info(`Wrote the world map with ${found.size} countries to public/maps`);
      },
    },
  };
}
