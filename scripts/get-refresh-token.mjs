/**
 * One-time OAuth2 authorization-code flow to obtain ML_REFRESH_TOKEN.
 *
 * Usage:
 *   1) npm run get-refresh-token
 *        → prints the authorization URL. Open it, log in, authorize.
 *          You'll be redirected to your ML_REDIRECT_URI with ?code=XXXX
 *   2) npm run get-refresh-token -- XXXX
 *        → exchanges the code and prints access_token + refresh_token.
 *          Copy refresh_token into .env as ML_REFRESH_TOKEN.
 */
import { requireEnv, getEnv } from './_shared/env.mjs';

const AUTH_BASE = 'https://auth.mercadolibre.com.ar/authorization';
const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';

const code = process.argv[2];
const { ML_CLIENT_ID } = requireEnv('ML_CLIENT_ID');
const redirectUri = getEnv('ML_REDIRECT_URI', 'https://localhost/callback');

if (!code) {
  const url = `${AUTH_BASE}?response_type=code&client_id=${encodeURIComponent(
    ML_CLIENT_ID,
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=offline_access+read`;
  console.log('\n1) Abrí esta URL en el navegador y autorizá la app:\n');
  console.log('   ' + url + '\n');
  console.log('2) Te va a redirigir a tu redirect_uri con ?code=XXXX en la URL.');
  console.log('   Copiá ese code y corré:\n');
  console.log('   npm run get-refresh-token -- <code>\n');
  process.exit(0);
}

const { ML_CLIENT_SECRET } = requireEnv('ML_CLIENT_SECRET');

const body = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: ML_CLIENT_ID,
  client_secret: ML_CLIENT_SECRET,
  code,
  redirect_uri: redirectUri,
});

const res = await fetch(TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
  body,
});
const json = await res.json().catch(() => ({}));

if (!res.ok || !json.refresh_token) {
  console.error(`\n❌ Falló el intercambio (${res.status}):`, JSON.stringify(json, null, 2));
  console.error('\nEl code expira rápido (~10 min) y es de un solo uso. Generá uno nuevo si hace falta.');
  process.exit(1);
}

console.log('\n✅ Listo. Guardá esto en .env:\n');
console.log('ML_REFRESH_TOKEN=' + json.refresh_token + '\n');
console.log('(access_token de prueba, vence en', json.expires_in, 'seg):', json.access_token.slice(0, 12) + '…');
