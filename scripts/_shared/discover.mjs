/**
 * Laptop discovery (item search is 403, so we use the catalog).
 *
 * Two sources, both yielding catalog PRODUCT ids:
 *   1. Highlights — the category's top curated products (rich datasheets + stock).
 *   2. products/search across laptop-targeted queries, keeping only results that
 *      are real laptops (domain_id === MLA-NOTEBOOKS) AND have a rich datasheet
 *      (attributes.length >= RICH_MIN). This drops the sparse "user-product"
 *      groupings that carry no specs. `attributes` ships in the search result, so
 *      we filter before spending any extra call.
 *
 * Offer/stock is NOT checked here — the consumer (mint / serving) does that via
 * pickCheapestLocalOffer, so a product can come back into stock without a code change.
 */
import { searchCatalogProducts, getCategoryHighlights } from './ml-client.mjs';
import { NOTEBOOK_DOMAIN, SEARCH_PAGE_LIMIT } from '../../src/shared/constants.mjs';
import { NOTEBOOK_QUERIES } from '../../src/shared/queries.mjs';

export const RICH_MIN = 15; // attributes count that marks a real datasheet

// Same wide query set as the live-search index (all brands, Mac, Chromebook…).
export const DEFAULT_QUERIES = NOTEBOOK_QUERIES;

/**
 * Async generator of unique, datasheet-rich laptop product ids.
 * @param {{ queries?:string[], pagesPerQuery?:number, seen?:Set<string>, richMin?:number, useHighlights?:boolean }} opts
 */
export async function* discoverProductIds({
  queries = DEFAULT_QUERIES,
  pagesPerQuery = 2,
  seen = new Set(),
  richMin = RICH_MIN,
  useHighlights = true,
} = {}) {
  if (useHighlights) {
    for (const id of await getCategoryHighlights()) {
      if (!seen.has(id)) {
        seen.add(id);
        yield id;
      }
    }
  }

  for (const q of queries) {
    for (let page = 0; page < pagesPerQuery; page++) {
      let res;
      try {
        res = await searchCatalogProducts({ q, offset: page * SEARCH_PAGE_LIMIT, limit: SEARCH_PAGE_LIMIT });
      } catch {
        break;
      }
      const results = res?.results ?? [];
      if (!results.length) break;
      for (const r of results) {
        if (r.domain_id !== NOTEBOOK_DOMAIN) continue;
        if ((r.attributes?.length ?? 0) < richMin) continue; // skip sparse groupings
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        yield r.id;
      }
    }
  }
}
