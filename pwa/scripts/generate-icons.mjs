/*
 * Generates the PWA's four manifest icons from the shared logo.
 *
 *   public/icons/icon-192.png            purpose "any"
 *   public/icons/icon-512.png            purpose "any"
 *   public/icons/icon-maskable-192.png   purpose "maskable"
 *   public/icons/icon-maskable-512.png   purpose "maskable"
 *
 * The icon is the light login hero in miniature: the white mark on --hero-bg,
 * so the browser tab and the installed app match the screen the student sees
 * first. assets/icons/Logo.svg already draws its paths in white, so it is used
 * as it is — it is shared with the native app and is never edited.
 *
 * Usage (from pwa/):  node scripts/generate-icons.mjs
 * Uses the sharp that Next already installs; nothing extra to add.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PWA = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = join(PWA, '..', 'assets', 'icons', 'Logo.svg');
const OUT = join(PWA, 'public', 'icons');

/*
 * --hero-bg in the light theme (= --jade-text in app/globals.css). A PNG
 * cannot read a CSS variable, so the value is repeated here: change both
 * together. White on it is 6.20:1.
 */
const HERO_BG = '#0F6E56';

/*
 * The mark's height as a share of the canvas. "any" icons are shown whole, so
 * the mark can fill most of the square. "maskable" icons may be cropped to a
 * circle by the launcher; the mark must stay inside the 80% safe zone, and at
 * half the height its corners do.
 */
const MARK_SHARE = { any: 0.62, maskable: 0.5 };

const svg = readFileSync(LOGO);

async function icon(size, purpose) {
  const markHeight = Math.round(size * MARK_SHARE[purpose]);
  // Rasterised at a high density first so the downscale, not the SVG
  // renderer, decides the edges — crisp at 192px as well as 512px.
  const mark = await sharp(svg, { density: 1200 }).resize({ height: markHeight }).png().toBuffer();
  const { width, height } = await sharp(mark).metadata();

  const name = purpose === 'any' ? `icon-${size}.png` : `icon-maskable-${size}.png`;
  await sharp({ create: { width: size, height: size, channels: 4, background: HERO_BG } })
    .composite([{ input: mark, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    .png()
    .toFile(join(OUT, name));
  console.log(`✓ ${name}  ${size}×${size}, mark ${width}×${height}`);
}

for (const size of [192, 512]) {
  for (const purpose of ['any', 'maskable']) {
    await icon(size, purpose);
  }
}
