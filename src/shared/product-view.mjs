/**
 * Merge a catalog product (`/products/{id}`) + its offers (`/products/{id}/items`)
 * + our stored text (short_url, description) into the single view the site
 * renders. Shared by the SSR catalog and the jobs so the shape never diverges.
 *
 * Returns null when there's no local, buyable offer — those products are hidden
 * (out of stock / not shippable locally, §5.3.1 / §8).
 */
import { getImage, productPermalink, pickCheapestLocalOffer, isLocalShipping } from './ml-fields.mjs';
import { normalizeSpecs } from './attributes.mjs';

export function buildProductView(product, offers, { shortUrl = '', description = '' } = {}) {
  if (!product || !product.id) return null;
  const offer = pickCheapestLocalOffer(offers);
  if (!offer) return null;

  const localCount = (Array.isArray(offers) ? offers : []).filter((o) => isLocalShipping(o)).length;

  const original = typeof offer.original_price === 'number' && offer.original_price > offer.price ? offer.original_price : null;
  const discountPct = original ? Math.round((1 - offer.price / original) * 100) : null;

  return {
    id: product.id,
    title: product.name ?? '',
    price: typeof offer.price === 'number' ? offer.price : null, // cheapest local = "desde $X"
    originalPrice: original,
    discountPct,
    currency: offer.currency_id ?? 'ARS',
    image: getImage(product),
    permalink: productPermalink(product),
    shortUrl,
    available: localCount,
    condition: offer.condition ?? '',
    specs: normalizeSpecs(product.attributes),
    description,
    fetchedAt: new Date().toISOString(),
  };
}
