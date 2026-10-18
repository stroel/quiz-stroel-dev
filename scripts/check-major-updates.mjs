#!/usr/bin/env node
/**
 * Report dependencies whose latest release is a *major* version ahead.
 *
 * `pnpm update` deliberately stays inside the declared range, so an Astro 6 -> 7
 * or ESLint 9 -> 10 release never shows up in the nightly PR. Without this step
 * those upgrades are invisible until someone happens to look.
 *
 * "Major" means "outside the caret range", which is what semver makes breaking:
 * the first non-zero segment. For 1.x and up that is the major; for 0.x it is the
 * minor (`^0.26.0` never resolves to 0.27.0); for 0.0.x it is the patch.
 *
 * `@types/node` is the one exception: it follows the Node the project runs on,
 * not the newest Node. While its major matches the one in `engines.node`, a
 * newer major is not an upgrade to make but the types of a Node we don't run,
 * so it is left out. Raise `engines.node` and it is reported again.
 *
 * Prints a markdown block for the nightly PR body, or nothing when everything is
 * on its latest major. Never fails the build: a missing/odd `pnpm outdated` is
 * reported on stderr and treated as "nothing to report".
 *
 * Usage:
 *   node scripts/check-major-updates.mjs
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** `major.minor.patch` of a version as numbers: `^7.1.6` -> [7, 1, 6]. null when unparseable. */
function segments(version) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(String(version));
  return match ? match.slice(1, 4).map(Number) : null;
}

/**
 * Whether `latest` falls outside the caret range of `current`, i.e. whether
 * `pnpm update` can never reach it.
 *
 * The breaking segment is the first non-zero one of `current`. Every segment
 * before it is zero, so `latest` is out of range as soon as it is higher in any
 * segment up to and including that one.
 */
function isBreaking(current, latest) {
  const from = segments(current);
  const to = segments(latest);
  if (!from || !to) return false;
  const breaking = from.findIndex((n) => n > 0);
  const last = breaking === -1 ? 2 : breaking;
  for (let i = 0; i <= last; i++) {
    if (to[i] > from[i]) return true;
    if (to[i] < from[i]) return false;
  }
  return false;
}

/**
 * The Node major the root `package.json` pins in `engines.node`: `>=24`, `^24`,
 * `24.x` and `24` all give 24. null when there is no such field or no number in it.
 */
function engineNodeMajor() {
  try {
    const range = JSON.parse(readFileSync('package.json', 'utf8')).engines?.node;
    const match = /(\d+)/.exec(String(range ?? ''));
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

/** Whether a major of `@types/node` is only the types of a newer Node than the project runs. */
function isTypesOfUnusedNode(name, current, nodeMajor) {
  return name === '@types/node' && nodeMajor !== null && segments(current)?.[0] === nodeMajor;
}

// pnpm outdated exits non-zero whenever anything is outdated — that's the normal
// case here, so the exit code is ignored and only stdout is trusted.
// -r so workspace members are included; without it only the root's own
// devDependencies are considered and majors in apps/* go unreported. Inert
// in a single-app repo, where the root is the only package.
const result = spawnSync('pnpm', ['-r', 'outdated', '--format', 'json'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

const raw = result.stdout?.trim();
if (!raw) process.exit(0);

let outdated;
try {
  outdated = JSON.parse(raw);
} catch {
  console.error('Could not parse `pnpm outdated --format json` output; skipping major check.');
  process.exit(0);
}

const nodeMajor = engineNodeMajor();

const majors = Object.entries(outdated)
  .map(([name, info]) => ({ name, current: info?.current, latest: info?.latest }))
  .filter(({ current, latest }) => current && latest)
  .filter(({ name, current }) => !isTypesOfUnusedNode(name, current, nodeMajor))
  // Not a major-segment comparison: a 0.x minor bump never arrives through the
  // normal update either, because the caret range stops at the next minor.
  .filter(({ current, latest }) => isBreaking(current, latest))
  .sort((a, b) => a.name.localeCompare(b.name));

if (majors.length === 0) process.exit(0);

const lines = majors.map(({ name, current, latest }) => {
  const note = segments(current)?.[0] === 0 ? ' (0.x: outside the caret range)' : '';
  return `> - \`${name}\` ${current} → **${latest}**${note}`;
});

console.log('> [!NOTE]');
console.log('> **Major upgrades available** — not applied here, because `pnpm update` stays');
console.log('> inside the declared range. Each needs its own PR and a real test pass.');
console.log('>');
console.log(lines.join('\n'));
