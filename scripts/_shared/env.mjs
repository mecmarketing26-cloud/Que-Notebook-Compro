/**
 * Env access for the Node jobs. Run scripts via the npm aliases so Node loads
 * the .env file:  `node --env-file=.env scripts/<name>.mjs` (see package.json).
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Project root = astro-site/ (this file lives in scripts/_shared/).
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA_DIR = resolve(ROOT, 'data');

/** Read an env var or throw a clear, actionable error. */
export function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')}.\n` +
        `Completalas en astro-site/.env (ver .env.example) y corré el script con npm (que carga --env-file=.env).`,
    );
  }
  return Object.fromEntries(names.map((n) => [n, process.env[n]]));
}

export function getEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}
