import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import { flagAssets } from './src/integrations/flag-assets.ts';
import { mapAssets } from './src/integrations/map-assets.ts';
import { minifyOutput } from './src/integrations/minify-output.ts';

const isDev = process.argv.includes('dev');

// Fully static: no adapter. The build in dist/ is served by a Worker with
// Static Assets (see wrangler.jsonc); there is no server code.
export default defineConfig({
  site: 'https://quiz.stroel.dev',
  trailingSlash: 'always',
  integrations: [flagAssets(), mapAssets(), react(), minifyOutput()],
  vite: {
    plugins: [tailwindcss()],
    // `astro check` re-runs the dep optimizer and would overwrite a running dev
    // server's cache, which then serves stale React chunks ("_jsxDEV is not a
    // function"). Without an adapter it hits the client deps instead of SSR.
    cacheDir: isDev ? 'node_modules/.vite' : 'node_modules/.vite-tooling',
    // The start-up scan crawls everything under `src/`, including the build-only
    // integration in `src/integrations/minify-output.ts`, and then tries to
    // pre-bundle the native `.node` binary behind `@swc/html`. Rolldown cannot
    // read that as source (`stream did not contain valid UTF-8`) and the dev
    // server exits before it is ready. Dev never runs that integration, so
    // nothing loads it.
    optimizeDeps: {
      exclude: ['@swc/html'],
    },
  },
});
