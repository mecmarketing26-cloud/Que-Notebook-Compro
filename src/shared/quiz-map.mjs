/**
 * Quiz translation (brief §9), tuned with realistic Argentine notebook prices
 * (mid-2026 reference, in ARS). Two branches converge on ONE internal
 * NotebookFilters object:
 *   - Branch A ("sé lo que busco")  -> answers map directly to spec filters.
 *   - Branch B ("no tengo idea")    -> plain-language answers map via the table.
 *
 * Each use case carries a **price floor** (`priceMin`): below it you only find
 * hardware that can't do the job decently (a "gaming" notebook under ~$1.000.000
 * won't run nada mínimamente pasable), so we don't show those. If the chosen
 * budget ceiling is below a use-case floor, the engine honors the floor and
 * flags the result as relaxed (filter-engine.mjs).
 *
 * Pure data + pure functions. The option *values* below are the source of truth;
 * the visible labels live in src/data/copy.ts and must reuse these same values.
 */

// Shared budget buckets (ARS). Prices are volatile — treat as reference.
export const BUDGETS = {
  hasta_400k: { priceMax: 400_000 },
  '400k_700k': { priceMin: 400_000, priceMax: 700_000 },
  '700k_1200k': { priceMin: 700_000, priceMax: 1_200_000 },
  '1200k_2000k': { priceMin: 1_200_000, priceMax: 2_000_000 },
  mas_2000k: { priceMin: 2_000_000 },
};

// ── Branch A: technical answers -> partial filters ────────────────────────────
const A = {
  presupuesto: BUDGETS,
  ram: {
    '8': { ramMinGb: 8 },
    '16': { ramMinGb: 16 },
    '32': { ramMinGb: 32 },
  },
  procesador: {
    i3: { processorMinTier: 3 },
    i5: { processorMinTier: 5 },
    i7: { processorMinTier: 7 },
    i9: { processorMinTier: 9 },
  },
  almacenamiento: {
    '256': { storageMinGb: 256 },
    '512': { storageMinGb: 512 },
    '1024': { storageMinGb: 1024 },
  },
  pantalla: {
    '13_14': { screenMin: 13, screenMax: 14.5 },
    '15_16': { screenMin: 15, screenMax: 16.4 },
    '17': { screenMin: 16.5 },
  },
  gpu: {
    si: { gpuDedicated: 'required' },
    no: { gpuDedicated: 'any' },
    igual: { gpuDedicated: 'any' },
  },
};

// ── Branch B: plain-language answers -> precise filters (with price floors) ────
const B = {
  uso: {
    // Estudio/oficina: 8 GB + SSD alcanza; piso para evitar los Celeron 4 GB lentos.
    estudio: { ramMinGb: 8, storageMinGb: 256, gpuDedicated: 'any', priceMin: 450_000 },
    // Diseño/edición de video: CPU fuerte, 16 GB, SSD grande y GPU deseable.
    diseno: { ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, gpuDedicated: 'preferred', priceMin: 1_200_000 },
    // Gaming: GPU dedicada sí o sí + 16 GB. Piso real $1.000.000.
    gaming: { ramMinGb: 16, gpuDedicated: 'required', processorMinTier: 5, storageMinGb: 512, priceMin: 1_000_000 },
    // Programación: 16 GB y SSD ≥512 para compilar/correr sin trabarse.
    programacion: { ramMinGb: 16, storageMinGb: 512, processorMinTier: 5, priceMin: 800_000 },
    // Uso básico: lo más barato que ande bien.
    basico: { ramMinGb: 8, gpuDedicated: 'any', priceMin: 300_000, sort: 'price_asc' },
  },
  movilidad: {
    viaja: { screenMin: 13, screenMax: 14.5 }, // la llevo a todos lados -> chica/liviana
    casa: { screenMin: 15 }, // queda en casa -> pantalla grande
    igual: {},
  },
  potencia: {
    vuele: { ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, priceMin: 1_100_000 },
    equilibrado: { ramMinGb: 16, processorMinTier: 5, priceMin: 800_000 },
    economico: { sort: 'price_asc' }, // requisitos mínimos + ordenar por precio
  },
  juegos: {
    pesados: { gpuDedicated: 'required', ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, priceMin: 1_300_000 },
    livianos: { gpuDedicated: 'preferred', ramMinGb: 8, priceMin: 700_000 },
    no: {},
  },
  presupuesto: BUDGETS,
};

const GPU_RANK = { any: 0, preferred: 1, required: 2 };
const GPU_BY_RANK = ['any', 'preferred', 'required'];

/** Merge partial filters; tighter constraint wins on each field. */
export function mergeFilters(...partials) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const p of partials) {
    if (!p) continue;
    for (const [k, v] of Object.entries(p)) {
      if (v == null) continue;
      if (['ramMinGb', 'processorMinTier', 'storageMinGb', 'screenMin', 'priceMin'].includes(k)) {
        out[k] = out[k] == null ? v : Math.max(out[k], v); // strictest minimum
      } else if (['screenMax', 'priceMax'].includes(k)) {
        out[k] = out[k] == null ? v : Math.min(out[k], v); // tightest maximum
      } else if (k === 'gpuDedicated') {
        out[k] = GPU_BY_RANK[Math.max(GPU_RANK[out[k]] ?? 0, GPU_RANK[v] ?? 0)];
      } else {
        out[k] = v; // sort, etc. -> last wins
      }
    }
  }
  return out;
}

function resolveBranch(table, answers) {
  const partials = [];
  for (const [question, value] of Object.entries(answers ?? {})) {
    const map = table[question];
    if (!map) continue;
    const partial = map[value];
    if (partial) partials.push(partial);
  }
  return mergeFilters(...partials);
}

/**
 * @param {'A'|'B'} branch
 * @param {Record<string,string>} answers - { questionId: optionValue }
 * @returns {import('./filter-engine.mjs').NotebookFilters}
 */
export function answersToFilters(branch, answers) {
  return resolveBranch(branch === 'A' ? A : B, answers);
}

// ── Quiz v2 (single route: modo → OS → rama) ──────────────────────────────────
// Rangos de presupuesto pedidos por el usuario. "sin_limite" = sin tope de precio.
export const BUDGET_RANGES = {
  hasta_700k: { priceMax: 700_000 },
  '700k_1m': { priceMin: 700_000, priceMax: 1_000_000 },
  '1m_2m': { priceMin: 1_000_000, priceMax: 2_000_000 },
  '2m_4m': { priceMin: 2_000_000, priceMax: 4_000_000 },
  sin_limite: {},
};

const OS_MAP = {
  windows: { os: 'windows' },
  mac: { os: 'mac' },
  linux: { os: 'linux' },
  '': {}, // me da igual
};

// Rama guiada: por uso (sin pisos de precio — el presupuesto manda).
const USO_MAP = {
  gaming: { gpuDedicated: 'required', ramMinGb: 16, processorMinTier: 5 },
  estudio: { ramMinGb: 8, storageMinGb: 256 },
  diseno: { ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, gpuDedicated: 'preferred' },
  programacion: { ramMinGb: 16, storageMinGb: 512, processorMinTier: 5 },
  basico: { ramMinGb: 8, sort: 'price_asc' },
  altagama: { ramMinGb: 16, processorMinTier: 7, sort: 'price_desc' },
};

const PRIORIDAD_MAP = {
  potencia: { processorMinTier: 7, gpuDedicated: 'preferred' },
  bateria: {}, // sin spec de batería en ML; preferencia neutral
  precio: { sort: 'price_asc' },
  portatil: { screenMin: 13, screenMax: 14.5 },
};

const MACLINE_MAP = {
  air: {},
  pro: { processorMinTier: 7 },
  cualquiera: {},
};

const TAMANO_MAP = {
  chica: { screenMin: 13, screenMax: 14.5 },
  media: { screenMin: 15, screenMax: 16.4 },
  grande: { screenMin: 16.5 },
};

// Rama técnica.
const RAM_MAP = { '8': { ramMinGb: 8 }, '16': { ramMinGb: 16 }, '32': { ramMinGb: 32 } };
const PROC_MAP = { i3: { processorMinTier: 3 }, i5: { processorMinTier: 5 }, i7: { processorMinTier: 7 }, i9: { processorMinTier: 9 } };
const ALM_MAP = { '256': { storageMinGb: 256 }, '512': { storageMinGb: 512 }, '1024': { storageMinGb: 1024 } };
const GPU_MAP = { si: { gpuDedicated: 'required' }, no: { gpuDedicated: 'any' }, igual: { gpuDedicated: 'any' } };

const PICK_TABLE = {
  os: OS_MAP,
  uso: USO_MAP,
  prioridad: PRIORIDAD_MAP,
  macline: MACLINE_MAP,
  tamano: TAMANO_MAP,
  ram: RAM_MAP,
  procesador: PROC_MAP,
  almacenamiento: ALM_MAP,
  gpu: GPU_MAP,
  presupuesto: BUDGET_RANGES,
};

/**
 * Mapea las respuestas del quiz v2 ({ modo, os, uso, ... }) a NotebookFilters.
 * `modo` no es un filtro (solo decide el flujo de preguntas).
 * @param {Record<string,string>} picks
 */
export function quizPicksToFilters(picks) {
  const partials = [];
  for (const [k, v] of Object.entries(picks ?? {})) {
    if (k === 'modo') continue;
    const map = PICK_TABLE[k];
    if (map && map[v] !== undefined) partials.push(map[v]);
  }
  return mergeFilters(...partials);
}

/** ¿El usuario fijó un presupuesto acotado (no "sin límite")? → precio duro. */
export function hasPinnedBudget(picks) {
  return Boolean(picks?.presupuesto && picks.presupuesto !== 'sin_limite');
}

// Extra homepage shortcuts that aren't a plain "uso".
const QUICK_PICKS_EXTRA = {
  premium: { ramMinGb: 16, processorMinTier: 7, priceMin: 1_500_000, sort: 'price_desc' },
};

/** Resolve a homepage quick-pick (a `uso` key or an extra like "premium"). */
export function quickPickFilters(key) {
  if (B.uso[key]) return { ...B.uso[key] };
  if (QUICK_PICKS_EXTRA[key]) return { ...QUICK_PICKS_EXTRA[key] };
  return {};
}

/** Resolve a single use-case (for the homepage quick picks). */
export function useCaseFilters(uso) {
  return B.uso[uso] ? { ...B.uso[uso] } : {};
}

/** Serialize filters to compact URL query params (for the shareable /resultado page). */
export function filtersToQuery(filters) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v != null) q.set(k, String(v));
  return q.toString();
}

/** Parse URL query params back into a typed NotebookFilters object. */
export function queryToFilters(searchParams) {
  const num = (k) => (searchParams.has(k) ? Number(searchParams.get(k)) : undefined);
  /** @type {import('./filter-engine.mjs').NotebookFilters} */
  const f = {
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    ramMinGb: num('ramMinGb'),
    processorMinTier: num('processorMinTier'),
    storageMinGb: num('storageMinGb'),
    screenMin: num('screenMin'),
    screenMax: num('screenMax'),
  };
  const gpu = searchParams.get('gpuDedicated');
  if (gpu === 'required' || gpu === 'preferred' || gpu === 'any') f.gpuDedicated = gpu;
  const os = searchParams.get('os');
  if (os === 'windows' || os === 'mac' || os === 'linux') f.os = os;
  const sort = searchParams.get('sort');
  if (sort === 'price_asc' || sort === 'price_desc' || sort === 'relevance') f.sort = sort;
  for (const k of Object.keys(f)) if (f[k] === undefined) delete f[k];
  return f;
}
