/**
 * Normalizer: raw ML `attributes[]` -> a typed NotebookSpecs object the filter
 * engine and the UI can rely on. Pure function.
 *
 * Strategy (brief §5.2 / §14): try the candidate attribute IDs first, then fall
 * back to matching by attribute *name* and parsing the human value. This keeps it
 * working even when ML renames an attribute id. Confirm the real ids for MLA1652
 * with `npm run inspect-attributes` and extend constants.ATTRIBUTE_IDS as needed.
 */
import { ATTRIBUTE_IDS } from './constants.mjs';

/**
 * @typedef {Object} NotebookSpecs
 * @property {string} [brand]
 * @property {string} [line]
 * @property {string} [model]
 * @property {number} [ramGb]
 * @property {string} [processorBrand]   // Intel / AMD / Apple / ...
 * @property {string} [processorLine]    // "Core i5", "Ryzen 7", "Celeron", "M2"...
 * @property {number} [processorTier]    // normalized 0..9 (see PROCESSOR_TIER)
 * @property {string} [storageType]      // SSD / HDD / eMMC
 * @property {number} [storageGb]
 * @property {number} [screenInches]
 * @property {boolean} [gpuDedicated]
 * @property {string} [gpuModel]
 * @property {string} [os]
 * @property {number} [vramGb]
 * @property {number} [refreshHz]
 * @property {number} [weightKg]
 * @property {string} [ramType]
 * @property {string} [resolution]
 * @property {boolean} [touch]
 */

function findAttr(attributes, candidateIds, nameKeywords = []) {
  if (!Array.isArray(attributes)) return null;
  // 1) by id
  for (const id of candidateIds) {
    const hit = attributes.find((a) => a?.id === id);
    if (hit) return hit;
  }
  // 2) by name keyword (case/diacritics-insensitive)
  if (nameKeywords.length) {
    const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const hit = attributes.find((a) => {
      const n = norm(a?.name);
      return nameKeywords.some((kw) => n.includes(kw));
    });
    if (hit) return hit;
  }
  return null;
}

/** Read the human-readable value of an attribute. */
function attrValue(attr) {
  if (!attr) return undefined;
  return attr.value_name ?? attr.values?.[0]?.name ?? undefined;
}

/** Prefer the structured number (value_struct) and otherwise parse the string. */
function attrNumber(attr) {
  if (!attr) return undefined;
  const struct = attr.value_struct ?? attr.values?.[0]?.struct;
  if (struct && typeof struct.number === 'number') {
    return { number: struct.number, unit: String(struct.unit ?? '').toLowerCase() };
  }
  const raw = attrValue(attr);
  if (!raw) return undefined;
  const m = String(raw).replace(',', '.').match(/([\d.]+)\s*([a-zñ"]*)/i);
  if (!m) return undefined;
  return { number: parseFloat(m[1]), unit: (m[2] || '').toLowerCase() };
}

function toGb(parsed) {
  if (!parsed) return undefined;
  const u = parsed.unit;
  if (u === 'tb' || u === 'tib') return Math.round(parsed.number * 1024);
  if (u === 'mb') return Math.round(parsed.number / 1024);
  return Math.round(parsed.number); // assume GB
}

// Rough, monotonic tier so "i7 ≥ i5 ≥ i3" comparisons work across brands.
const PROCESSOR_TIER = [
  { re: /(core\s*)?ultra\s*9|i9|ryzen\s*9|m[1-4]\s*(max|ultra)/i, tier: 9 },
  { re: /(core\s*)?ultra\s*7|i7|ryzen\s*7|m[1-4]\s*pro/i, tier: 7 },
  { re: /(core\s*)?ultra\s*5|i5|ryzen\s*5|\bm[1-4]\b/i, tier: 5 },
  { re: /i3|ryzen\s*3/i, tier: 3 },
  { re: /pentium|athlon|core\s*2|celeron|atom|mediatek|snapdragon|n\d{3,4}/i, tier: 1 },
];

function processorTier(line, model) {
  const hay = `${line ?? ''} ${model ?? ''}`;
  for (const { re, tier } of PROCESSOR_TIER) if (re.test(hay)) return tier;
  return undefined;
}

const EMPTY_GPU = /^(no|sin|n\/?a|ninguna?|no aplica)$/i;
// Values that, even in a "dedicated GPU" field, actually mean integrated graphics.
const INTEGRATED_LOOKING = /integrad|iris|uhd|hd graphics|radeon graphics|vega|^intel$|^amd$|^apple$/i;

/**
 * GPU resolution for the real MLA1652 schema. There's no boolean attribute:
 * the presence of a DEDICATED_GRAPHIC_CARD_* value (that isn't "No"/empty) means
 * the laptop has a dedicated GPU; otherwise INTEGRATED_GRAPHIC_CARD_* → integrated.
 * Returns { dedicated?: boolean, model?: string }.
 */
function resolveGpu(attributes) {
  const ded = attrValue(findAttr(attributes, ATTRIBUTE_IDS.dedicatedGpu, ['tarjeta grafica dedicada', 'grafica dedicada']));
  if (ded && !EMPTY_GPU.test(ded.trim()) && !INTEGRATED_LOOKING.test(ded.trim())) {
    return { dedicated: true, model: ded };
  }
  const integ = attrValue(findAttr(attributes, ATTRIBUTE_IDS.integratedGpu, ['tarjeta grafica integrada', 'grafica integrada']));
  const generic = attrValue(findAttr(attributes, ATTRIBUTE_IDS.gpuGeneric, ['tarjeta grafica']));
  if (generic) {
    const g = generic.toLowerCase();
    if (/geforce|rtx|gtx|radeon (rx|pro)|nvidia|\bmx\d{3}|arc a\d/.test(g)) return { dedicated: true, model: generic };
    if (/integrad|iris|uhd|radeon graphics|vega|apple/.test(g)) return { dedicated: false, model: generic };
  }
  if (integ) return { dedicated: false, model: integ };
  if (generic) return { dedicated: undefined, model: generic };
  return { dedicated: undefined, model: undefined };
}

/**
 * @param {Array<Record<string, any>>} attributes
 * @returns {NotebookSpecs}
 */
export function normalizeSpecs(attributes) {
  const A = ATTRIBUTE_IDS;
  /** @type {NotebookSpecs} */
  const specs = {};

  specs.brand = attrValue(findAttr(attributes, A.brand, ['marca']));
  // line/model: id-only — the generic keywords "línea"/"modelo" collide with
  // "Línea del procesador" / "Modelo del procesador". These fields are cosmetic.
  specs.line = attrValue(findAttr(attributes, A.line));
  specs.model = attrValue(findAttr(attributes, A.model));

  specs.ramGb = toGb(attrNumber(findAttr(attributes, A.ram, ['memoria ram', 'ram'])));

  specs.processorBrand = attrValue(findAttr(attributes, A.processorBrand, ['marca del procesador']));
  specs.processorLine = attrValue(findAttr(attributes, A.processorLine, ['linea del procesador', 'familia del procesador']));
  const procModel = attrValue(findAttr(attributes, A.processorModel, ['modelo del procesador']));
  specs.processorTier = processorTier(specs.processorLine, procModel);

  specs.storageGb = toGb(attrNumber(findAttr(attributes, A.storageCapacity, ['capacidad de disco ssd', 'capacidad del disco', 'capacidad total de disco'])));
  specs.storageType = attrValue(findAttr(attributes, A.storageType, ['tipo de disco']));
  // Infer SSD when only the SSD capacity attribute is present.
  if (!specs.storageType && specs.storageGb && findAttr(attributes, ['SSD_DATA_STORAGE_CAPACITY', 'M2_DATA_STORAGE_CAPACITY'])) {
    specs.storageType = 'SSD';
  }

  const screen = attrNumber(findAttr(attributes, A.screenSize, ['tamano de la pantalla']));
  specs.screenInches = screen ? Math.round(screen.number * 10) / 10 : undefined;

  const gpu = resolveGpu(attributes);
  specs.gpuModel = gpu.model;
  specs.gpuDedicated = gpu.dedicated;

  specs.os = attrValue(findAttr(attributes, A.os, ['sistema operativo']));

  // ── Extra specs for comparisons ──
  const vram = attrNumber(findAttr(attributes, A.vram, ['memoria de video']));
  specs.vramGb = vram ? toGb(vram) : undefined;
  const refresh = attrNumber(findAttr(attributes, A.refreshRate, ['frecuencia de actualizacion']));
  specs.refreshHz = refresh ? Math.round(refresh.number) : undefined;
  const weight = attrNumber(findAttr(attributes, A.weight, ['peso']));
  if (weight) specs.weightKg = weight.unit === 'g' ? Math.round((weight.number / 1000) * 100) / 100 : Math.round(weight.number * 100) / 100;
  specs.ramType = attrValue(findAttr(attributes, A.ramType, ['tipo de memoria ram']));
  specs.resolution = attrValue(findAttr(attributes, A.resolution, ['tipo de resolucion']));
  const touch = attrValue(findAttr(attributes, A.touch, ['pantalla tactil']));
  if (touch) specs.touch = /^s[ií]|^yes|^true|^con/i.test(touch.trim());

  // Drop undefined keys for a clean object.
  for (const k of Object.keys(specs)) if (specs[k] === undefined) delete specs[k];
  return specs;
}

/** Short human spec line for cards, e.g. "Core i5 · 16GB · 512GB SSD · 15.6\"". */
export function specSummary(specs) {
  if (!specs) return '';
  const parts = [];
  if (specs.processorLine) parts.push(specs.processorLine);
  if (specs.ramGb) parts.push(`${specs.ramGb}GB RAM`);
  if (specs.storageGb) parts.push(`${specs.storageGb >= 1024 ? specs.storageGb / 1024 + 'TB' : specs.storageGb + 'GB'} ${specs.storageType ?? ''}`.trim());
  if (specs.screenInches) parts.push(`${specs.screenInches}"`);
  if (specs.gpuDedicated) parts.push('GPU dedicada');
  return parts.join(' · ');
}
