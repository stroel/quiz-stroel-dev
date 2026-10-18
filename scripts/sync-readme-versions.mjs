#!/usr/bin/env node
/**
 * Sync the version column of the README "Stack" table with the *installed*
 * dependency versions.
 *
 * The table repeats versions verbatim, so keeping it current is a mechanical
 * copy with no judgement in it. It used to be a Claude step in the nightly
 * dependency workflow, which cost ~$0.11 a night per project and could fail on
 * a transient API error — taking the whole dependency update with it. This
 * cannot fail that way.
 *
 * The version written is the one **`pnpm-lock.yaml` resolves**, not the range in
 * package.json: `^7.1.6` may well resolve to 7.1.9, and the README should state
 * the fact rather than the range. Cells are written without a `^`/`~` prefix for
 * exactly that reason — an exact version is not a range.
 *
 * **The lockfile rather than `node_modules`, and that was a bug too.** Reading
 * the installed tree is right in CI, where `pnpm install --frozen-lockfile` has
 * just run; it is wrong on a laptop, where `node_modules` can be arbitrarily far
 * behind. On 23 August 2026 a check run against a stale local install reported
 * `Astro: 7.2.4 -> 7.2.1` on a repo whose README, package.json and lockfile all
 * agreed on 7.2.4 — drift that did not exist, pointing at the one file that was
 * already correct. The lockfile is in git and cannot be stale relative to the
 * repo, so it is the authority; `node_modules` is a local artifact and is now
 * only a fallback. When the two disagree the script says so in the words that
 * fix it — "run pnpm install" — rather than blaming the README.
 *
 * Only cells that *already* contain a version are touched, and only under the
 * `**Stack versions**` heading, so the script can never wander into other
 * columns, rows, or sections.
 *
 * **Both of those scopes were bugs first.** Scanning the whole file meant any
 * table row whose second cell is a bare number looked like a version, so a
 * plans table ("Active sites | 1 |") failed the nightly every night. And
 * reading only the root `package.json` meant that in a pnpm workspace — where
 * tooling sits at the root and every runtime dependency sits in `apps/*` and
 * `packages/*` — every row of the table came back unresolvable. Both are fixed
 * below, and both fixes are inert in a single-app repo.
 *
 * Usage:
 *   node scripts/sync-readme-versions.mjs           # rewrite README.md in place
 *   node scripts/sync-readme-versions.mjs --check   # report drift, exit 1, write nothing
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

/**
 * The heading the versions table lives under.
 *
 * Version rows only exist under one heading, so that is where the scan runs —
 * and a new quota row somewhere else in the README cannot break a dependency
 * check again (a plans table, "Active sites | 1 |", failed a nightly every
 * night before this).
 *
 * Matched by *meaning* rather than by an exact string, because the projects
 * spell it differently: `**Stack versions**`, `## Stack`, `## Tech stack`.
 * Scoping it to one literal turned the script into a silent no-op on the repo
 * that spelled it the other way — which exits 0 and reports "already in sync",
 * and is a worse failure than the one the scoping fixed. Hence `NO_HEADING`
 * below: a README with version rows and no heading this recognises is an
 * error, never a pass.
 */
const VERSIONS_HEADING = /^(#{1,6}\s+|\*\*)[^\n]*\bstack\b/i;

/** Where the section ends: the next heading, or a horizontal rule. */
const SECTION_END = /^(#{1,6}\s|---\s*$)/;

/**
 * Table label -> package.json name, for labels that don't resolve on their own.
 * Add an entry when the script reports a row it can't resolve.
 */
const OVERRIDES = {
  'tailwind css': 'tailwindcss',
  changesets: '@changesets/cli',
};

/**
 * Labels that look like versions but aren't dependencies (e.g. a Node runtime
 * row). Listed explicitly so a genuine typo still fails loudly.
 */
const IGNORE = ['node', 'node.js'];

/**
 * A row whose second column holds *nothing but* a version: `| Astro | 7.1.6 |`.
 * Anchored to digits-and-dots so version-shaped-but-unrelated cells (image
 * dimensions like `1080x1350`, ranges like `0.6.0 → 0.6.1`) never match.
 * A leading `^`/`~` is accepted on input (older tables have it) and dropped.
 * Pre-release specs (`1.0.0-beta.1`) are deliberately out of scope.
 */
const VERSION_ROW = /^(\|\s*)([^|]+?)(\s*\|\s*)([\^~]?\d+(?:\.\d+)*)(\s*\|.*)$/;

const checkOnly = process.argv.includes('--check');

/**
 * Every package.json in the project: the root, plus each workspace member.
 *
 * Discovered rather than listed, because this is the house copy and each
 * project names its members differently. A repo with no `pnpm-workspace.yaml`
 * gets the root alone, which is what a single-app project wants and is exactly
 * the behaviour this script had before.
 *
 * The globs are read with a line matcher rather than a YAML parser: the file is
 * a `packages:` key over a list of one-segment globs, and a dependency for that
 * would be a dependency in the one script that has to run on a repo whose
 * install just broke.
 */
function workspaceManifests() {
  const roots = ['package.json'];
  if (!existsSync('pnpm-workspace.yaml')) return roots;

  const yaml = readFileSync('pnpm-workspace.yaml', 'utf8');
  const globs = [];
  let inPackages = false;
  for (const line of yaml.split('\n')) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      const entry = line.match(/^\s*-\s*['"]?([^'"\s]+)['"]?\s*$/);
      if (entry) globs.push(entry[1]);
      else if (line.trim() && !line.startsWith(' ')) inPackages = false;
    }
  }

  for (const glob of globs) {
    // One-segment globs only (`apps/*`), which is the whole of what these
    // workspaces use. A deeper pattern is reported rather than half-handled.
    const [dir, star] = glob.split('/');
    if (star !== '*' || !dir || !existsSync(dir)) {
      if (star !== '*') console.warn(`Unsupported workspace glob, skipped: ${glob}`);
      continue;
    }
    for (const member of readdirSync(dir)) {
      const manifest = `${dir}/${member}/package.json`;
      if (existsSync(manifest)) roots.push(manifest);
    }
  }
  return roots;
}

const MANIFESTS = workspaceManifests();

/**
 * What `pnpm-lock.yaml` resolved each declared dependency to.
 *
 * Only the `importers:` section, which is the project's own direct dependencies
 * — a transitive package's version is not something a README documents. Read
 * with a line matcher for the same reason the workspace globs are: a YAML
 * dependency in the one script that has to run when an install is broken is a
 * dependency in the wrong place.
 *
 * A version can carry a peer suffix (`7.2.4(rollup@4.0.0)`), which is stripped,
 * and a workspace link reads `link:../core`, which is skipped.
 *
 * **Where two importers disagree, the root importer wins.** It used to be
 * whichever came last, which is not a tiebreak so much as a coin toss decided
 * by file order — and in stroel-cms-packages it landed wrong every time: the
 * root pins `typescript@^6.0.3` and four published packages pin `^5.5.0`, so
 * the last-wins answer was 5.9.3 and the README was rewritten *backwards* from
 * a correct 6.0.3 every night. The root manifest is the project's own
 * toolchain, which is what a README's Stack table documents; a workspace
 * member's range is that library's compatibility floor, chosen for its
 * consumers rather than for this repo. Among members themselves last still
 * wins, because there is nothing better to go on.
 *
 * **A key can be quoted with either character, and only one of them was
 * handled.** pnpm writes `'@astrojs/cloudflare':`, but a repo whose `format`
 * script runs Prettier over YAML gets `"@astrojs/cloudflare":` back, and the
 * name was carried out of the match with its quotes still attached — so it
 * matched no dependency and every scoped package in such a repo fell through to
 * `node_modules`. Which is the exact fallback this function was written to stop
 * relying on, reintroduced silently: timetracker.stroel.dev reported
 * `@astrojs/cloudflare 14.2.2 -> 14.1.7` against a lockfile that said 14.2.2.
 * Both quote characters are stripped now.
 */
function lockfileVersions() {
  if (!existsSync('pnpm-lock.yaml')) return {};
  const lock = readFileSync('pnpm-lock.yaml', 'utf8');
  const importers = lock.slice(lock.indexOf('importers:'));
  const end = importers.search(/^[a-z]/im);
  const block = end > 0 ? importers.slice(0, end) : importers;

  // `  .:` for the root, `  packages/cms-core:` for a member. Sliced apart so a
  // version can be attributed to the importer that declared it.
  const header = /^ {2}(\S[^:]*):$/gm;
  const starts = [...block.matchAll(header)];

  const entry = /^ {6}(['"]?[^\s:'"]+['"]?):\n {8}specifier: .+\n {8}version: (.+)$/gm;
  const fromRoot = {};
  const fromMembers = {};

  for (const [index, start] of starts.entries()) {
    const from = start.index + start[0].length;
    const to = index + 1 < starts.length ? starts[index + 1].index : block.length;
    const target = start[1] === '.' ? fromRoot : fromMembers;

    for (const [, rawName, rawVersion] of block.slice(from, to).matchAll(entry)) {
      const name = rawName.replace(/["']/g, '');
      const version = rawVersion.split('(')[0].trim();
      if (version.startsWith('link:')) continue;
      if (/^\d/.test(version)) target[name] = version;
    }
  }

  return { ...fromMembers, ...fromRoot };
}

const LOCKED = lockfileVersions();

/** Packages whose installed copy disagrees with the lockfile. */
const staleInstalls = [];

const deps = {};
for (const manifest of MANIFESTS) {
  const pkg = JSON.parse(await readFile(manifest, 'utf8'));
  Object.assign(deps, pkg.dependencies, pkg.devDependencies);
}
// Workspace links carry no useful version; the README documents third parties.
for (const [name, spec] of Object.entries(deps)) {
  if (typeof spec === 'string' && spec.startsWith('workspace:')) delete deps[name];
}

const missingFromNodeModules = [];

/** Readable label: `[Hono](https://hono.dev)` -> `Hono`, `` `pkg` `` -> `pkg`. */
function labelText(label) {
  return label
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .trim();
}

/** Resolve a table label to a package.json dependency name, or null. */
function resolve(label) {
  const normalized = labelText(label).toLowerCase();
  if (IGNORE.includes(normalized)) return null;
  const candidates = [
    OVERRIDES[normalized],
    normalized,
    normalized.replace(/\s+/g, ''),
    normalized.replace(/\s+/g, '-'),
  ];
  return candidates.find((name) => name && name in deps) ?? null;
}

/** What is actually unpacked in a node_modules tree, or null. */
async function versionInNodeModules(name) {
  // pnpm links a package into the node_modules of whichever workspace member
  // declares it, so the root tree alone is not enough to find everything.
  for (const manifest of MANIFESTS) {
    const dir = manifest.replace(/package\.json$/, '');
    try {
      const found = await readFile(`${dir}node_modules/${name}/package.json`, 'utf8');
      const version = JSON.parse(found).version;
      if (typeof version === 'string' && /^\d/.test(version)) return version;
    } catch {
      // Not linked here — try the next workspace member.
    }
  }
  return null;
}

/**
 * The version to write, in order of how much it can be trusted: the lockfile,
 * then whatever is unpacked, then the package.json range with its prefix
 * stripped. The last is approximate, so it is reported rather than applied
 * silently.
 */
async function resolvedVersion(name) {
  const installed = await versionInNodeModules(name);
  const locked = LOCKED[name];

  if (locked) {
    // Not an error and not README drift: the repo is right and this machine is
    // behind. Collected for one message at the end.
    if (installed && installed !== locked) staleInstalls.push(`${name} ${installed} -> ${locked}`);
    return locked;
  }

  if (installed) return installed;

  missingFromNodeModules.push(name);
  const spec = deps[name];
  return /^[\^~]?\d/.test(spec) ? spec.replace(/^[\^~]/, '') : null;
}

const readme = await readFile('README.md', 'utf8');
const changes = [];
const unresolved = [];

const lines = readme.split('\n');
const synced = [];

// Set on the heading, cleared by the next one: the table ends where the
// following section begins.
let inVersions = false;
// Whether any heading was ever recognised, and whether a version-shaped row
// exists outside one. The two together are what make a no-op impossible to
// mistake for a pass.
let sawHeading = false;
let rowsOutsideSection = 0;

for (const line of lines) {
  if (VERSIONS_HEADING.test(line)) {
    inVersions = true;
    sawHeading = true;
  } else if (inVersions && SECTION_END.test(line)) {
    inVersions = false;
  }

  if (!inVersions && VERSION_ROW.test(line)) rowsOutsideSection++;

  const match = inVersions ? VERSION_ROW.exec(line) : null;
  if (!match) {
    synced.push(line);
    continue;
  }

  const [, open, label, separator, current, rest] = match;
  const name = resolve(label);
  const trimmed = labelText(label);

  // An IGNORE'd label resolves to null on purpose — don't report it as drift.
  if (!name) {
    if (!IGNORE.includes(trimmed.toLowerCase())) unresolved.push(trimmed);
    synced.push(line);
    continue;
  }

  const version = await resolvedVersion(name);
  if (!version || version === current) {
    synced.push(line);
    continue;
  }

  changes.push(`  ${trimmed}: ${current} -> ${version}`);
  synced.push(`${open}${label}${separator}${version}${rest}`);
}

if (!sawHeading && rowsOutsideSection > 0) {
  console.error(
    `README has ${rowsOutsideSection} version-shaped row(s) but no heading this script
recognises, so nothing was checked. Name the section so it contains the word
"stack" — "**Stack versions**", "## Stack" and "## Tech stack" all match.

Reporting this rather than passing quietly: a check that silently examines
nothing is worse than the bug it was added for.`,
  );
  process.exit(1);
}

if (unresolved.length > 0) {
  console.error(
    `README rows with a version but no matching dependency: ${unresolved.join(', ')}\n` +
      'Add each to OVERRIDES (wrong name) or IGNORE (not a dependency) in this script.',
  );
  process.exit(1);
}

if (staleInstalls.length > 0) {
  console.warn(
    `Your install is behind pnpm-lock.yaml: ${staleInstalls.join(', ')}.\n` +
      'Run `pnpm install`. The README is synced from the lockfile, so this does\n' +
      'not affect the versions written — it is your node_modules that is stale,\n' +
      'not the repo.',
  );
}

if (missingFromNodeModules.length > 0) {
  console.warn(
    `Not in the lockfile or node_modules, fell back to the package.json range: ${missingFromNodeModules.join(', ')}.\n` +
      'Run `pnpm install` for exact resolved versions.',
  );
}

if (changes.length === 0) {
  console.log('README versions already in sync.');
  process.exit(0);
}

if (checkOnly) {
  console.error(`README versions are out of date:\n${changes.join('\n')}`);
  process.exit(1);
}

await writeFile('README.md', synced.join('\n'));
console.log(`Updated ${changes.length} version(s) in README.md:\n${changes.join('\n')}`);
