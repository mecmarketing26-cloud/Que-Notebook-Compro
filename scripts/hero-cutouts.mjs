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
const isGamer = (e) => /rtx|legion|nitro|victus|\btuf\b|\brog\b|strix|omen|katana|gamer|loq/i.test(e.title) || e.specs?.gpuDedicated;

// Modelos elegidos A MANO (fotos potentes en vista 3/4, recorte limpio).
// Si alguno sale del catálogo, cae al primer candidato de su categoría.
const CHOSEN = {
  notebook: 'MLA19916091', // MSI Sword blanca (3/4, teclado azul: contrasta con la Nitro)
  macbook: 'MLA51114742', // MacBook Air 13 M4 plata
  chromebook: 'MLA58953665', // Acer Chromebook 315 (vista angulada, sin accesorios)
  laptop: 'MLA24609349', // Acer Nitro 5 (3/4 dramática, teclado rojo)
};
const byId = (id) => catalog[id]?.image && catalog[id];
const picks = {
  notebook: byId(CHOSEN.notebook) ?? showable.find((e) => isGamer(e) && !isApple(e) && !isChrome(e)),
  macbook: byId(CHOSEN.macbook) ?? showable.find(isApple),
  chromebook: byId(CHOSEN.chromebook) ?? showable.find(isChrome),
  laptop: byId(CHOSEN.laptop) ?? showable.filter((e) => isGamer(e) && !isApple(e) && !isChrome(e))[1],
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
    // WebP con alpha: ~1/3 del peso del PNG con la misma calidad visual (LCP).
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(join(outDir, `${name}.webp`));
  console.log(`${name}.webp  ←  ${entry.title.slice(0, 60)}`);
}
