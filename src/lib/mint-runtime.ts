/**
 * Runtime (serve-time) affiliate minting + the live links state.
 *
 * Goal: ONLY products with an affiliate link are shown. So when a search needs to
 * show a product that isn't minted yet, we mint it on the fly here (using the
 * captured browser session), persist it, and keep it. Already-minted products are
 * returned instantly.
 *
 * The links state is an in-memory map seeded from data/affiliate_links.json and
 * updated as we mint. Persistence does read-merge-write so it cooperates with the
 * background `npm run mint` job. (Note: writing works on a normal Node host / local
 * dev; a read-only serverless host would need an external store for new mints.)
 */
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const LINKS_PATH = fileURLToPath(new URL('../../data/affiliate_links.json', import.meta.url));
const SESSION_PATH = fileURLToPath(new URL('../../data/.affiliate-session.json', import.meta.url));
const MINT_URL = 'https://www.mercadolibre.com.ar/affiliate-program/api/v2/stripe/user/links';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

type LinkEntry = {
  short_url?: string | null;
  regex?: string | null;
  minted_at?: string;
  ineligible?: boolean;
  reason?: string;
  checked_at?: string;
};

function loadLinks(): Map<string, LinkEntry> {
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(LINKS_PATH, 'utf8')) as Record<string, LinkEntry>));
  } catch {
    return new Map();
  }
}
const links = loadLinks();

export function mintedShortUrl(id: string): string | null {
  return links.get(id)?.short_url ?? null;
}
export function isKnownIneligible(id: string): boolean {
  return links.get(id)?.ineligible === true;
}
export function mintedIds(): Set<string> {
  const s = new Set<string>();
  for (const [id, e] of links) if (e.short_url) s.add(id);
  return s;
}

export class SessionExpiredError extends Error {}

function getSession(): { cookie: string; csrf: string; tag: string } | null {
  try {
    const j = JSON.parse(readFileSync(SESSION_PATH, 'utf8'));
    return j?.cookie && j?.csrf && j?.tag ? j : null;
  } catch {
    return null;
  }
}

let persistPending = false;
function persist(): void {
  if (persistPending) return;
  persistPending = true;
  setTimeout(async () => {
    persistPending = false;
    try {
      let onDisk: Record<string, LinkEntry> = {};
      try {
        onDisk = JSON.parse(readFileSync(LINKS_PATH, 'utf8'));
      } catch {
        /* empty */
      }
      for (const [id, e] of links) onDisk[id] = e; // merge our entries over disk
      const ordered = Object.fromEntries(Object.keys(onDisk).sort().map((k) => [k, onDisk[k]]));
      await writeFile(LINKS_PATH, JSON.stringify(ordered, null, 2) + '\n');
    } catch {
      /* best effort */
    }
  }, 800);
}

/**
 * Mint (or return cached) the affiliate link for a catalog product.
 * @returns short_url, or null if not eligible / no session.
 * @throws SessionExpiredError on 401/403 (caller should stop minting this request)
 */
export async function mintProduct(id: string): Promise<string | null> {
  const existing = links.get(id);
  if (existing?.short_url) return existing.short_url;
  if (existing?.ineligible) return null;

  const s = getSession();
  if (!s) return null; // no session captured → can't mint now

  const permalink = `https://www.mercadolibre.com.ar/p/${id}`;
  const res = await fetch(MINT_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      cookie: s.cookie,
      'x-csrf-token': s.csrf,
      origin: 'https://www.mercadolibre.com.ar',
      referer: permalink,
      'user-agent': UA,
    },
    body: JSON.stringify({ tag: s.tag, url: permalink }),
  });

  if (res.status === 401 || res.status === 403) throw new SessionExpiredError(String(res.status));

  const j: any = await res.json().catch(() => ({}));
  if (j?.short_url) {
    links.set(id, { short_url: j.short_url, regex: j.regex ?? null, minted_at: new Date().toISOString() });
    persist();
    return j.short_url;
  }
  // Not affiliable → mark so we don't retry every request.
  links.set(id, { short_url: null, ineligible: true, reason: j?.message ?? `http_${res.status}`, checked_at: new Date().toISOString() });
  persist();
  return null;
}
