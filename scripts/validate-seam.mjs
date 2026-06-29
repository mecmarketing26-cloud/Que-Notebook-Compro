/**
 * BRIEF §12 — validate the critical seam end-to-end with ONE product before
 * scaling. Run this FIRST (after creds are configured):
 *
 *   npm run validate
 *
 * Steps:
 *   1. Discover one local-shipping laptop CATALOG PRODUCT (id + /p/ permalink).
 *   2. Mint an affiliate link for that permalink → short_url (meli.la).
 *   3. Print the short_url so you can open it in incognito and CONFIRM it lands
 *      on the right product (§6 caveat — verify it manually).
 *   4. Generate a description + write BOTH text stores (upsert).
 *   5. Print a merged "ficha" preview (live data + link + description).
 *
 * Discovery is catalog-product based because /sites/MLA/search and /items are
 * 403 for third-party apps (see README).
 */
import { getProduct, getProductOffers } from './_shared/ml-client.mjs';
import { discoverProductIds } from './_shared/discover.mjs';
import { mintLink } from './_shared/mint.mjs';
import { generateDescription } from './_shared/describe.mjs';
import { loadLinks, saveLinks, loadDescriptions, saveDescriptions } from './_shared/stores.mjs';
import { pickCheapestLocalOffer, productPermalink } from '../src/shared/ml-fields.mjs';
import { buildProductView } from '../src/shared/product-view.mjs';
import { specSummary } from '../src/shared/attributes.mjs';

const step = (n, msg) => console.log(`\n\x1b[1m[${n}/5] ${msg}\x1b[0m`);

// 1) Find one laptop product with a local, buyable offer.
step(1, 'Buscando una notebook (producto de catálogo) con oferta de envío local…');
let chosen = null;
let scanned = 0;
for await (const id of discoverProductIds({ pagesPerQuery: 1 })) {
  if (++scanned > 40) break;
  const offers = await getProductOffers(id);
  const offer = pickCheapestLocalOffer(offers);
  if (offer) {
    const product = await getProduct(id);
    chosen = { id, product, offers, offer };
    break;
  }
}
if (!chosen) {
  console.error('❌ No encontré una notebook con oferta local en la primera tanda. Reintentá.');
  process.exit(1);
}
const permalink = productPermalink(chosen.product);
console.log(`   product id: ${chosen.id}`);
console.log(`   nombre: ${chosen.product.name}`);
console.log(`   /p/ permalink: ${permalink}`);
console.log(`   oferta más barata (local): $${chosen.offer.price}`);

// 2) Mint an affiliate link.
step(2, 'Minteando link de afiliado (endpoint del panel, sesión de navegador)…');
let mint;
try {
  mint = await mintLink(permalink);
} catch (err) {
  console.error('❌', err.message);
  process.exit(1);
}
if (!mint.short_url) {
  console.error('❌ El endpoint no devolvió short_url. Payload:', JSON.stringify(mint.raw).slice(0, 300));
  process.exit(1);
}
console.log(`   short_url: ${mint.short_url}`);
console.log(`   regex: ${mint.regex ?? '(none)'}`);

// 3) Manual verification reminder.
step(3, 'VERIFICÁ A MANO (caveat §6):');
console.log(`   Abrí en incógnito → ${mint.short_url}`);
console.log('   Confirmá que aterriza en la página correcta del producto (o donde se puede comprar y atribuye).');

// 4) Description + write both stores.
step(4, 'Generando descripción + escribiendo stores…');
const desc = await generateDescription(buildProductViewSpecs(chosen), chosen.product.name);

const links = await loadLinks();
links[chosen.id] = { short_url: mint.short_url, regex: mint.regex, minted_at: new Date().toISOString() };
await saveLinks(links);

const descriptions = await loadDescriptions();
descriptions[chosen.id] = { text: desc.text, generated_at: new Date().toISOString() };
await saveDescriptions(descriptions);
console.log(`   ✓ stores actualizados (descripción: ${desc.source}).`);

// 5) Merged ficha preview.
step(5, 'Ficha resultante (merge de data viva + link + descripción):');
const view = buildProductView(chosen.product, chosen.offers, { shortUrl: mint.short_url, description: desc.text });
console.log('   ┌──────────────────────────────────────────────');
console.log(`   │ ${view.title}`);
console.log(`   │ Precio de referencia (desde): $${view.price?.toLocaleString('es-AR')} ${view.currency}`);
console.log(`   │ Ofertas locales: ${view.available} · ${view.condition}`);
console.log(`   │ Specs: ${specSummary(view.specs) || '(no se normalizaron)'}`);
console.log(`   │ Imagen: ${view.image}`);
console.log(`   │ Descripción: ${view.description}`);
console.log(`   │ Comprar: ${view.shortUrl}`);
console.log('   └──────────────────────────────────────────────');
console.log('\n✅ Seam validado. Si el meli.la aterriza bien, escalá con `npm run mint` + `npm run describe`.\n');

function buildProductViewSpecs(c) {
  // specs come from the product datasheet; reuse the normalizer via buildProductView
  return buildProductView(c.product, c.offers, {}).specs;
}
