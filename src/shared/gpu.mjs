/**
 * Tiers de rendimiento de GPU (pure). El dato crudo de ML es sucio: gpuModel
 * puede ser "RTX 4050", "4050", "450", "NVIDIA", "6GB" o directamente una iGPU
 * ("Radeon 780M") cargada en el campo de placa dedicada. Acá se normaliza todo
 * a una escala monótona 0..7 parseando gpuModel + título del producto, así los
 * productos nuevos que se vayan sumando al catálogo se clasifican solos.
 *
 * Escala (GPUs de notebook):
 *   0 = integrada / sin dato
 *   1 = dedicada de entrada (MX, GTX 1650, RTX 2050): no es para gaming
 *   2 = RTX 3050 / 3050 Ti / 2060: gaming liviano, no sostiene 120 fps 1080p
 *   3 = PISO GAMER ≈ RTX 3060 / RTX 4050 / RTX 5050: ~120 fps en 1080p
 *       en títulos competitivos (CS2, Valorant, Fortnite)
 *   4 = RTX 4060 / 5060 / 3070 · 5 = RTX 4070 / 5070 / 3080
 *   6 = RTX 4080 / 5070 Ti / 5080 · 7 = RTX 4090 / 5090
 */

/** Piso para considerar una notebook realmente "gamer" (≈ RTX 3060/4050+). */
export const GAMER_MIN_GPU_TIER = 3;

// iGPUs y marcadores de "integrada" — incluye las Radeon xxxM / Vega / Iris /
// UHD / Arc de Lunar Lake que ML a veces carga en el campo de GPU dedicada.
const INTEGRATED_RE =
  /integrad|iris|uhd|hd graphics|vega|arc\s*1\d0v|\b[5-8][1-9]0m\b|radeon(?!\s*rx)|\bapple\b|adreno|snapdragon/i;

// Patrones con prefijo (seguros sobre modelo + título). El orden importa:
// primero los tiers altos y los "Ti" para que no los pise el modelo base.
const DGPU_TIERS = [
  [/rtx\s*(4090|5090)/i, 7],
  [/rtx\s*5070\s*ti|rtx\s*(4080|5080)/i, 6],
  [/rtx\s*4070\s*ti|rtx\s*(4070|5070|3080)|rx\s*7900/i, 5],
  [/rtx\s*(4060|5060|3070)|rx\s*(6700m|6800m|7600|7700s)/i, 4],
  [/rtx\s*(3060|4050|5050|2070|2080)|rx\s*6600m?/i, 3],
  [/rtx\s*(3050|2060)|gtx\s*16[56]0\s*ti/i, 2],
  [/gtx\s*1[06][56]0|rtx\s*2050|\bmx\s*\d{3}\b|rx\s*(6500m|550)|gtx\s*\d{3,4}/i, 1],
];

// Modelos "pelados" que aparecen en specs.gpuModel sin marca ("4050", "450",
// "3050 Ti"). Solo se aplican al campo gpuModel, nunca al título.
const BARE_MODEL_TIERS = [
  [/^\s*(4090|5090)/, 7],
  [/^\s*5070\s*ti|^\s*(4080|5080)/, 6],
  [/^\s*(4070|5070|3080)/, 5],
  [/^\s*(4060|5060|3070)/, 4],
  [/^\s*(3060|4050|5050)/, 3],
  [/^\s*(3050|2060)/, 2],
  [/^\s*(2050|[1-9]50)\s*$/, 1], // MX450/550, GTX 950/1050…
];

/**
 * Tier de GPU de un producto. Usa specs.gpuModel + el título (los títulos de ML
 * suelen traer la GPU aunque el atributo venga vacío o roto).
 * @param {{ gpuModel?: string, gpuDedicated?: boolean }} specs
 * @param {string} [title]
 * @returns {number} 0..7
 */
export function gpuTier(specs, title = '') {
  const s = specs ?? {};
  const model = s.gpuModel ?? '';
  const hay = `${model} ${title}`;

  for (const [re, tier] of DGPU_TIERS) if (re.test(hay)) return tier;
  for (const [re, tier] of BARE_MODEL_TIERS) if (re.test(model)) return tier;
  if (INTEGRATED_RE.test(model)) return 0;
  // Sin modelo reconocible: si ML la marca dedicada, asumimos entrada (nunca
  // la dejamos entrar a "gamer" solo por el flag — así entró una MX450).
  return s.gpuDedicated === true ? 1 : 0;
}

/**
 * ¿Tiene GPU dedicada DE VERDAD? Corrige el flag de ML cuando el modelo
 * delata una integrada (Radeon 780M, Iris, UHD…) cargada como "dedicada".
 * @param {{ gpuModel?: string, gpuDedicated?: boolean }} specs
 * @param {string} [title]
 */
export function isDedicatedGpu(specs, title = '') {
  const s = specs ?? {};
  if (gpuTier(s, title) >= 1) return true;
  if (s.gpuModel && INTEGRATED_RE.test(s.gpuModel)) return false;
  return s.gpuDedicated === true;
}
