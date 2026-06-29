/**
 * JOB (brief §2/§6): discover laptop CATALOG PRODUCTS and mint affiliate links
 * for the ones not yet in the store. Respects the store (never re-mints),
 * requires a local buyable offer (excludes cross-border / non-AR and dead
 * listings, §5.3.1), runs sequentially with a small delay, and STOPS with a
 * clear message if the affiliate session expires (401/403).
 *
 * Discovery is catalog-product based (item search/multiget are 403). Mint URL is
 * the catalog /p/ permalink.
 *
 * Usage:
 *   npm run mint                                  # default queries, 2 pages each
 *   npm run mint -- --pages=4                     # more pages per query
 *   npm run mint -- --q="notebook gamer rtx"      # a single custom query
 *   npm run mint -- --max=50                      # cap how many new links to mint
 *
 * Output: upserts data/affiliate_links.json.
 */
import { getProductOffers, getProduct } from './_shared/ml-client.mjs';
import { discoverProductIds, DEFAULT_QUERIES } from './_shared/discover.mjs';
import { mintLink, mintDelay, getAffiliateSession, SessionExpiredError } from './_shared/mint.mjs';
import { loadLinks, saveLinks } from './_shared/stores.mjs';
import { pickCheapestLocalOffer, productPermalink } from '../src/shared/ml-fields.mjs';

// ── args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const pagesPerQuery = Number(args.pages ?? 2);
const maxNew = args.max ? Number(args.max) : Infinity;
const queries = args.q ? [String(args.q)] : DEFAULT_QUERIES;

// Validate the session creds exist before spending any API calls.
getAffiliateSession();

const links = await loadLinks();
let minted = 0;
let noOffer = 0;
let skipped = 0;
let scanned = 0;
let errored = 0;

console.log(`Minteo: ${queries.length} queries × ${pagesPerQuery} páginas. Tope de links nuevos: ${maxNew === Infinity ? '∞' : maxNew}.`);

try {
  for await (const id of discoverProductIds({ queries, pagesPerQuery })) {
    if (minted >= maxNew) break;
    if (links[id]) { skipped++; continue; } // ya en el store → no re-mintear

    try {
      scanned++;
      const offers = await getProductOffers(id);
      const offer = pickCheapestLocalOffer(offers);
      if (!offer) { noOffer++; continue; } // sin oferta local/comprable → saltear (transitorio)

      const product = await getProduct(id);
      const mint = await mintLink(productPermalink(product));
      if (mint.short_url) {
        links[id] = { short_url: mint.short_url, regex: mint.regex, minted_at: new Date().toISOString() };
        minted++;
        process.stdout.write(`  ✓ ${id} → ${mint.short_url}  (${product.name?.slice(0, 45)})\n`);
      } else {
        // No afiliable: marca permanente para no reintentar en cada corrida.
        links[id] = { short_url: null, ineligible: true, reason: mint.raw?.message ?? `http_${mint.status}`, checked_at: new Date().toISOString() };
        process.stdout.write(`  ✗ ${id} no elegible (${links[id].reason})\n`);
      }
      await saveLinks(links);
      await mintDelay();
    } catch (err) {
      if (err instanceof SessionExpiredError) throw err; // sesión vencida → frenar todo
      errored++; // error transitorio (red/timeout) → log y seguir
      process.stdout.write(`  ! ${id} error: ${String(err.message).slice(0, 60)} — sigo\n`);
    }
  }
} catch (err) {
  await saveLinks(links);
  if (err instanceof SessionExpiredError) {
    console.error(`\n🛑 ${err.message}`);
    console.error(`Progreso guardado: +${minted} links nuevos. Recapturá la sesión y volvé a correr.`);
    process.exit(2);
  }
  console.error('\n❌ Error inesperado:', err.message);
  process.exit(1);
}

await saveLinks(links);
console.log(`\nListo. Escaneados: ${scanned} · Minteados: +${minted} · Sin oferta local: ${noOffer} · Ya estaban: ${skipped} · Errores transitorios: ${errored}`);
console.log('Siguiente paso: npm run describe');
