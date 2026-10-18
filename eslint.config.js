// House ESLint config for standalone Astro apps (flat config).
// Deps: eslint @eslint/js typescript-eslint eslint-plugin-astro
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginAstro from 'eslint-plugin-astro';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginAstro.configs.recommended,
  {
    rules: {
      // TypeScript already checks for undefined names; `no-undef` is redundant
      // and false-positives on browser/worker globals. (typescript-eslint guidance.)
      'no-undef': 'off',
      // Prefix intentionally-unused vars/args/caught-errors with `_` to silence.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    // `.wrangler/` holds the bundles `wrangler dev` writes to `.wrangler/tmp/`.
    // They survive a dev server that is killed rather than stopped, and then fail
    // lint on generated code nobody wrote.
    ignores: ['dist/', 'node_modules/', '.astro/', '.wrangler/'],
  },
];
