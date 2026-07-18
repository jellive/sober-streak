// Generates public/icon-192.png and public/icon-512.png: a cyan water-drop
// motif on the app's dark background, matching the 水 (water) theme.
// Run: node scripts/gen-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const BG = '#071722';
const CYAN = '#4fd1e0';
const OUT_DIR = path.resolve(import.meta.dirname, '..', 'public');

// Water-drop path centered in a 100x100 viewBox, sized to stay within the
// ~80%-diameter maskable-safe circle (10 <= x,y <= 90).
const DROP_PATH = 'M50 14 C50 14 74 46 74 64 C74 78.36 62.36 90 48 90 C33.64 90 22 78.36 22 64 C22 44 50 14 50 14 Z';

function svg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="drop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bdf4fa"/>
      <stop offset="100%" stop-color="${CYAN}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="${BG}"/>
  <circle cx="50" cy="50" r="42" fill="url(#glow)"/>
  <path d="${DROP_PATH}" fill="url(#drop)"/>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const size of [192, 512]) {
    const png = await sharp(Buffer.from(svg(size))).resize(size, size).png().toBuffer();
    const file = path.join(OUT_DIR, `icon-${size}.png`);
    await writeFile(file, png);
    console.log(`wrote ${file} (${png.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
