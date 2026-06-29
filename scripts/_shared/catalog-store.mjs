/**
 * Persistent product SNAPSHOT (the "memoria" of the buyable pool).
 *
 * This is the key to staying within Mercado Libre's API policy. The old design
 * re-fetched every product LIVE on each page view (tens of thousands of calls/day
 * + a storm of 404s) which triggered an EXCESSIVE_API_CALL / data-infraction
 * block. Instead, when we discover+mint a product we already have its name,
 * image, specs and price in hand — so we PERSIST that full view here, ONCE.
 *
 *   data/catalog.json -> { [productId]: NotebookProduct + addedAt + priceUpdatedAt }
 *
 * The SSR site serves straight from this file (zero API calls per visit). Two
 * gentle, low-volume jobs keep it fresh:
 *   - catalog grow     → add NEW products, a handful at a time (the pool grows)
 *   - catalog refresh  → re-price ONLY the products already stored (no discovery)
 *
 * Append/upsert with stable key order so diffs stay readable when committed.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DATA_DIR } from './env.mjs';

export const CATALOG_PATH = resolve(DATA_DIR, 'catalog.json');

export async function loadCatalog() {
  try {
    return JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export async function saveCatalog(catalog) {
  const ordered = Object.fromEntries(Object.keys(catalog).sort().map((k) => [k, catalog[k]]));
  await writeFile(CATALOG_PATH, JSON.stringify(ordered, null, 2) + '\n');
}

// ── "sin oferta" cooldown ────────────────────────────────────────────────────
// Remembers product ids checked and found WITHOUT a local offer, with a timestamp,
// so the daily grow doesn't re-scan the same dead products every run (which would
// re-emit the same 404s). They're re-evaluated after the cooldown (in case stock
// comes back). Keyed by id → ISO timestamp of last check.
export const NO_OFFER_PATH = resolve(DATA_DIR, '.no-offer.json');

export async function loadNoOffer() {
  try {
    return JSON.parse(await readFile(NO_OFFER_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export async function saveNoOffer(map) {
  const ordered = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
  await writeFile(NO_OFFER_PATH, JSON.stringify(ordered, null, 2) + '\n');
}
