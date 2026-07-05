/**
 * Search/recommend over the persisted product POOL (data/catalog.json).
 *
 * This used to mirror the whole live ML catalog in real time (a background index
 * that price-checked thousands of products per build) — which got the app blocked
 * for excessive API calls + a storm of 404s. Now the buyable pool is persisted by
 * the gentle `catalog` jobs and we just filter/rank it in memory: instant, no API
 * calls per request, fully within ML's API policy.
 *
 * The exported names/shapes are unchanged so the pages don't need to change.
 */
import { allProducts } from './catalog-data';
import { enrichWinners } from './enrich';
import { recommend, similarByPrice } from '../shared/filter-engine.mjs';
import type { NotebookProduct, NotebookFilters } from './types';

/** No-op: the pool is served from disk, nothing to warm. Kept for call-site compat. */
export function warmIndex(): void {
  /* served from snapshot */
}

/** Pool status for messaging (always "ready" — it's a static file). */
export function indexStatus() {
  const size = allProducts().length;
  return { size, building: false, progress: 100 };
}

/** Kept for the warmup endpoint/cron: returns the current pool size. */
export async function refreshIndex(): Promise<number> {
  return allProducts().length;
}

export async function liveSearch(
  filters: NotebookFilters,
  // enrich:false = servir precios del snapshot sin tocar la API (páginas
  // prerenderizadas en build; en prod sin credenciales el enrich ya era no-op).
  { max = 12, match, hardPrice = false, enrich = true }: { max?: number; match?: (p: NotebookProduct) => boolean; hardPrice?: boolean; enrich?: boolean } = {},
): Promise<{ products: NotebookProduct[]; relaxed: boolean; universe: number; building: boolean; priceEmpty: boolean; similar: NotebookProduct[] }> {
  const universe = allProducts().length;
  let pool = allProducts();
  if (match) pool = pool.filter(match); // brand/keyword topics (Mac, Chromebook…)

  if (!pool.length) {
    return { products: [], relaxed: false, universe, building: false, priceEmpty: false, similar: [] };
  }

  // hardPrice = el usuario fijó un presupuesto: respetamos el rango (no se afloja).
  // Pedimos un pequeño excedente para reponer los que el precio en vivo descarte.
  const ranked = recommend(pool, filters, { min: 3, max: max + 4, hardPrice });
  // Price-on-win: precio EN VIVO solo para los que se muestran (los "ganadores").
  const winners = ranked.products as NotebookProduct[];
  const products = (enrich ? await enrichWinners(winners) : winners).slice(0, max);

  // Precio duro sin resultados en el rango → ofrecer "similares" (mismo perfil,
  // ignorando el rango de precio, ordenadas por cercanía de precio).
  let priceEmpty = false;
  let similar: NotebookProduct[] = [];
  if (hardPrice && products.length === 0 && (filters.priceMin != null || filters.priceMax != null)) {
    priceEmpty = true;
    const sim = similarByPrice(pool, filters, { max: 10 }) as NotebookProduct[];
    similar = (enrich ? await enrichWinners(sim) : sim).slice(0, 6);
  }

  return { products, relaxed: ranked.relaxed, universe, building: false, priceEmpty, similar };
}

/** Top notebooks for the homepage (best specs first). */
export async function getFeatured(n = 8): Promise<NotebookProduct[]> {
  return allProducts()
    .sort(
      (a, b) =>
        (b.specs.processorTier ?? 0) - (a.specs.processorTier ?? 0) ||
        (b.specs.ramGb ?? 0) - (a.specs.ramGb ?? 0),
    )
    .slice(0, n);
}
