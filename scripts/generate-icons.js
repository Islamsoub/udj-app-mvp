// Generates icon.png and adaptive-icon.png from Logo.svg
// icon.png:          1024×1024, jade #0A3D2E background
// adaptive-icon.png: 1024×1024, transparent background
//
// Usage: node scripts/generate-icons.js
// Requires: npm install sharp --save-dev --legacy-peer-deps

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'assets', 'icons', 'Logo.svg');
const ICON_PATH = path.join(ROOT, 'assets', 'icons', 'icon.png');
const ADAPTIVE_PATH = path.join(ROOT, 'assets', 'icons', 'adaptive-icon.png');

const CANVAS = 1024;
const LOGO_HEIGHT = 500;
// jade900 from design system — splash/icon background only
const JADE_BG = { r: 10, g: 61, b: 46, alpha: 1 };

async function trySharpSvg(svgBuffer, w, h) {
  try {
    return await sharp(svgBuffer).resize(w, h).png().toBuffer();
  } catch {
    return null;
  }
}

async function fallbackResvg(svgBuffer, w, h) {
  // @resvg/resvg-js is a pure Rust SVG renderer — no system deps needed
  const { Resvg } = require('@resvg/resvg-js');
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: w },
  });
  const rendered = resvg.render();
  // rendered.pixels is raw RGBA; wrap in sharp for format conversion
  const raw = rendered.pixels;
  return await sharp(raw, {
    raw: { width: rendered.width, height: rendered.height, channels: 4 },
  })
    .resize(w, h)
    .png()
    .toBuffer();
}

async function composite(logoPng, bgColor) {
  const logoMeta = await sharp(logoPng).metadata();
  const x = Math.round((CANVAS - logoMeta.width) / 2);
  const y = Math.round((CANVAS - logoMeta.height) / 2);

  return sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: bgColor },
  })
    .composite([{ input: logoPng, left: x, top: y }])
    .png()
    .toBuffer();
}

async function run() {
  const svgBuffer = fs.readFileSync(SVG_PATH);
  const svgStr = svgBuffer.toString();

  // Parse natural dimensions from SVG attributes
  const svgNaturalWidth = parseFloat(svgStr.match(/width="([\d.]+)"/)?.[1] ?? '99');
  const svgNaturalHeight = parseFloat(svgStr.match(/height="([\d.]+)"/)?.[1] ?? '143');
  const aspect = svgNaturalWidth / svgNaturalHeight;

  const logoH = LOGO_HEIGHT;
  const logoW = Math.round(logoH * aspect);

  console.log(`Logo.svg: ${svgNaturalWidth}×${svgNaturalHeight} → rendering at ${logoW}×${logoH}`);

  // Try sharp's built-in SVG support first (needs librsvg — available on most platforms)
  let logoPng = await trySharpSvg(svgBuffer, logoW, logoH);

  if (!logoPng) {
    console.log('sharp SVG failed — falling back to @resvg/resvg-js');
    try {
      logoPng = await fallbackResvg(svgBuffer, logoW, logoH);
    } catch (e) {
      console.error(
        'Both renderers failed. Install the fallback with:\n' +
          '  npm install @resvg/resvg-js --save-dev --legacy-peer-deps\n',
        e.message
      );
      process.exit(1);
    }
  }

  // icon.png — opaque jade background
  const iconBuf = await composite(logoPng, JADE_BG);
  fs.writeFileSync(ICON_PATH, iconBuf);
  const iconMeta = await sharp(iconBuf).metadata();
  console.log(`✓ icon.png  ${iconMeta.width}×${iconMeta.height} (jade background)`);

  // adaptive-icon.png — fully transparent background
  const adaptiveBuf = await composite(logoPng, { r: 0, g: 0, b: 0, alpha: 0 });
  fs.writeFileSync(ADAPTIVE_PATH, adaptiveBuf);
  const adaptiveMeta = await sharp(adaptiveBuf).metadata();
  console.log(`✓ adaptive-icon.png  ${adaptiveMeta.width}×${adaptiveMeta.height} (transparent)`);
}

run().catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
