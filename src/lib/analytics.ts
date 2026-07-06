/**
 * Analytics wrapper. Cada evento se emite DOS veces:
 *  1. `dataLayer.push({ event, ...params })` → lo consume GTM (triggers de
 *     "Custom Event" + variables de Data Layer).
 *  2. Espejo `gtag('event', ...)` → llega DIRECTO a GA4 aunque GTM no tenga
 *     ningún tag configurado. Los nombres estándar de GA4 (view_item,
 *     select_item, view_item_list, search, share) alimentan los reportes
 *     nativos de ecommerce/búsqueda sin configurar nada.
 *
 * ⚠️ Doble conteo: si algún día creás en GTM tags de GA4 para estos mismos
 * eventos apuntando a la misma propiedad, se contarían dos veces. En ese caso
 * apagá el espejo (GTAG_MIRROR = false) o no crees esos tags.
 */

type EventParams = Record<string, unknown>;

/** Item con la forma que esperan los reportes de ecommerce de GA4. */
export interface AnalyticsItem {
  item_id: string;
  item_name?: string;
  item_brand?: string;
  price?: number | null;
  index?: number;
}

const GTAG_MIRROR = true;

function push(event_name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: event_name, ...params });
  if (GTAG_MIRROR && typeof w.gtag === 'function') w.gtag('event', event_name, params);
}

/* ── Quiz ─────────────────────────────────────────────────────────── */

export function trackQuizStart(quiz_mode = ''): void {
  push('quiz_start', { quiz_mode });
}

export function trackQuizStep(quiz_mode: string, step_number: number, step_name: string): void {
  push('quiz_step_view', { quiz_mode, step_number, step_name });
}

/** Se dispara al CONFIRMAR con "Siguiente": guarda la opción elegida. */
export function trackQuizAnswer(quiz_mode: string, step_number: number, step_name: string, answer_value: string, answer_label?: string): void {
  push('quiz_answer', { quiz_mode, step_number, step_name, answer_value, answer_label });
}

export function trackQuizComplete(quiz_mode: string, filters: Record<string, unknown>): void {
  push('quiz_complete', { quiz_mode, filters: JSON.stringify(filters) });
}

/** Pantalla "Ya hiciste el test": qué eligió el usuario. */
export function trackQuizResume(action: 'shown' | 'view_saved' | 'restart'): void {
  push('quiz_resume', { action });
}

/* ── Productos ────────────────────────────────────────────────────── */

/** Vista de ficha (/notebook/[id]) — "las computadoras más vistas". */
export function trackProductView(item: { id: string; name?: string; brand?: string; price?: number | null; currency?: string; in_stock?: boolean }): void {
  push('view_item', {
    item_id: item.id,
    item_name: item.name,
    item_brand: item.brand,
    price: item.price ?? undefined,
    currency: item.currency ?? 'ARS',
    in_stock: item.in_stock,
    value: item.price ?? undefined,
    items: [{ item_id: item.id, item_name: item.name, item_brand: item.brand, price: item.price ?? undefined }],
  });
}

/** Click en un producto para ir a su ficha, con la lista de origen. */
export function trackSelectItem(item_id: string, item_list_name: string, item_name?: string): void {
  push('select_item', {
    item_id,
    item_list_name,
    item_name,
    items: [{ item_id, item_name }],
  });
}

/** Listado de productos mostrado (resultado, ranking de una guía). */
export function trackViewItemList(item_list_name: string, items: AnalyticsItem[], extra: EventParams = {}): void {
  push('view_item_list', { item_list_name, results_count: items.length, ...extra, items });
}

/**
 * LA conversión principal del sitio: click al link de afiliado de ML.
 * transport beacon: que el hit no se pierda al navegar fuera.
 */
export function trackAffiliateClick(item_id: string, extra: EventParams = {}): void {
  push('affiliate_click', { item_id, transport_type: 'beacon', ...extra });
}

/* ── Búsqueda / comparador / social ───────────────────────────────── */

export function trackSearch(search_term: string, results_count: number): void {
  push('search', { search_term, results_count });
}

/** Comparación armada (2+ modelos lado a lado). */
export function trackCompareView(item_ids: string[]): void {
  push('compare_view', { item_ids: item_ids.join(','), items_count: item_ids.length });
}

export function trackShare(method: 'web_share' | 'clipboard'): void {
  push('share', { method, content_type: 'page', page_path: location.pathname });
}

/** Click en el CTA "Encontrar mi notebook": desde qué ubicación entran al quiz. */
export function trackCtaClick(placement: string): void {
  push('cta_quiz_click', { placement, page_path: location.pathname });
}
