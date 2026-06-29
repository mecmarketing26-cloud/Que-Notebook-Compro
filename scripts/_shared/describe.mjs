/**
 * Description generation (brief §7). Produces a short, original, decision-helping
 * blurb in neutral rioplatense Spanish from a notebook's normalized specs.
 *
 * Uses the Anthropic API if ANTHROPIC_API_KEY is set; otherwise falls back to a
 * deterministic spec-driven template (no external call, no extra dependency).
 * Generated once per item, then persisted and reused.
 */
import { getEnv } from './env.mjs';
import { specSummary } from '../../src/shared/attributes.mjs';

function usageProfile(s) {
  const ram = s.ramGb ?? 0;
  const tier = s.processorTier ?? 0;
  const gpu = s.gpuDedicated === true;
  if (gpu && ram >= 16 && tier >= 5) return 'gaming_edicion';
  if (ram >= 16 && tier >= 7) return 'potencia';
  if (ram >= 16) return 'multitarea';
  if (ram >= 8 && s.storageGb) return 'estudio_oficina';
  return 'basico';
}

const PROFILE_COPY = {
  gaming_edicion:
    'Tiene potencia de sobra para juegos exigentes y edición de video o fotos pesadas.',
  potencia:
    'Pensada para tareas exigentes: programación, edición y correr varios programas a la vez sin que se trabe.',
  multitarea:
    'Aguanta multitarea sin drama: ideal para trabajar con muchas pestañas, planillas y aplicaciones abiertas.',
  estudio_oficina:
    'Ideal para estudio y oficina: navegar, escribir, videollamadas y multitarea liviana con buena fluidez.',
  basico:
    'Cumple para lo básico del día a día: navegar, Netflix, documentos y tareas livianas.',
};

/** Deterministic template fallback. */
export function templateDescription(specs) {
  const s = specs ?? {};
  const summary = specSummary(s);
  const profile = PROFILE_COPY[usageProfile(s)];
  const ssd =
    s.storageType && /ssd/i.test(s.storageType)
      ? 'El SSD ayuda a que arranque y abra los programas rápido.'
      : '';
  const portab =
    s.screenInches && s.screenInches <= 14
      ? 'Por su tamaño es cómoda para llevar a todos lados.'
      : '';
  return [profile, ssd, portab, summary && `En resumen: ${summary}.`]
    .filter(Boolean)
    .join(' ')
    .trim();
}

/** Anthropic Messages API call (only when ANTHROPIC_API_KEY is present). */
async function anthropicDescription(specs, title) {
  const apiKey = getEnv('ANTHROPIC_API_KEY');
  const model = getEnv('ANTHROPIC_MODEL', 'claude-sonnet-4-6');

  const prompt =
    `Escribí una descripción ORIGINAL de 2 a 4 oraciones, en español rioplatense neutro, ` +
    `para ayudar a alguien a decidir si esta notebook le sirve. No copies el título ni texto del vendedor; ` +
    `enfocate en para qué tipo de uso conviene (estudio, oficina, gaming, edición, programación, uso básico) ` +
    `según las specs. No menciones precio ni stock. Devolvé SOLO el texto, sin comillas.\n\n` +
    `Specs: ${JSON.stringify(specs)}\n` +
    `(Título de referencia, NO copiar: ${title ?? 'n/d'})`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  }
  const text = json?.content?.find?.((b) => b.type === 'text')?.text?.trim();
  if (!text) throw new Error('Anthropic devolvió una respuesta vacía');
  return text;
}

/**
 * Generate a description for one notebook. Falls back to the template if there's
 * no API key or the API call fails.
 * @returns {Promise<{ text:string, source:'anthropic'|'template' }>}
 */
export async function generateDescription(specs, title) {
  if (getEnv('ANTHROPIC_API_KEY')) {
    try {
      return { text: await anthropicDescription(specs, title), source: 'anthropic' };
    } catch (err) {
      console.warn(`  ⚠️  Anthropic falló (${err.message}); uso plantilla.`);
    }
  }
  return { text: templateDescription(specs), source: 'template' };
}
