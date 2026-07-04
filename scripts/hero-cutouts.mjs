/**
 * Genera los PNGs transparentes del hero (public/img/hero/*.png) a partir de
 * fotos REALES del catálogo: baja la foto del producto (JPG con fondo blanco
 * de ML), le borra el fondo con un flood-fill desde los bordes (no perfora
 * blancos internos como la pantalla) y la recorta/redimensiona.
 *
 * Correr cuando quieras renovar los equipos del hero:
 *   node scripts/hero-cutouts.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'data', 'catalog.json'), 'utf8'));
const outDir = join(root, 'public', 'img', 'hero');
mkdirSync(outDir, { recursive: true });

const showable = Object.values(catalog).filter((e) => e?.shortUrl && (e.available == null || e.available > 0) && e.image);
const isApple = (e) => /apple|macbook/i.test(e.title);
const isChrome = (e) => /chromebook/i.test(e.title);

// Mismo criterio que el hero de index.astro: una foto por palabra rotativa.
const base = showable.find((e) => !isApple(e) && !isChrome(e));
const picks = {
  notebook: base,
  macbook: showable.find(isApple) ?? base,
  // La HP convertible en modo tienda es la foto que mejor "se lee" como
  // Chromebook (la Acer viene en combo con accesorios que ensucian el recorte).
  chromebook: showable.find((e) => /hp chromebook/i.test(e.title)) ?? showable.find(isChrome) ?? base,
  laptop: showable.filter((e) => !isApple(e) && !isChrome(e) && e.image !== base?.image)[1] ?? base,
};

/** Borra el fondo casi-blanco conectado a los bordes (BFS). */
function removeBackground(data, width, height, threshold = 238) {
  const isWhite = (i) => data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold;
  const visited = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) queue.push(x, x + (height - 1) * width);
  for (let y = 0; y < height; y++) queue.push(y * width, width - 1 + y * width);
  while (queue.length) {
    const p = queue.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    if (!isWhite(i)) continue;
    data[i + 3] = 0; // transparente
    const x = p % width;
    const y = (p / width) | 0;
    if (x > 0) queue.push(p - 1);
    if (x < width - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - width);
    if (y < height - 1) queue.push(p + width);
  }
}

for (const [name, entry] of Object.entries(picks)) {
  if (!entry) {
    console.warn(`(sin producto para "${name}")`);
    continue;
  }
  const res = await fetch(entry.image);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeBackground(data, info.width, info.height);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .resize({ width: 640, height: 480, fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, quality: 90 })
    .toFile(join(outDir, `${name}.png`));
  console.log(`${name}.png  ←  ${entry.title.slice(0, 60)}`);
}
