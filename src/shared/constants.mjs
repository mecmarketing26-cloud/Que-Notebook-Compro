/**
 * Cross-runtime constants (imported by both Node scripts and the Astro SSR site).
 * Pure data only — no env, no fetch.
 */

export const SITE_ID = 'MLA'; // Mercado Libre Argentina
export const CATEGORY_NOTEBOOKS = 'MLA1652';

// ML API limits.
export const SEARCH_PAGE_LIMIT = 50; // max results per /search page
export const ITEMS_BATCH_SIZE = 20; // max ids per multiget /items call

/**
 * Candidate attribute IDs per normalized spec, in priority order.
 *
 * IMPORTANT (brief §5.2 / §14): these are *candidates*, not hardcoded truth.
 * Mercado Libre may rename/restructure attributes. Run `npm run inspect-attributes`
 * to dump the live schema of MLA1652 and confirm/extend these lists. The normalizer
 * (src/shared/attributes.mjs) also falls back to matching by attribute name + value
 * parsing, so it stays useful even if an id here is stale.
 */
// Confirmed against the live MLA1652 schema (npm run inspect-attributes, 2026-06).
export const ATTRIBUTE_IDS = {
  brand: ['BRAND'],
  line: ['LINE'],
  model: ['MODEL'],
  ram: ['RAM_MEMORY_MODULE_TOTAL_CAPACITY'],
  processorBrand: ['PROCESSOR_BRAND'],
  processorLine: ['PROCESSOR_LINE'],
  processorModel: ['PROCESSOR_MODEL'],
  // Priority: SSD, then M.2, then total/HDD. First non-empty wins.
  storageCapacity: [
    'SSD_DATA_STORAGE_CAPACITY',
    'M2_DATA_STORAGE_CAPACITY',
    'TOTAL_DISK_CAPACITY',
    'HARD_DRIVE_DATA_STORAGE_CAPACITY',
  ],
  storageType: ['DISK_TYPE'], // HDD / SSD / Híbrido
  screenSize: ['DISPLAY_SIZE'],
  // No boolean attribute: a dedicated card's presence = dedicated GPU.
  dedicatedGpu: ['DEDICATED_GRAPHIC_CARD_MODEL', 'DEDICATED_GRAPHIC_CARD_LINE', 'DEDICATED_GRAPHIC_CARD_BRAND'],
  integratedGpu: ['INTEGRATED_GRAPHIC_CARD_MODEL', 'INTEGRATED_GRAPHIC_CARD_LINE'],
  gpuGeneric: ['GRAPHIC_CARD'],
  os: ['OS_NAME'],
  // Extra specs used for the comparison feature.
  vram: ['VIDEO_MEMORY'],
  refreshRate: ['DISPLAY_REFRESH_RATE'],
  weight: ['WEIGHT'],
  ramType: ['RAM_MEMORY_TYPE'],
  touch: ['WITH_TOUCH_SCREEN'],
  resolution: ['DISPLAY_RESOLUTION_TYPE', 'DISPLAY_RESOLUTION'],
};

// Catalog domain that identifies real laptops (vs paper notebooks / books).
export const NOTEBOOK_DOMAIN = 'MLA-NOTEBOOKS';

// Local-shipping predicate (brief §5.3.1).
export const LOCAL_COUNTRY_ID = 'AR';
export const CBT_LOGISTIC_TYPE = 'remote'; // cross-border / Global Selling
