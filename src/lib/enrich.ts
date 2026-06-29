/**
 * Price-on-win: live price for the products actually SHOWN (quiz winners, ficha,
 * blog rankings). The catalog snapshot carries a "precio de referencia" captured
 * when the product was added; here we fetch the CURRENT cheapest local offer for
 * just the handful being displayed, so the user sees a live price on the products
 * that matter.
 *
 * This is deliberately bounded — only the ≤12 shown products, cached 20 min, with
 * a graceful fallback to the snapshot price on any error/rate-limit. Volume is
 * proportional to real traffic (value-generating use), NOT to catalog size, so it
 * stays well within ML's API policy (unlike the old whole-catalog background scan).
 */
import { getProductOffers, hasCredentials } from './ml-api';
import { pickCheapestLocalOffer, isLocalShipping } from '../shared/ml-fields.mjs';
import type { NotebookProduct } from './types';

const OFFERS_TTL_MS = 20 * 60 * 1000;
const offerCache = new Map<string, { at: number; offers: any[] }>();

async function offersCached(id: string): Promise<any[]> {
  const hit = offerCache.get(id);
  if (hit && Date.now() - hit.at < OFFERS_TTL_MS) return hit.offers;
  const offers = await getProductOffers(id);
  offerCache.set(id, { at: Date.now(), offers });
  return offers;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

function applyOffer(p: NotebookProduct, offers: any[]): boolean {
  const offer = pickCheapestLocalOffer(offers);
  if (!offer || typeof offer.price !== 'number') return false; // sin oferta viva ahora
  p.price = offer.price; // ← precio ACTUAL
  const orig = typeof offer.original_price === 'number' && offer.original_price > offer.price ? offer.original_price : null;
  p.originalPrice = orig;
  p.discountPct = orig ? Math.round((1 - offer.price / orig) * 100) : null;
  p.available = offers.filter((o) => isLocalShipping(o)).length;
  p.fetchedAt = new Date().toISOString();
  return true;
}

/**
 * Enrich the SHOWN list with live prices. Drops products that are now out of stock
 * locally (no live offer) so a ranking never shows a ghost. On network/rate-limit
 * error a product is kept with its snapshot price (best effort). No-op without creds.
 */
export async function enrichWinners(products: NotebookProduct[]): Promise<NotebookProduct[]> {
  if (!hasCredentials() || !products.length) return products;
  const drop = new Set<string>();
  await mapLimit(products, 6, async (p) => {
    try {
      const live = applyOffer(p, await offersCached(p.id));
      if (!live) drop.add(p.id); // confirmado sin stock → fuera del ranking
    } catch {
      /* error de red / 429 → conservar precio de referencia del snapshot */
    }
  });
  return products.filter((p) => !drop.has(p.id));
}

/**
 * Enrich a single product (ficha). Keeps the snapshot price as fallback if there's
 * no live offer or creds — the ficha still renders with "precio de referencia".
 */
export async function enrichOne(product: NotebookProduct): Promise<NotebookProduct> {
  if (!hasCredentials()) return product;
  try {
    applyOffer(product, await offersCached(product.id));
  } catch {
    /* keep snapshot price */
  }
  return product;
}
