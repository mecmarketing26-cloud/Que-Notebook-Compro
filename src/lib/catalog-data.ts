/**
 * The SSR site's product source: the persisted snapshot (data/catalog.json),
 * built by the gentle `catalog` jobs. The site reads ONLY from here — zero
 * Mercado Libre API calls per visit — which is what keeps us inside ML's API
 * policy (no excessive calls, no 404 storms) and also means the site keeps
 * working even if the data API is temporarily down/blocked.
 *
 * catalog.json is bundled at build time (static import). To reflect new products
 * or refreshed prices, re-run the jobs and rebuild/redeploy.
 */
import catalogStore from '../../data/catalog.json';
import type { NotebookProduct } from './types';

interface CatalogEntry extends NotebookProduct {
  addedAt?: string;
  priceUpdatedAt?: string;
}

const store = catalogStore as unknown as Record<string, CatalogEntry>;

function toProduct(e: CatalogEntry): NotebookProduct {
  return {
    id: e.id,
    title: e.title,
    price: e.price ?? null,
    originalPrice: e.originalPrice ?? null,
    discountPct: e.discountPct ?? null,
    currency: e.currency || 'ARS',
    image: e.image || '',
    permalink: e.permalink || `https://www.mercadolibre.com.ar/p/${e.id}`,
    shortUrl: e.shortUrl || '',
    available: e.available ?? null,
    condition: e.condition || 'new',
    specs: e.specs ?? {},
    description: e.description || '',
    fetchedAt: e.priceUpdatedAt || e.fetchedAt || '',
  };
}

/** Every showable product: has a buy link AND is currently in stock locally. */
export function allProducts(): NotebookProduct[] {
  return Object.values(store)
    .filter((e) => e?.shortUrl && (e.available == null || e.available > 0))
    .map(toProduct);
}

/** One product by id (only if showable). */
export function getProductById(id: string): NotebookProduct | undefined {
  const e = store[id];
  if (!e || !e.shortUrl) return undefined;
  if (e.available != null && e.available <= 0) return undefined;
  return toProduct(e);
}

/** Total showable products in the pool (for stats / empty-state messaging). */
export function catalogSize(): number {
  return allProducts().length;
}
