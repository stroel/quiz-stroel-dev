// Copies the flag SVGs the quiz uses from the flag-icons package into
// `public/flags/`, so they are served as plain static files from our own
// origin. Only the flags in src/data/flags.ts are copied: the package holds
// 270 of them (2.6 MB) and most territories would never be shown.
//
// Runs on `astro:config:setup`, which covers dev, build and check alike.
// `public/flags/` is generated and gitignored.
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AstroIntegration } from 'astro';

import { FLAGS } from '../data/flags.ts';

export function flagAssets(): AstroIntegration {
  return {
    name: 'flag-assets',
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        const require = createRequire(import.meta.url);
        const source = join(dirname(require.resolve('flag-icons/package.json')), 'flags', '4x3');
        const target = join(fileURLToPath(config.publicDir), 'flags');

        await rm(target, { recursive: true, force: true });
        await mkdir(target, { recursive: true });

        const available = new Set(await readdir(source));
        const missing = FLAGS.filter((flag) => !available.has(`${flag.code}.svg`));
        if (missing.length > 0) {
          throw new Error(
            `flag-icons has no SVG for: ${missing.map((flag) => flag.code).join(', ')}`,
          );
        }

        await Promise.all(
          FLAGS.map((flag) =>
            copyFile(join(source, `${flag.code}.svg`), join(target, `${flag.code}.svg`)),
          ),
        );
        logger.info(`Copied ${FLAGS.length} flags to public/flags`);
      },
    },
  };
}
