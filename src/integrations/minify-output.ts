// Shared STROEL integration: minifies what `astro build` publishes, after Astro
// has written it. Drop in as `src/integrations/minify-output.ts`, add `@swc/html`
// as a dev dependency and register it in `astro.config.mjs`, together with the
// exclude below:
//
//   import { minifyOutput } from './src/integrations/minify-output.ts';
//   integrations: [minifyOutput()],
//   vite: { optimizeDeps: { exclude: ['@swc/html'] } },
//
// The exclude is not optional. Vite's start-up dependency scan crawls all of
// `src/`, finds this file's `@swc/html` import and tries to pre-bundle the
// native `.node` binary behind it. Rolldown cannot read that as source
// (`stream did not contain valid UTF-8`), so `astro dev` exits before it is
// ready with only "Dev server process exited before becoming ready" on screen;
// the real error is in `.astro/dev.log`. Seen from astro 7.3.6 on. Dev never
// runs this integration, so excluding the package costs nothing.
//
// Astro already collapses HTML whitespace (`compressHTML`) and Vite minifies the
// bundled JS/CSS, but three things reach visitors untouched: HTML comments,
// `is:inline` scripts (including JSON-LD) and license comments like Tailwind's
// `/*! tailwindcss … */` banner. This pass removes those.
//
// Build-only: `astro dev` never runs `astro:build:done`, so source stays readable
// while developing. It only sees prerendered files — HTML rendered on demand by
// a server route is not touched, which is why the no-HTML-comments rule still
// applies to the source.
//
// Every rewrite must leave behaviour identical. CSS lives under `/_astro/` with a
// content hash in its name and is cached as immutable, so a file changed here
// keeps its old name: acceptable for dropping a comment, never for anything a
// browser would render differently.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { minify, type Options } from '@swc/html';
import type { AstroIntegration } from 'astro';

const HTML_OPTIONS: Options = {
  // Astro has already decided where whitespace matters; don't second-guess it.
  collapseWhitespaces: 'conservative',
  removeComments: true,
  // The default list keeps `<!--!` and conditional comments. Keep nothing.
  preserveComments: [],
  minifyJs: true,
  minifyJson: true,
  minifyCss: true,
  // Leave attributes as authored: CSS selectors and scripts may depend on them.
  removeEmptyAttributes: false,
  removeRedundantAttributes: 'none',
  collapseBooleanAttributes: false,
  sortAttributes: false,
  sortSpaceSeparatedAttributeValues: false,
  selfClosingVoidElements: false,
  // Keep the quotes. Dropping them around a value like `application/ld+json` is
  // valid HTML5 and every real parser reads it back unchanged, but the tools that
  // scan a page instead of parsing it — structured-data and OG/Twitter checkers
  // matching on `type="application/ld+json"` — then report the markup as missing.
  // It buys nothing either: unquoted saved 180 raw bytes on the page that turned
  // this up, but compressed worse, so brotli over the wire is 45 bytes smaller
  // with the quotes kept.
  quotes: true,
};

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

/**
 * Drop every `/*! … *\/` comment from minified CSS. Scans instead of using a
 * regex so a `/*!` inside a string or an unquoted `url()` is left alone.
 */
export function stripCssLicenseComments(css: string): string {
  let out = '';
  let i = 0;

  while (i < css.length) {
    const char = css[i];

    if (char === '"' || char === "'") {
      let end = i + 1;
      while (end < css.length && css[end] !== char) end += css[end] === '\\' ? 2 : 1;
      out += css.slice(i, end + 1);
      i = end + 1;
    } else if (css.startsWith('url(', i) && !/^url\(\s*["']/.test(css.slice(i, i + 16))) {
      const end = css.indexOf(')', i);
      const stop = end === -1 ? css.length : end + 1;
      out += css.slice(i, stop);
      i = stop;
    } else if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      if (css[i + 2] !== '!') out += css.slice(i, stop);
      i = stop;
    } else {
      out += char;
      i += 1;
    }
  }

  return out.trimStart();
}

export function minifyOutput(): AstroIntegration {
  return {
    name: 'minify-output',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await listFiles(fileURLToPath(dir));
        let saved = 0;

        for (const file of files) {
          const isHtml = file.endsWith('.html');
          if (!isHtml && !file.endsWith('.css')) continue;

          const source = await readFile(file, 'utf8');
          let output: string;

          if (isHtml) {
            const result = await minify(source, { ...HTML_OPTIONS, filename: file });
            // swc still returns code for broken markup; publishing a guess is worse
            // than a failed build.
            if (result.errors?.length) {
              const details = result.errors.map((error) => error.message).join('; ');
              throw new Error(`Could not minify ${file}: ${details}`);
            }
            output = result.code;
          } else {
            output = stripCssLicenseComments(source);
          }

          if (output !== source) {
            await writeFile(file, output);
            saved += Buffer.byteLength(source) - Buffer.byteLength(output);
          }
        }

        logger.info(`Minified published HTML and CSS, ${saved} bytes saved.`);
      },
    },
  };
}
