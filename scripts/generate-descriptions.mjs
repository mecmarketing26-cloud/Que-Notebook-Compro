/**
 * JOB (brief §7): generate a description for every minted notebook that doesn't
 * have one yet. Generated ONCE, persisted, and reused (existing keys skipped).
 *
 * Pulls live specs from the catalog product datasheet (`/products/{id}`),
 * normalizes them, then writes text only.
 *
 * Usage: npm run describe
 * Output: upserts data/descriptions.json.
 */
import { getProduct } from './_shared/ml-client.mjs';
import { generateDescription } from './_shared/describe.mjs';
import { loadLinks, loadDescriptions, saveDescriptions } from './_shared/stores.mjs';
import { normalizeSpecs } from '../src/shared/attributes.mjs';

const links = await loadLinks();
const descriptions = await loadDescriptions();

// Universe = products that actually have an affiliate link, missing a description.
const todo = Object.entries(links)
  .filter(([, v]) => v?.short_url)
  .map(([id]) => id)
  .filter((id) => !descriptions[id]);

if (!todo.length) {
  console.log('Nada para generar: todas las notebooks minteadas ya tienen descripción.');
  process.exit(0);
}

console.log(`Generando ${todo.length} descripciones…`);
let done = 0;
let byAnthropic = 0;

for (const id of todo) {
  let product;
  try {
    product = await getProduct(id);
  } catch {
    console.log(`  · ${id}: sin datos vivos (¿despublicado?) — salteado`);
    continue;
  }
  const specs = normalizeSpecs(product.attributes);
  const { text, source } = await generateDescription(specs, product.name);
  descriptions[id] = { text, generated_at: new Date().toISOString() };
  if (source === 'anthropic') byAnthropic++;
  done++;
  await saveDescriptions(descriptions); // persist incrementally
  process.stdout.write(`  ✓ ${id} (${source})\n`);
}

await saveDescriptions(descriptions);
console.log(`\nListo. Generadas: ${done} (Anthropic: ${byAnthropic} · plantilla: ${done - byAnthropic}).`);
