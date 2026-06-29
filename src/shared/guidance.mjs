/**
 * Per-product buying guidance generated from specs (pure). Gives each product page
 * some unique, useful, keyword-relevant content for SEO + the listicle mini-reviews.
 */

/** Use cases this notebook is good for, e.g. ["Gaming","Programación"]. */
export function idealUses(specs) {
  const s = specs ?? {};
  const ram = s.ramGb ?? 0;
  const tier = s.processorTier ?? 0;
  const gpu = s.gpuDedicated === true;
  const ssd = s.storageGb ?? 0;
  const screen = s.screenInches ?? 0;
  const tags = [];
  if (gpu && ram >= 16 && tier >= 5) tags.push('Gaming');
  if (gpu && tier >= 7) tags.push('Diseño y edición de video');
  if (ram >= 16 && tier >= 5) tags.push('Programación');
  if (ram >= 8 && ssd >= 256) tags.push('Estudio y oficina');
  if (ram >= 16) tags.push('Multitarea');
  if (screen && screen <= 14) tags.push('Portabilidad');
  if (ram <= 8 && !gpu) tags.push('Uso básico');
  return [...new Set(tags)].slice(0, 4);
}

/** Bullet-point strengths derived from specs. */
export function pros(specs) {
  const s = specs ?? {};
  const out = [];
  if (s.ramGb >= 16) out.push(`${s.ramGb} GB de RAM: aguanta multitarea pesada y muchas pestañas`);
  else if (s.ramGb) out.push(`${s.ramGb} GB de RAM`);
  if (s.storageGb) {
    const cap = s.storageGb >= 1024 ? `${s.storageGb / 1024} TB` : `${s.storageGb} GB`;
    const ssd = /ssd/i.test(s.storageType ?? '') ? ' SSD (arranca y abre programas rápido)' : '';
    out.push(`${cap} de almacenamiento${ssd}`);
  }
  if (s.gpuDedicated) out.push(`Placa de video dedicada${s.vramGb ? ` de ${s.vramGb} GB` : ''}: corre juegos y edición exigente`);
  if (s.processorLine) out.push(`Procesador ${s.processorLine}${s.processorTier >= 7 ? ' (potente)' : ''}`);
  if (s.screenInches) out.push(`Pantalla de ${s.screenInches}"${s.refreshHz && s.refreshHz >= 120 ? ` a ${s.refreshHz} Hz` : ''}`);
  if (s.weightKg && s.weightKg <= 1.6) out.push(`Liviana (${s.weightKg} kg), cómoda para llevar`);
  return out;
}

/** One-line "ideal para…" sentence. */
export function idealForSentence(specs) {
  const uses = idealUses(specs);
  if (!uses.length) return 'Una notebook para tareas del día a día.';
  return `Ideal para ${uses.join(', ').toLowerCase()}.`;
}
