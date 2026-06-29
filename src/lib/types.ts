/** Shared TypeScript types for the SSR site. */

export interface NotebookSpecs {
  brand?: string;
  line?: string;
  model?: string;
  ramGb?: number;
  processorBrand?: string;
  processorLine?: string;
  processorTier?: number;
  storageType?: string;
  storageGb?: number;
  screenInches?: number;
  gpuDedicated?: boolean;
  gpuModel?: string;
  os?: string;
  vramGb?: number;
  refreshHz?: number;
  weightKg?: number;
  ramType?: string;
  resolution?: string;
  touch?: boolean;
}

export interface NotebookFilters {
  priceMin?: number;
  priceMax?: number;
  ramMinGb?: number;
  processorMinTier?: number;
  storageMinGb?: number;
  screenMin?: number;
  screenMax?: number;
  gpuDedicated?: 'required' | 'preferred' | 'any';
  os?: 'windows' | 'mac' | 'linux';
  sort?: 'relevance' | 'price_asc' | 'price_desc';
}

/** What the site renders: live ML data merged with the two text stores. */
export interface NotebookProduct {
  id: string;
  title: string;
  price: number | null;
  originalPrice?: number | null; // list/old price when there's a discount
  discountPct?: number | null; // 0-100
  currency: string;
  image: string;
  permalink: string; // ML product page (not the affiliate link)
  shortUrl: string; // affiliate meli.la — THE buy link
  available: number | null;
  condition: string;
  specs: NotebookSpecs;
  description: string;
  fetchedAt: string; // ISO time of the live snapshot
}
