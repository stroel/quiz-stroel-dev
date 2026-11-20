// Regenerates the home-screen icons from the STROEL mark plus a Lucide glyph.
//
// Every STROEL app gets the same tile: black, the mark in white on the left and
// a glyph for the app on the right (a question mark here), so the apps share one
// look and are still told apart on a home screen. The browser favicon stays the
// mark alone (https://stroel.dev/favicon.svg); this is only the app icon.
//
// Opaque on purpose: iOS fills transparency in an apple-touch-icon with black.
// The maskable icon gets its own file with the content at 80 %, so it stays
// inside the inner circle Android keeps.
//
//   node scripts/build-app-icons.mjs

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// sharp comes in through Astro (its image service), not as a dependency of our
// own, so it is resolved from Astro's side of node_modules.
const requireFromAstro = createRequire(
  createRequire(resolve(root, 'package.json')).resolve('astro'),
);
const sharp = requireFromAstro('sharp');
const outDir = resolve(root, 'public/icons');

// The mark of https://stroel.dev/favicon.svg; its bounding box is x 92.5, w 231.8, h 302.6.
const MARK =
  'm289 151.2 35.3-35.3-115.9-115.9-115.9 115.9 35.5 35.5-35.3 35.3 115.9 115.9 115.9-115.9zm-177.7-35.3 97.1-97.1 97.1 97.1-25.9 25.9-71-71-45 45 71 71-26.2 26.2zm.2 70.8 25.9-25.9 71 71 45-45-71-71 26.2-26.2 97.1 97.1-97.1 97.1z';

// The question mark of Lucide "circle-question-mark", without the circle (24x24, stroke 2), ISC licence.
const GLYPH = '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>';
// Its drawn extent in Lucide units, stroke included: x0, y0, x1, y1.
const GLYPH_BOX = [8.47, 5.38, 15.55, 17.63];
// A glyph smaller than a full icon is scaled up by this, with a thinner stroke to match.
const GLYPH_ZOOM = 1.6;

function iconSvg(size, scale = 1) {
  const markH = size * 0.36 * scale;
  const s = markH / 302.6;
  const markW = 231.8 * s;
  const g = (markH / 20) * GLYPH_ZOOM; // 20 Lucide units span the mark's height
  const [bx0, by0, bx1, by1] = GLYPH_BOX;
  const gap = size * 0.07 * scale;
  const x0 = (size - (markW + gap + (bx1 - bx0) * g)) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" fill="#000"/>` +
      `<path d="${MARK}" fill="#fff" transform="translate(${x0 - 92.5 * s} ${(size - markH) / 2}) scale(${s})"/>` +
      `<g fill="none" stroke="#fff" stroke-width="${2 / GLYPH_ZOOM}" stroke-linecap="round" stroke-linejoin="round" ` +
      `transform="translate(${x0 + markW + gap - bx0 * g} ${size / 2 - ((by0 + by1) / 2) * g}) scale(${g})">${GLYPH}</g>` +
      `</svg>`,
  );
}

mkdirSync(outDir, { recursive: true });
for (const [name, size, scale] of [
  ['apple-touch-icon.png', 180, 1],
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.8],
]) {
  const file = resolve(outDir, name);
  await sharp(iconSvg(size, scale)).png({ compressionLevel: 9 }).toFile(file);
  console.log(`${file}: ${size}x${size}`);
}
