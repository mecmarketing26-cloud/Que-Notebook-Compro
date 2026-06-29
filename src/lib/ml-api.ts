/**
 * SSR-side Mercado Libre data client. Runs ONLY on the server (Astro SSR /
 * Netlify function). The OAuth2 token is cached in-memory per server instance
 * and never reaches the browser (brief §1/§4).
 *
 * This is intentionally a slim mirror of scripts/_shared/ml-client.mjs — the
 * jobs and the site share the same pure helpers (src/shared/*) but keep separate
 * fetch/token layers (the job persists the token to disk; serverless can't).
 */
import { SITE_ID, CATEGORY_NOTEBOOKS, SEARCH_PAGE_LIMIT } from '../shared/constants.mjs';

const API_BASE = 'https://api.mercadolibre.com';
const REFRESH_SKEW_MS = 5 * 60 * 1000;

function env(name: string): string | undefined {
  // import.meta.env exposes .env vars server-side; process.env covers Netlify.
  return (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
}

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function refreshAccessToken(): Promise<string> {
  const clientId = env('ML_CLIENT_ID');
  const clientSecret = env('ML_CLIENT_SECRET');
  const refreshToken = env('ML_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Faltan credenciales OAuth2 (ML_CLIENT_ID/SECRET/REFRESH_TOKEN).');
  }

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth2 refresh falló (${res.status}).`);
  }
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 21600) * 1000,
  };
  return tokenCache.accessToken;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - Date.now() > REFRESH_SKEW_MS) {
    return tokenCache.accessToken;
  }
  return refreshAccessToken();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mlGet<T = any>(path: string, retry = true, rateRetries = 3): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  if (res.status === 401 && retry) {
    tokenCache = null;
    return mlGet<T>(path, false, rateRetries);
  }
  // Back off on rate limiting (429) instead of failing the whole build.
  if (res.status === 429 && rateRetries > 0) {
    const wait = Number(res.headers.get('retry-after')) * 1000 || (4 - rateRetries) * 800 + 800;
    await sleep(wait);
    return mlGet<T>(path, retry, rateRetries - 1);
  }
  if (!res.ok) {
    throw new Error(`GET ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// The site is catalog-product based: /items is 403 for third parties, so we read
// the product datasheet + its offers (brief §5.4/§5.5 reworked to current ML API).

/** Catalog product datasheet (name, pictures, attributes, domain_id). */
export async function getProduct(productId: string): Promise<any> {
  return mlGet(`/products/${productId}`);
}

/** Active offers for a catalog product (prices, condition, shipping, seller).
 *  404 "No winners found" = no active offers → return []. */
export async function getProductOffers(productId: string): Promise<any[]> {
  try {
    const json = await mlGet<any>(`/products/${productId}/items`);
    return json?.results ?? [];
  } catch (err) {
    if (String((err as Error).message).includes('→ 404')) return [];
    throw err;
  }
}

/** Fetch product + offers together. Returns null if the product is gone. */
export async function getProductWithOffers(productId: string): Promise<{ product: any; offers: any[] } | null> {
  try {
    const [product, offers] = await Promise.all([getProduct(productId), getProductOffers(productId)]);
    return { product, offers };
  } catch {
    return null;
  }
}

/** Catalog products search (laptop discovery for SEO/browse pages if needed). */
export async function searchCatalogProducts(q: string, offset = 0, limit = SEARCH_PAGE_LIMIT): Promise<any> {
  const qs = new URLSearchParams({
    status: 'active',
    site_id: SITE_ID,
    category_id: CATEGORY_NOTEBOOKS,
    q,
    offset: String(offset),
    limit: String(Math.min(limit, SEARCH_PAGE_LIMIT)),
  });
  return mlGet(`/products/search?${qs.toString()}`);
}

/** True when OAuth2 creds are present (used to show a helpful empty state). */
export function hasCredentials(): boolean {
  return Boolean(env('ML_CLIENT_ID') && env('ML_CLIENT_SECRET') && env('ML_REFRESH_TOKEN'));
}
