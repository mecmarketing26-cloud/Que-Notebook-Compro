/**
 * Mercado Libre data API client for the Node jobs (OAuth2 / Bearer token).
 * The access token is cached on disk (data/.token-cache.json, gitignored) and
 * auto-refreshed from the refresh_token when it's within 5 minutes of expiry.
 *
 * This is the SERVER/JOB side. The token never leaves the server. (The SSR site
 * has its own slim copy of this in src/lib/ml-api.ts.)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, DATA_DIR, requireEnv } from './env.mjs';
import { SITE_ID, CATEGORY_NOTEBOOKS, SEARCH_PAGE_LIMIT } from '../../src/shared/constants.mjs';

const API_BASE = 'https://api.mercadolibre.com';
const TOKEN_CACHE = resolve(DATA_DIR, '.token-cache.json');
const REFRESH_SKEW_MS = 5 * 60 * 1000; // refresh 5 min before expiry

let memo = null; // in-process cache: { accessToken, expiresAt }

async function readCache() {
  if (memo) return memo;
  try {
    memo = JSON.parse(await readFile(TOKEN_CACHE, 'utf8'));
  } catch {
    memo = null;
  }
  return memo;
}

async function writeCache(cache) {
  memo = cache;
  try {
    await writeFile(TOKEN_CACHE, JSON.stringify(cache, null, 2));
  } catch {
    /* best-effort cache; not fatal */
  }
}

/** Persist a rotated refresh token back into .env (Node jobs only). */
async function persistRefreshToken(newToken) {
  const envPath = resolve(ROOT, '.env');
  try {
    let content = await readFile(envPath, 'utf8');
    content = /^ML_REFRESH_TOKEN=.*$/m.test(content)
      ? content.replace(/^ML_REFRESH_TOKEN=.*$/m, `ML_REFRESH_TOKEN=${newToken}`)
      : `${content.replace(/\s*$/, '')}\nML_REFRESH_TOKEN=${newToken}\n`;
    await writeFile(envPath, content);
    process.env.ML_REFRESH_TOKEN = newToken;
  } catch {
    console.warn('⚠️  Nuevo refresh_token (guardalo a mano en .env): ' + newToken);
  }
}

/** Refresh the access token using the refresh_token grant (brief §5.1). */
async function refreshAccessToken() {
  const { ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REFRESH_TOKEN } = requireEnv(
    'ML_CLIENT_ID',
    'ML_CLIENT_SECRET',
    'ML_REFRESH_TOKEN',
  );

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: ML_CLIENT_ID,
    client_secret: ML_CLIENT_SECRET,
    refresh_token: ML_REFRESH_TOKEN,
  });

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth2 refresh falló (${res.status}): ${JSON.stringify(json)}`);
  }

  // ML rotates the refresh token on each refresh (old ones stay valid for a
  // while, but we keep .env current so a job never runs out of runway).
  if (json.refresh_token && json.refresh_token !== ML_REFRESH_TOKEN) {
    await persistRefreshToken(json.refresh_token);
  }

  const cache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 21600) * 1000,
  };
  await writeCache(cache);
  return cache.accessToken;
}

/** Get a valid access token, refreshing if missing or near expiry. */
export async function getAccessToken() {
  const cache = await readCache();
  if (cache?.accessToken && cache.expiresAt - Date.now() > REFRESH_SKEW_MS) {
    return cache.accessToken;
  }
  return refreshAccessToken();
}

/** Authenticated GET against the data API; retries once on 401 after a refresh. */
export async function mlGet(path, { retry = true } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
  });

  if (res.status === 401 && retry) {
    memo = null; // force refresh
    await refreshAccessToken();
    return mlGet(path, { retry: false });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

/**
 * Catalog products search (brief discovery path). The item search
 * (`/sites/MLA/search`) and item multiget (`/items`) are 403 for third-party
 * apps now, so we discover via the catalog. `q` is required by ML; pass a
 * laptop-targeted query (e.g. "notebook lenovo"). Filter results to
 * domain_id === NOTEBOOK_DOMAIN to drop paper notebooks / books.
 *
 * @param {{ q:string, offset?:number, limit?:number }} opts
 */
export async function searchCatalogProducts({ q, offset = 0, limit = 50 }) {
  const params = new URLSearchParams({
    status: 'active',
    site_id: SITE_ID,
    category_id: CATEGORY_NOTEBOOKS,
    q,
    offset: String(offset),
    limit: String(Math.min(limit, SEARCH_PAGE_LIMIT)),
  });
  return mlGet(`/products/search?${params.toString()}`);
}

/** Catalog product datasheet: name, pictures, attributes, domain_id, etc. */
export async function getProduct(productId) {
  return mlGet(`/products/${productId}`);
}

/** Active offers for a catalog product: prices, condition, shipping, seller.
 *  404 "No winners found" = the product has no active offers → return []. */
export async function getProductOffers(productId) {
  try {
    const json = await mlGet(`/products/${productId}/items`);
    return json?.results ?? [];
  } catch (err) {
    if (String(err.message).includes('→ 404')) return [];
    throw err;
  }
}

/** Top curated catalog products for a category (best-sellers, rich datasheets). */
export async function getCategoryHighlights(categoryId = CATEGORY_NOTEBOOKS) {
  try {
    const json = await mlGet(`/highlights/${SITE_ID}/category/${categoryId}`);
    return (json?.content ?? []).filter((c) => /^MLA\d/.test(c?.id)).map((c) => c.id);
  } catch {
    return [];
  }
}

/** Category attribute schema (brief §5.2) — used by inspect-attributes. */
export async function getCategoryAttributes(categoryId = CATEGORY_NOTEBOOKS) {
  return mlGet(`/categories/${categoryId}/attributes`);
}
