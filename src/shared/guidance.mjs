/**
 * Per-product buying guidance generated from specs (pure). Gives each product page
 * some unique, useful, keyword-relevant content for SEO + the listicle mini-reviews.
 */
import { gpuTier, isDedicatedGpu, GAMER_MIN_GPU_TIER } from './gpu.mjs';

/** Use cases this notebook is good for, e.g. ["Gaming","Programación"]. */
export function idealUses(specs, title = '') {
  const s = specs ?? {};
  const ram = s.ramGb ?? 0;
  const tier = s.processorTier ?? 0;
  const gpu = isDedicatedGpu(s, title);
  const gTier = gpuTier(s, title);
  const ssd = s.storageGb ?? 0;
  const screen = s.screenInches ?? 0;
  const tags = [];
  // "Gaming" solo con GPU de potencia real (≈RTX 3060/4050+); las placas de
  // entrada (MX, GTX 1650, RTX 3050) quedan como "juegos livianos".
  if (gTier >= GAMER_MIN_GPU_TIER && ram >= 16 && tier >= 5) tags.push('Gaming');
  else if (gpu && gTier >= 1 && ram >= 8) tags.push('Juegos livianos y esports');
  if (gpu && gTier >= 2 && tier >= 7) tags.push('Diseño y edición de video');
  if (ram >= 16 && tier >= 5) tags.push('Programación');
  if (ram >= 8 && ssd >= 256) tags.push('Estudio y oficina');
  if (ram >= 16) tags.push('Multitarea');
  if (screen && screen <= 14) tags.push('Portabilidad');
  if (ram <= 8 && !gpu) tags.push('Uso básico');
  return [...new Set(tags)].slice(0, 4);
}

/** Bullet-point strengths derived from specs. */
export function pros(specs, title = '') {
  const s = specs ?? {};
  const out = [];
  if (s.ramGb >= 16) out.push(`${s.ramGb} GB de RAM: aguanta multitarea pesada y muchas pestañas`);
  else if (s.ramGb) out.push(`${s.ramGb} GB de RAM`);
  if (s.storageGb) {
    const cap = s.storageGb >= 1024 ? `${s.storageGb / 1024} TB` : `${s.storageGb} GB`;
    const ssd = /ssd/i.test(s.storageType ?? '') ? ' SSD (arranca y abre programas rápido)' : '';
    out.push(`${cap} de almacenamiento${ssd}`);
  }
  if (isDedicatedGpu(s, title)) {
    const gTier = gpuTier(s, title);
    const claim = gTier >= GAMER_MIN_GPU_TIER
      ? 'corre juegos actuales en 1080p y edición exigente'
      : 'para juegos livianos/esports y aceleración de apps';
    out.push(`Placa de video dedicada${s.vramGb ? ` de ${s.vramGb} GB` : ''}: ${claim}`);
  }
  if (s.processorLine) out.push(`Procesador ${s.processorLine}${s.processorTier >= 7 ? ' (potente)' : ''}`);
  if (s.screenInches) out.push(`Pantalla de ${s.screenInches}"${s.refreshHz && s.refreshHz >= 120 ? ` a ${s.refreshHz} Hz` : ''}`);
  if (s.weightKg && s.weightKg <= 1.6) out.push(`Liviana (${s.weightKg} kg), cómoda para llevar`);
  return out;
}

/** One-line "ideal para…" sentence. */
export function idealForSentence(specs, title = '') {
  const uses = idealUses(specs, title);
  if (!uses.length) return 'Una notebook para tareas del día a día.';
  return `Ideal para ${uses.join(', ').toLowerCase()}.`;
}
