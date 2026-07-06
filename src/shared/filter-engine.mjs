/**
 * THE single filter engine (brief §9). Both quiz branches and the spec-browser
 * produce the same NotebookFilters object and feed it here. Pure functions over
 * an in-memory product set — no I/O.
 *
 * @typedef {Object} NotebookFilters
 * @property {number} [priceMin]
 * @property {number} [priceMax]
 * @property {number} [ramMinGb]
 * @property {number} [processorMinTier]   // 3 / 5 / 7 / 9
 * @property {number} [storageMinGb]
 * @property {number} [screenMin]          // inches
 * @property {number} [screenMax]          // inches
 * @property {'required'|'preferred'|'any'} [gpuDedicated]
 * @property {number} [gpuMinTier]         // piso de GPU real (gpu.mjs; 3 = gamer)
 * @property {'windows'|'mac'|'linux'} [os]
 * @property {'relevance'|'price_asc'|'price_desc'} [sort]
 *
 * Each product is expected to look like: { id, price, specs: NotebookSpecs, ... }
 */
import { gpuTier, isDedicatedGpu } from './gpu.mjs';

/** Family of a product by OS/brand — 'mac' | 'chrome' | 'other'. */
export function osFamily(product) {
  const s = product.specs ?? {};
  const brand = (s.brand ?? '').toLowerCase();
  const os = (s.os ?? '').toLowerCase();
  const title = (product.title ?? '').toLowerCase();
  if (brand.includes('apple') || title.includes('macbook') || os.includes('mac') || os.includes('os x')) return 'mac';
  if (os.includes('chrome') || title.includes('chromebook')) return 'chrome';
  return 'other';
}

/** Does a product satisfy a chosen OS preference? Linux ≈ equipos sin Windows
 *  (FreeDOS / sin sistema / Ubuntu), que es lo que ofrece ML para "libre". */
export function matchesOs(product, os) {
  if (!os) return true;
  const fam = osFamily(product);
  if (os === 'mac') return fam === 'mac';
  if (os === 'windows') {
    const o = (product.specs?.os ?? '').toLowerCase();
    if (fam === 'mac' || fam === 'chrome') return false;
    // acepta Windows explícito o sin dato (la mayoría del catálogo es Windows)
    return o === '' || o.includes('windows');
  }
  if (os === 'linux') {
    const o = (product.specs?.os ?? '').toLowerCase();
    return o.includes('linux') || o.includes('ubuntu') || o.includes('freedos') || o.includes('free dos') || o.includes('sin sistema') || o.includes('without');
  }
  return true;
}

/** Spec-only predicate (ignores price) — used to pre-filter live candidates
 *  before we know their price (price needs an extra API call). */
export function matchesSpecs(product, f) {
  const s = product.specs ?? {};
  if (f.ramMinGb != null && !(s.ramGb >= f.ramMinGb)) return false;
  if (f.processorMinTier != null && !(s.processorTier >= f.processorMinTier)) return false;
  if (f.storageMinGb != null && !(s.storageGb >= f.storageMinGb)) return false;
  if (f.screenMin != null && !(s.screenInches >= f.screenMin)) return false;
  if (f.screenMax != null && !(s.screenInches <= f.screenMax)) return false;
  // isDedicatedGpu corrige el flag de ML (una Radeon 780M cargada como
  // "dedicada" no pasa); gpuMinTier exige potencia real (3 = piso gamer).
  if (f.gpuDedicated === 'required' && !isDedicatedGpu(s, product.title)) return false;
  if (f.gpuMinTier != null && gpuTier(s, product.title) < f.gpuMinTier) return false;
  if (f.os && !matchesOs(product, f.os)) return false;
  return true;
}

/** Hard predicate: does a product satisfy every *required* constraint in `f`? */
export function matches(product, f) {
  const price = product.price;
  if (f.priceMin != null && (price == null || price < f.priceMin)) return false;
  if (f.priceMax != null && (price == null || price > f.priceMax)) return false;
  return matchesSpecs(product, f);
}

/** Relevance score for ranking. Higher = better fit. */
export function score(product, f) {
  const s = product.specs ?? {};
  let pts = 0;

  if (s.ramGb) pts += Math.min(s.ramGb, 64) / 8; // up to ~8
  if (s.processorTier) pts += s.processorTier; // up to 9
  if (s.storageGb) pts += Math.min(s.storageGb, 2048) / 256; // up to ~8

  // Reward GPU power (not just "has one") when the user wants/prefers it:
  // así una RTX 4070 rankea sobre una 3050 y una MX450 no suma casi nada.
  if (f.gpuDedicated === 'preferred' || f.gpuDedicated === 'required' || f.gpuMinTier != null) {
    if (isDedicatedGpu(s, product.title)) pts += 4 + gpuTier(s, product.title);
  }

  // Completeness bonus: prefer items we actually have specs for (cleaner cards).
  const known = ['ramGb', 'processorTier', 'storageGb', 'screenInches'].filter((k) => s[k] != null).length;
  pts += known * 0.5;

  return pts;
}

/**
 * "Valor" = relación precio-calidad. Capacidad ÚTIL (con techos, para que el
 * exceso de specs no gane siempre) dividida por el precio en millones de ARS.
 * Así una notebook que cumple de sobra a $1.3M le gana a una workstation de $6.8M
 * para el mismo uso. Se usa en los atajos "Por uso" del home (sort: 'value').
 */
export function valueScore(product, f = {}) {
  const s = product.specs ?? {};
  const price = product.price;
  if (price == null || price <= 0) return -Infinity; // sin precio no hay "valor" medible
  let cap = 0;
  cap += Math.min(s.ramGb ?? 0, 32) / 8; // hasta 4
  cap += Math.min(s.processorTier ?? 0, 9); // hasta 9
  cap += Math.min(s.storageGb ?? 0, 1024) / 256; // hasta 4
  if (f.gpuDedicated === 'preferred' || f.gpuDedicated === 'required' || f.gpuMinTier != null) {
    if (isDedicatedGpu(s, product.title)) cap += 2 + Math.min(gpuTier(s, product.title), 6);
  }
  const known = ['ramGb', 'processorTier', 'storageGb', 'screenInches'].filter((k) => s[k] != null).length;
  cap += known * 0.5;
  return cap / (price / 1_000_000);
}

function sortProducts(list, f) {
  const sorted = [...list];
  if (f.sort === 'price_asc') {
    sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  } else if (f.sort === 'price_desc') {
    sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  } else if (f.sort === 'value') {
    sorted.sort((a, b) => valueScore(b, f) - valueScore(a, f));
  } else {
    sorted.sort((a, b) => score(b, f) - score(a, f));
  }
  return sorted;
}

/** Hard-filter + sort (no relaxation). */
export function filterNotebooks(products, f = {}) {
  return sortProducts(products.filter((p) => matches(p, f)), f);
}

/**
 * Ordered relaxation steps (brief §9: "empezar por aflojar GPU, luego RAM, etc.").
 * Each returns a *new* filters object with one constraint loosened, or null if
 * there's nothing left to loosen at that step.
 */
// Spec relaxations (never touch price). GPU first, then storage, RAM, CPU, screen.
const SPEC_RELAX_STEPS = [
  // El piso de GPU se afloja primero (a "gaming liviano") y recién después se suelta.
  (f) => (f.gpuMinTier != null && f.gpuMinTier > 2 ? { ...f, gpuMinTier: 2 } : null),
  (f) => (f.gpuMinTier != null ? omit(f, 'gpuMinTier') : null),
  (f) => (f.gpuDedicated === 'required' ? { ...f, gpuDedicated: 'preferred' } : null),
  (f) => (f.gpuDedicated === 'preferred' ? { ...f, gpuDedicated: 'any' } : null),
  (f) => (f.storageMinGb != null ? omit(f, 'storageMinGb') : null),
  (f) => (f.ramMinGb > 8 ? { ...f, ramMinGb: 8 } : null),
  (f) => (f.ramMinGb != null ? omit(f, 'ramMinGb') : null),
  (f) => (f.processorMinTier > 3 ? { ...f, processorMinTier: f.processorMinTier - 2 } : null),
  (f) => (f.processorMinTier != null ? omit(f, 'processorMinTier') : null),
  (f) => (f.screenMin != null || f.screenMax != null ? omit(omit(f, 'screenMin'), 'screenMax') : null),
];

// Price relaxations — LAST resort, only when the user did NOT pin a budget.
const PRICE_RELAX_STEPS = [
  (f) => (f.priceMax != null ? { ...f, priceMax: Math.round(f.priceMax * 1.25) } : null),
  (f) => (f.priceMin != null ? omit(f, 'priceMin') : null),
];

function omit(obj, key) {
  const { [key]: _, ...rest } = obj;
  return rest;
}

/**
 * Quiz/browse entry point. Hard-filter; if fewer than `min` matches, progressively
 * relax constraints in the §9 order until we have enough (or run out of steps).
 *
 * @returns {{ products: any[], relaxed: boolean }}
 */
export function recommend(products, filters = {}, { min = 3, max = 5, hardPrice = false } = {}) {
  let f = { ...filters };
  let relaxed = false;

  // When the user did NOT pin a budget: if a use-case quality floor (priceMin)
  // exceeds the chosen ceiling, honor the floor and flag relaxed. When the user
  // DID pin a budget (hardPrice), we respect the range as-is (no price changes).
  if (!hardPrice && f.priceMin != null && f.priceMax != null && f.priceMin >= f.priceMax) {
    f = omit(f, 'priceMax');
    relaxed = true;
  }

  const steps = hardPrice ? SPEC_RELAX_STEPS : [...SPEC_RELAX_STEPS, ...PRICE_RELAX_STEPS];
  let results = filterNotebooks(products, f);

  for (let i = 0; i < steps.length && results.length < min; i++) {
    const next = steps[i](f);
    if (!next) continue;
    f = next;
    relaxed = true;
    results = filterNotebooks(products, f);
  }

  return { products: results.slice(0, max), relaxed, filters: f };
}

/**
 * "Similares" para el estado vacío: cuando NO hay nada en el rango de precio
 * pedido, devolvemos las notebooks más cercanas por precio que sí cumplen el
 * resto (specs + OS), ignorando el rango de precio. El front muestra "no hay en
 * ese precio, pero mirá estas".
 */
export function similarByPrice(products, filters = {}, { max = 6 } = {}) {
  const f = omit(omit({ ...filters }, 'priceMin'), 'priceMax');
  const target = filters.priceMax ?? filters.priceMin ?? 0;
  const pool = products.filter((p) => matchesSpecs(p, f) && p.price != null);
  pool.sort((a, b) => Math.abs((a.price ?? 0) - target) - Math.abs((b.price ?? 0) - target));
  return pool.slice(0, max);
}
