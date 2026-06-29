/**
 * Helpers to read fields out of Mercado Libre API responses (search results and
 * full /items objects have overlapping but not identical shapes). Pure functions.
 */
import { LOCAL_COUNTRY_ID, CBT_LOGISTIC_TYPE } from './constants.mjs';

/**
 * Brief §5.3.1 — local-shipping predicate. Cross-border (CBT / Global Selling)
 * items are NOT eligible for the affiliate program, so we exclude them both when
 * minting (don't waste requests) and when serving (never show them).
 *
 * A product passes ONLY IF the seller is in Argentina AND it is not a `remote`
 * (cross-border) shipment, and it carries no CBT marker.
 *
 * Defensive: the field is read from whichever shape is present (search result vs
 * full item). Confirm exact field names against a live `/items` response when you
 * run the end-to-end test (brief §5.3.1 / §12).
 *
 * @param {Record<string, any>} it - a search result or a full item object
 * @returns {boolean}
 */
export function isLocalShipping(it) {
  if (!it || typeof it !== 'object') return false;

  // 1) CBT id prefix (global items are "CBTxxxx").
  const id = String(it.id ?? '');
  if (id.startsWith('CBT')) return false;

  // 2) Cross-border logistic type.
  const logisticType = it.shipping?.logistic_type ?? it.logistic_type ?? null;
  if (logisticType === CBT_LOGISTIC_TYPE) return false;

  // 3) Cross-border / international markers in tags.
  const tags = [
    ...(Array.isArray(it.tags) ? it.tags : []),
    ...(Array.isArray(it.shipping?.tags) ? it.shipping.tags : []),
  ].map((t) => String(t).toLowerCase());
  if (tags.some((t) => t.includes('cbt') || t.includes('cross_border') || t.includes('international'))) {
    return false;
  }

  // 4) Seller country must be Argentina. Search results expose this differently
  //    than full items, so check a few likely locations before deciding.
  const countryId =
    it.seller_address?.country?.id ??
    it.seller_address?.country_id ??
    it.location?.country?.id ??
    null;
  if (countryId != null) {
    return countryId === LOCAL_COUNTRY_ID;
  }

  // Fallback: `seller_address.state.id` looks like "AR-C", "AR-B", etc.
  const stateId = it.seller_address?.state?.id ?? it.address?.state_id ?? '';
  if (typeof stateId === 'string' && stateId.startsWith(`${LOCAL_COUNTRY_ID}-`)) {
    return true;
  }

  // If we genuinely can't tell the country and there's no CBT marker, keep it.
  // (We already filtered out the strong CBT signals above.)
  return true;
}

/** Best available price from a search result or item. */
export function getPrice(it) {
  const p = it?.price ?? it?.base_price ?? null;
  return typeof p === 'number' ? p : null;
}

/** Stock: full items expose `available_quantity`; search results may not. */
export function getAvailableQuantity(it) {
  const q = it?.available_quantity;
  return typeof q === 'number' ? q : null;
}

/** Upgrade an http thumbnail to https and prefer a larger render when possible. */
export function getImage(it) {
  const pic = Array.isArray(it?.pictures) && it.pictures.length ? it.pictures[0] : null;
  const raw = pic?.secure_url ?? pic?.url ?? it?.secure_thumbnail ?? it?.thumbnail ?? '';
  if (!raw) return '';
  let url = raw.replace(/^http:\/\//, 'https://');
  // ML thumbnails end in "-I.jpg" (small); "-O.jpg"/"-F.jpg" are larger.
  url = url.replace(/-I\.(jpg|png|webp)(\?.*)?$/i, '-O.$1$2');
  return url;
}

// ── Catalog-product helpers (the site is product-based: /items is 403 for
//    third parties, so we read /products/{id} + /products/{id}/items) ──────────

/** Canonical catalog (/p/) URL — the affiliate buy link target. */
export function productPermalink(product) {
  if (product?.permalink) return product.permalink;
  return `https://www.mercadolibre.com.ar/p/${product?.id ?? ''}`;
}

/**
 * From a product's offers (`/products/{id}/items` results), pick the cheapest
 * one that ships locally (§5.3.1). Offers expose `price`, `shipping` and
 * `seller_address`, so the same predicate applies. Returns the offer or null.
 */
export function pickCheapestLocalOffer(offers) {
  const local = (Array.isArray(offers) ? offers : [])
    .filter((o) => typeof o?.price === 'number' && isLocalShipping(o))
    .sort((a, b) => a.price - b.price);
  return local[0] ?? null;
}
