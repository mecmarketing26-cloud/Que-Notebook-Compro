/**
 * Capture the affiliate session from a DevTools "Copy as cURL".
 *
 * The cookie is too long/complex for .env, so we store it in a gitignored JSON
 * file (data/.affiliate-session.json) that the mint job reads.
 *
 * Usage:
 *   1. En el panel de Afiliados (logueado), DevTools → Network, generá un link,
 *      click derecho sobre la request `links` → Copy → Copy as cURL.
 *   2. Pegá ese cURL en  scripts/_curl.txt
 *   3. npm run session
 *
 * Acepta el formato cURL de cmd de Windows (con `^`) o el de bash/posix.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DATA_DIR, ROOT, getEnv } from './_shared/env.mjs';

const path = process.argv[2] ?? resolve(ROOT, 'scripts/_curl.txt');
let raw;
try {
  raw = await readFile(path, 'utf8');
} catch {
  console.error(`No encontré el cURL en ${path}.\nPegá el "Copy as cURL" del request "links" en scripts/_curl.txt y reintentá.`);
  process.exit(1);
}

// Undo Windows cmd "Copy as cURL" escaping (carets), then \" -> "
const decode = (s) => s.replace(/\^/g, '').replace(/\\"/g, '"').trim();

// Works for both cmd (-b ^"...^") and bash (-b '...' or --cookie "...") forms.
const cookieM =
  raw.match(/-b \^"([\s\S]*?)\^" \^/) ||
  raw.match(/-b '([\s\S]*?)'/) ||
  raw.match(/-b "([\s\S]*?)"(?:\s|$)/) ||
  raw.match(/--cookie '([\s\S]*?)'/);
const csrfM = raw.match(/x-csrf-token: ([\s\S]*?)(?:\^"|'|"|\r|\n)/i);
if (!cookieM || !csrfM) {
  console.error('No pude extraer cookie/csrf del cURL. ¿Pegaste el request correcto (`links`)?');
  process.exit(1);
}

const cookie = decode(cookieM[1]);
const csrf = decode(csrfM[1]);
const tag = getEnv('ML_AFFILIATE_TAG', 'matascrespi');

await writeFile(resolve(DATA_DIR, '.affiliate-session.json'), JSON.stringify({ cookie, csrf, tag }, null, 2) + '\n');

const names = cookie.split(';').map((c) => c.split('=')[0].trim());
const need = ['ssid', 'orguseridp', 'orgnickp', '_csrf', 'nsa_rotok'];
const missing = need.filter((n) => !names.includes(n));
console.log(`✓ Sesión guardada en data/.affiliate-session.json (${names.length} cookies, csrf ${csrf.length} chars, tag ${tag}).`);
if (missing.length) console.warn('⚠️  Faltan cookies de auth:', missing.join(', '), '— puede que la sesión no sirva.');
else console.log('Cookies de auth presentes. Ya podés correr `npm run validate` o `npm run mint`.');
