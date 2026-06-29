/**
 * Dump the live attribute schema of the notebooks category (MLA1652) so you can
 * CONFIRM the real attribute ids instead of hardcoding them (brief §5.2 / §14).
 * Cross-check the ids printed here against src/shared/constants.mjs → ATTRIBUTE_IDS.
 *
 * Usage: npm run inspect-attributes
 */
import { getCategoryAttributes } from './_shared/ml-client.mjs';
import { ATTRIBUTE_IDS } from '../src/shared/constants.mjs';

const attrs = await getCategoryAttributes();
const known = new Set(Object.values(ATTRIBUTE_IDS).flat());

console.log(`\n${attrs.length} atributos en MLA1652. (★ = ya está en ATTRIBUTE_IDS)\n`);
for (const a of attrs) {
  const star = known.has(a.id) ? '★' : ' ';
  const values = (a.values ?? []).slice(0, 4).map((v) => v.name).join(', ');
  const more = (a.values?.length ?? 0) > 4 ? ` …(+${a.values.length - 4})` : '';
  console.log(`${star} ${a.id.padEnd(28)} ${a.name}${values ? `  [${values}${more}]` : ''}`);
}

console.log('\nRevisá los que tengan que ver con: RAM, procesador, almacenamiento, pantalla, GPU, sistema operativo.');
