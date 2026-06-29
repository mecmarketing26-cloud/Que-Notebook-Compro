/**
 * Affiliate-link minting (brief §6). This uses a DIFFERENT credential than the
 * data API: the browser SESSION (cookie + x-csrf-token) against the affiliate
 * panel endpoint. It does NOT accept the OAuth2 token.
 *
 * The session expires often. On 401/403 we throw SessionExpiredError so the job
 * can STOP and tell the user to recapture cookie/csrf from DevTools (see README).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireEnv, getEnv, DATA_DIR } from './env.mjs';

const MINT_URL =
  'https://www.mercadolibre.com.ar/affiliate-program/api/v2/stripe/user/links';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export class SessionExpiredError extends Error {
  constructor(status) {
    super(
      `Sesión de afiliados vencida (HTTP ${status}). Recapturá ML_AFFILIATE_COOKIE y ` +
        `ML_AFFILIATE_CSRF desde DevTools y volvé a correr el job (README → "Recapturar la sesión de afiliados").`,
    );
    this.name = 'SessionExpiredError';
    this.status = status;
  }
}

/**
 * Affiliate session creds. Prefers data/.affiliate-session.json (written from a
 * DevTools "Copy as cURL" — the cookie is too long/complex for .env), and falls
 * back to the ML_AFFILIATE_* env vars.
 */
export function getAffiliateSession() {
  try {
    const j = JSON.parse(readFileSync(resolve(DATA_DIR, '.affiliate-session.json'), 'utf8'));
    if (j.cookie && j.csrf && j.tag) return { cookie: j.cookie, csrf: j.csrf, tag: j.tag };
  } catch {
    /* fall through to env */
  }
  const env = requireEnv('ML_AFFILIATE_COOKIE', 'ML_AFFILIATE_CSRF', 'ML_AFFILIATE_TAG');
  return {
    cookie: env.ML_AFFILIATE_COOKIE,
    csrf: env.ML_AFFILIATE_CSRF,
    tag: env.ML_AFFILIATE_TAG,
  };
}

/**
 * Mint one affiliate link for a product permalink.
 * @returns {Promise<{ short_url:string, regex?:string, raw:object }>}
 * @throws {SessionExpiredError} on 401/403 (caller should stop the whole job)
 */
export async function mintLink(permalink, session = getAffiliateSession()) {
  const res = await fetch(MINT_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      cookie: session.cookie,
      'x-csrf-token': session.csrf,
      origin: 'https://www.mercadolibre.com.ar',
      referer: permalink,
      'user-agent': getEnv('ML_AFFILIATE_UA', UA),
    },
    body: JSON.stringify({ tag: session.tag, url: permalink }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new SessionExpiredError(res.status);
  }

  const json = await res.json().catch(() => ({}));

  // Not eligible (e.g. CBT slipped through, or item can't be affiliated):
  // no short_url but an error payload. Caller records it and continues.
  if (!res.ok || !json.short_url) {
    return { short_url: null, regex: null, raw: json, status: res.status };
  }

  return { short_url: json.short_url, regex: json.regex ?? null, raw: json, status: res.status };
}

/** Small jittered delay between sequential mints to be gentle on the endpoint. */
export function mintDelay(ms = 450) {
  const jitter = Math.floor(Math.random() * 200);
  return new Promise((r) => setTimeout(r, ms + jitter));
}
