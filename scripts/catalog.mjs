/**
 * CATALOG builder — the policy-safe data pipeline.
 *
 * Replaces the old "mirror the whole live ML catalog on every page view" model
 * (which got the app blocked for EXCESSIVE_API_CALL). Here we PERSIST a snapshot
 * of each buyable product ONCE, then serve the site from disk with zero API calls
 * per visit. Three gentle, low-volume modes:
 *
 *   node scripts/catalog.mjs backfill              # snapshot every already-minted
 *                                                  # product missing from catalog.json
 *   node scripts/catalog.mjs backfill --force      # re-snapshot all minted
 *   node scripts/catalog.mjs grow --max=25         # discover+mint NEW products (a
 *                                                  # handful at a time → pool grows)
 *   node scripts/catalog.mjs grow --max=25 --scan=200   # cap candidates scanned
 *   node scripts/catalog.mjs refresh               # re-price ONLY stored products
 *
 * All modes are sequential with a small delay (no bursts) and skip dead products
 * gracefully (no retry storms). Run via the npm aliases so .env is loaded.
 */
import { getProduct, getProductOffers } from './_shared/ml-client.mjs';
import { discoverProductIds } from './_shared/discover.mjs';
import { mintLink, mintDelay, getAffiliateSession, SessionExpiredError } from './_shared/mint.mjs';
import { loadLinks, saveLinks, loadDescriptions } from './_shared/stores.mjs';
import { loadCatalog, saveCatalog, loadNoOffer, saveNoOffer } from './_shared/catalog-store.mjs';
import { pickCheapestLocalOffer, productPermalink, isLocalShipping } from '../src/shared/ml-fields.mjs';
import { buildProductView } from '../src/shared/product-view.mjs';

// ── args ──────────────────────────────────────────────────────────────────
const mode = (process.argv[2] || '').toLowerCase();
const args = Object.fromEntries(
  process.argv.slice(3).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
if (!['backfill', 'grow', 'refresh'].includes(mode)) {
  console.error('Uso: node scripts/catalog.mjs <backfill|grow|refresh> [--max=N] [--scan=N] [--force]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Build the persisted snapshot entry for a product (or null if not buyable). */
async function snapshotEntry(id, { shortUrl, description, prev }) {
  const [product, offers] = await Promise.all([getProduct(id), getProductOffers(id)]);
  const view = buildProductView(product, offers, { shortUrl, description });
  if (!view) return null; // no local, buyable offer → not shown
  return {
    ...view,
    addedAt: prev?.addedAt ?? new Date().toISOString(),
    priceUpdatedAt: view.fetchedAt,
  };
}

// ── BACKFILL: persist a snapshot for every already-minted product ────────────
async function backfill() {
  const links = await loadLinks();
  const descriptions = await loadDescriptions();
  const catalog = await loadCatalog();
  const force = Boolean(args.force);

  const ids = Object.entries(links)
    .filter(([id, v]) => v?.short_url && (force || !catalog[id]))
    .map(([id]) => id);

  console.log(`Backfill: ${ids.length} productos minteados a snapshotear${force ? ' (--force)' : ''}.`);
  let added = 0, gone = 0, errored = 0, done = 0;

  for (const id of ids) {
    try {
      const entry = await snapshotEntry(id, {
        shortUrl: links[id].short_url,
        description: descriptions[id]?.text ?? '',
        prev: catalog[id],
      });
      if (entry) {
        catalog[id] = entry;
        added++;
        process.stdout.write(`  ✓ ${id}  ${String(entry.title).slice(0, 50)}  $${entry.price}\n`);
      } else {
        gone++; // sin oferta local ahora → no se guarda (puede volver en otra corrida)
      }
    } catch (err) {
      errored++;
      process.stdout.write(`  ! ${id} error: ${String(err.message).slice(0, 70)}\n`);
    }
    if (++done % 25 === 0) await saveCatalog(catalog);
    await sleep(350);
  }

  await saveCatalog(catalog);
  console.log(`\nListo. Snapshots: +${added} · Sin oferta: ${gone} · Errores: ${errored} · Total en catálogo: ${Object.keys(catalog).length}`);
}

// ── GROW: discover + mint NEW products, a handful at a time ──────────────────
async function grow() {
  getAffiliateSession(); // validate creds before spending calls
  const links = await loadLinks();
  const descriptions = await loadDescriptions();
  const catalog = await loadCatalog();
  const noOfferSeen = await loadNoOffer();
  const COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; // re-chequear "sin oferta" recién a los 10 días
  const t0 = Date.now();

  const maxNew = args.max ? Number(args.max) : 25;
  const maxScan = args.scan ? Number(args.scan) : 200;

  // Skip: ya minteados / en catálogo, y los "sin oferta" chequeados hace poco
  // (así el grow diario avanza sobre productos nuevos en vez de re-escanear muertos).
  const seen = new Set([...Object.keys(links), ...Object.keys(catalog)]);
  for (const [id, ts] of Object.entries(noOfferSeen)) {
    if (t0 - Date.parse(ts) < COOLDOWN_MS) seen.add(id);
  }

  console.log(`Grow: hasta ${maxNew} productos nuevos (escaneando como máx. ${maxScan} candidatos; ${seen.size} ya vistos/en cooldown).`);
  let added = 0, scanned = 0, noOfferCount = 0, ineligible = 0, errored = 0;

  try {
    for await (const id of discoverProductIds({ seen })) {
      if (added >= maxNew || scanned >= maxScan) break;
      if (links[id] || catalog[id]) continue;
      scanned++;
      if (scanned % 50 === 0) await saveNoOffer(noOfferSeen); // persistir cooldown de a tramos
      try {
        const offers = await getProductOffers(id);
        const offer = pickCheapestLocalOffer(offers);
        if (!offer) { noOfferSeen[id] = new Date().toISOString(); noOfferCount++; await sleep(250); continue; } // sin oferta → cooldown

        const product = await getProduct(id);
        const mint = await mintLink(productPermalink(product));
        if (mint.short_url) {
          links[id] = { short_url: mint.short_url, regex: mint.regex, minted_at: new Date().toISOString() };
          const view = buildProductView(product, offers, { shortUrl: mint.short_url, description: descriptions[id]?.text ?? '' });
          if (view) {
            catalog[id] = { ...view, addedAt: new Date().toISOString(), priceUpdatedAt: view.fetchedAt };
            added++;
            process.stdout.write(`  ✓ ${id}  ${String(view.title).slice(0, 45)}  $${view.price}\n`);
          }
        } else {
          links[id] = { short_url: null, ineligible: true, reason: mint.raw?.message ?? `http_${mint.status}`, checked_at: new Date().toISOString() };
          ineligible++;
        }
        await saveLinks(links);
        await saveCatalog(catalog);
        await mintDelay();
      } catch (err) {
        if (err instanceof SessionExpiredError) throw err;
        errored++;
        process.stdout.write(`  ! ${id} error: ${String(err.message).slice(0, 60)}\n`);
      }
    }
  } catch (err) {
    await saveLinks(links); await saveCatalog(catalog); await saveNoOffer(noOfferSeen);
    if (err instanceof SessionExpiredError) {
      console.error(`\n🛑 ${err.message}\nProgreso guardado: +${added}. Recapturá la sesión (npm run session) y reintentá.`);
      process.exit(2);
    }
    throw err;
  }

  await saveLinks(links); await saveCatalog(catalog); await saveNoOffer(noOfferSeen);
  console.log(`\nListo. Nuevos: +${added} · Escaneados: ${scanned} · Sin oferta: ${noOfferCount} · No elegibles: ${ineligible} · Errores: ${errored} · Total: ${Object.keys(catalog).length}`);
  if (added > 0) console.log('Tip: corré "npm run describe" para generar las descripciones de los nuevos.');
}

// ── REFRESH: re-price ONLY products already in the snapshot ──────────────────
async function refresh() {
  const catalog = await loadCatalog();
  const ids = Object.keys(catalog);
  console.log(`Refresh de precios: ${ids.length} productos del catálogo.`);
  let updated = 0, outOfStock = 0, errored = 0, done = 0;

  for (const id of ids) {
    try {
      const offers = await getProductOffers(id);
      const offer = pickCheapestLocalOffer(offers);
      const now = new Date().toISOString();
      if (offer && typeof offer.price === 'number') {
        const original = typeof offer.original_price === 'number' && offer.original_price > offer.price ? offer.original_price : null;
        catalog[id] = {
          ...catalog[id],
          price: offer.price,
          originalPrice: original,
          discountPct: original ? Math.round((1 - offer.price / original) * 100) : null,
          currency: offer.currency_id ?? catalog[id].currency ?? 'ARS',
          available: offers.filter((o) => isLocalShipping(o)).length,
          priceUpdatedAt: now,
        };
        updated++;
      } else {
        // Sin oferta local ahora → ocultar (available 0) pero conservar specs/descr.
        catalog[id] = { ...catalog[id], available: 0, priceUpdatedAt: now };
        outOfStock++;
      }
    } catch (err) {
      errored++;
      process.stdout.write(`  ! ${id} error: ${String(err.message).slice(0, 70)}\n`);
    }
    if (++done % 25 === 0) await saveCatalog(catalog);
    await sleep(300);
  }

  await saveCatalog(catalog);
  console.log(`\nListo. Reprecio: ${updated} · Sin stock (ocultos): ${outOfStock} · Errores: ${errored}`);
}

if (mode === 'backfill') await backfill();
else if (mode === 'grow') await grow();
else if (mode === 'refresh') await refresh();
