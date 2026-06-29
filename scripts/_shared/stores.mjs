/**
 * The ONLY persisted state (brief §3): two text stores keyed by ML item id.
 *   - data/affiliate_links.json  -> { [itemId]: { short_url, regex, minted_at } }
 *   - data/descriptions.json     -> { [itemId]: { text, generated_at } }
 *
 * Both are append/upsert: existing keys are respected (never re-minted /
 * re-generated). Nothing else is persisted — no prices, stock, specs or images.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DATA_DIR } from './env.mjs';

const LINKS_PATH = resolve(DATA_DIR, 'affiliate_links.json');
const DESCRIPTIONS_PATH = resolve(DATA_DIR, 'descriptions.json');

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return {};
  }
}

async function writeJson(path, obj) {
  // Stable key order keeps diffs readable when committed.
  const ordered = Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
  await writeFile(path, JSON.stringify(ordered, null, 2) + '\n');
}

export const loadLinks = () => readJson(LINKS_PATH);
export const saveLinks = (obj) => writeJson(LINKS_PATH, obj);
export const loadDescriptions = () => readJson(DESCRIPTIONS_PATH);
export const saveDescriptions = (obj) => writeJson(DESCRIPTIONS_PATH, obj);

export { LINKS_PATH, DESCRIPTIONS_PATH };
