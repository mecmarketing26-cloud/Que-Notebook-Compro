/**
 * Comparison engine. Pure functions over the merged products (specs + price) that
 * power /comparar: a side-by-side spec table + human "por qué conviene una u otra"
 * verdicts per use case (gaming, trabajo/3D, multitarea, portabilidad, precio...).
 */

const fmtPrice = (n) => (n == null ? 's/d' : '$' + Number(n).toLocaleString('es-AR'));
const gb = (n) => (n == null ? '—' : n >= 1024 ? `${n / 1024} TB` : `${n} GB`);

/** Overall "power" score (use-agnostic), for value-for-money. */
function power(p) {
  const s = p.specs ?? {};
  return (
    (s.processorTier ?? 0) * 1.4 +
    Math.min(s.ramGb ?? 0, 64) / 8 +
    Math.min(s.storageGb ?? 0, 2048) / 512 +
    (s.gpuDedicated ? 4 + (s.vramGb ?? 0) : 0) +
    (s.refreshHz && s.refreshHz >= 120 ? 1 : 0)
  );
}

/** id of the product maximizing fn (or minimizing if dir=-1); needs a clear winner. */
function leader(products, fn, dir = 1) {
  let best = null;
  let bestV = -Infinity;
  let tie = false;
  for (const p of products) {
    const raw = fn(p);
    if (raw == null || Number.isNaN(raw)) continue;
    const v = raw * dir;
    if (v > bestV) {
      bestV = v;
      best = p;
      tie = false;
    } else if (v === bestV) tie = true;
  }
  return tie ? null : best; // null when everyone ties (no meaningful winner)
}

/** Spec table rows: one per dimension, marking the best value(s). */
export function compareRows(products) {
  const def = [
    { key: 'brand', label: 'Marca', get: (s) => s.brand, fmt: (v) => v ?? '—' },
    { key: 'processorLine', label: 'Procesador', get: (s) => s.processorLine, fmt: (v) => v ?? '—', bestBy: (s) => s.processorTier },
    { key: 'ramGb', label: 'RAM', get: (s) => s.ramGb, fmt: gb, bestBy: (s) => s.ramGb },
    { key: 'storageGb', label: 'Almacenamiento', get: (s) => s.storageGb, fmt: (v, s) => (v ? `${gb(v)} ${s.storageType ?? ''}`.trim() : '—'), bestBy: (s) => s.storageGb },
    { key: 'gpu', label: 'Placa de video', get: (s) => (s.gpuModel ? s.gpuModel : s.gpuDedicated ? 'Dedicada' : 'Integrada'), fmt: (v) => v ?? '—', bestBy: (s) => (s.gpuDedicated ? 10 + (s.vramGb ?? 0) : 0) },
    { key: 'vramGb', label: 'Memoria de video', get: (s) => s.vramGb, fmt: gb, bestBy: (s) => s.vramGb },
    { key: 'screen', label: 'Pantalla', get: (s) => s.screenInches, fmt: (v) => (v ? `${v}"` : '—') },
    { key: 'refreshHz', label: 'Refresco', get: (s) => s.refreshHz, fmt: (v) => (v ? `${v} Hz` : '—'), bestBy: (s) => s.refreshHz },
    { key: 'weightKg', label: 'Peso', get: (s) => s.weightKg, fmt: (v) => (v ? `${v} kg` : '—'), bestBy: (s) => (s.weightKg ? -s.weightKg : null) },
    { key: 'os', label: 'Sistema operativo', get: (s) => s.os, fmt: (v) => v ?? '—' },
    { key: 'price', label: 'Precio (desde)', get: (p) => p.price, fmt: fmtPrice, onProduct: true, bestBy: (p) => (p.price ? -p.price : null), bestOnProduct: true },
  ];

  return def.map((row) => {
    // best value(s) for highlighting
    let bestVal = null;
    const scoreOf = (p) => (row.bestOnProduct ? row.bestBy?.(p) : row.bestBy?.(p.specs ?? {}));
    if (row.bestBy) {
      for (const p of products) {
        const v = scoreOf(p);
        if (v != null && !Number.isNaN(v) && (bestVal == null || v > bestVal)) bestVal = v;
      }
    }
    const cells = products.map((p) => {
      const s = p.specs ?? {};
      const display = row.onProduct ? row.fmt(p.price, s) : row.fmt(row.get(s), s);
      const isBest = row.bestBy && bestVal != null && scoreOf(p) === bestVal && products.length > 1;
      return { id: p.id, display, best: Boolean(isBest) };
    });
    return { label: row.label, cells };
  });
}

/** Human verdicts: which notebook is preferable for what, and why. */
export function compareVerdicts(products) {
  if (products.length < 2) return [];
  const name = (p) => (p?.title ?? '').replace(/\s+/g, ' ').slice(0, 48);
  const verdicts = [];

  // 🎮 Gaming
  const gamer = leader(products, (p) => (p.specs?.gpuDedicated ? 100 + (p.specs.vramGb ?? 0) * 5 + (p.specs.refreshHz ?? 0) / 10 : 0));
  if (gamer && gamer.specs?.gpuDedicated) {
    const s = gamer.specs;
    const bits = [];
    if (s.gpuModel) bits.push(`placa dedicada ${s.gpuModel}`);
    else bits.push('placa de video dedicada');
    if (s.vramGb) bits.push(`${s.vramGb} GB de video`);
    if (s.refreshHz && s.refreshHz >= 120) bits.push(`pantalla de ${s.refreshHz} Hz`);
    verdicts.push({ icon: '🎮', title: 'Para jugar', winner: name(gamer), why: `Tiene ${bits.join(', ')}: corre mejor los juegos exigentes que las demás.` });
  }

  // 🎬 Diseño / edición / 3D (CPU + RAM + GPU)
  const creator = leader(products, (p) => {
    const s = p.specs ?? {};
    return (s.processorTier ?? 0) * 2 + Math.min(s.ramGb ?? 0, 64) / 4 + (s.gpuDedicated ? 4 + (s.vramGb ?? 0) : 0);
  });
  if (creator) {
    const s = creator.specs ?? {};
    const bits = [];
    if (s.processorLine) bits.push(`procesador ${s.processorLine}`);
    if (s.ramGb) bits.push(`${s.ramGb} GB de RAM`);
    if (s.gpuDedicated) bits.push('GPU dedicada');
    verdicts.push({ icon: '🎬', title: 'Para diseño / edición / 3D', winner: name(creator), why: `${bits.join(', ')}: maneja mejor render, edición de video y modelado 3D.` });
  }

  // 🧠 Multitarea / oficina (RAM + CPU)
  const multi = leader(products, (p) => Math.min(p.specs?.ramGb ?? 0, 64) * 2 + (p.specs?.processorTier ?? 0));
  if (multi) {
    const s = multi.specs ?? {};
    verdicts.push({ icon: '🧠', title: 'Para multitarea y oficina', winner: name(multi), why: `Con ${s.ramGb ?? '—'} GB de RAM aguanta más programas y pestañas abiertas sin trabarse.` });
  }

  // 🎒 Portabilidad (peso / pantalla chica)
  const portable = leader(products, (p) => {
    const s = p.specs ?? {};
    if (s.weightKg == null && s.screenInches == null) return null;
    return -((s.weightKg ?? (s.screenInches ?? 15) / 8) + (s.screenInches ?? 15) / 20);
  });
  if (portable) {
    const s = portable.specs ?? {};
    const bits = [];
    if (s.weightKg) bits.push(`pesa ${s.weightKg} kg`);
    if (s.screenInches) bits.push(`pantalla de ${s.screenInches}"`);
    verdicts.push({ icon: '🎒', title: 'Para llevar a todos lados', winner: name(portable), why: `${bits.join(', ')}: es la más cómoda para transportar.` });
  }

  // 💾 Almacenamiento
  const storage = leader(products, (p) => p.specs?.storageGb);
  if (storage && storage.specs?.storageGb) {
    verdicts.push({ icon: '💾', title: 'Más espacio', winner: name(storage), why: `${gb(storage.specs.storageGb)} de almacenamiento, para guardar más archivos, juegos y proyectos.` });
  }

  // 💸 Precio
  const cheapest = leader(products, (p) => p.price, -1);
  if (cheapest && cheapest.price != null) {
    verdicts.push({ icon: '💸', title: 'La más barata', winner: name(cheapest), why: `Arranca en ${fmtPrice(cheapest.price)}, el precio más bajo del grupo.` });
  }

  // ⚖️ Relación precio / potencia
  const value = leader(products, (p) => (p.price ? power(p) / (p.price / 1_000_000) : null));
  if (value && products.length > 2) {
    verdicts.push({ icon: '⚖️', title: 'Mejor relación precio/potencia', winner: name(value), why: 'Es la que más specs te da por cada peso que gastás.' });
  }

  return verdicts;
}

export function buildComparison(products) {
  return { rows: compareRows(products), verdicts: compareVerdicts(products) };
}
