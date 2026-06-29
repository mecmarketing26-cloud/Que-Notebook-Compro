/**
 * The serving catalog — now backed by the persisted snapshot (data/catalog.json),
 * not live API calls.
 *
 * The product universe = entries of data/catalog.json that have an affiliate link
 * AND are in stock locally. Each entry already carries name, image, specs, price
 * and description (captured ONCE by the `catalog` jobs when the product was
 * discovered/minted), so the site renders with ZERO Mercado Libre API calls per
 * visit. Prices are kept fresh by the gentle `npm run catalog:refresh` job.
 *
 * This is what keeps us within ML's API policy (no excessive calls / 404 storms)
 * and also makes the site resilient: it keeps serving even if the data API is
 * temporarily down or the app is blocked.
 */
import { allProducts, getProductById, catalogSize } from './catalog-data';
import { enrichOne } from './enrich';
import type { NotebookProduct } from './types';

/** The full showable catalog (in stock, with a buy link). */
export async function getCatalog(): Promise<NotebookProduct[]> {
  return allProducts();
}

/** One product by id (only if it's showable). Live price-on-win for the ficha. */
export async function getNotebook(id: string): Promise<NotebookProduct | undefined> {
  const p = getProductById(id);
  return p ? enrichOne(p) : undefined;
}

/** Status flags for stats / empty-state messaging on the pages. */
export function catalogStatus() {
  const size = catalogSize();
  return {
    size,
    ready: size > 0,
    mintedCount: size,
  };
}
