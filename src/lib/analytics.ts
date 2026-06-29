/**
 * Analytics wrapper → dataLayer (works with GA4 directo o GTM).
 * Para swappear de proveedor: editá push() y nada más.
 * GA4 Measurement ID: reemplazá G-XXXXXXXXXX en BaseLayout.astro.
 */

type EventParams = Record<string, string | number | boolean | undefined>;

function push(event_name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer ?? [];
  (window as any).dataLayer.push({ event: event_name, ...params });
}

export function trackQuizStart(branch: 'A' | 'B'): void {
  push('quiz_start', { branch });
}

export function trackQuizStep(branch: 'A' | 'B', step_number: number, step_name: string): void {
  push('quiz_step_view', { branch, step_number, step_name });
}

export function trackQuizComplete(branch: 'A' | 'B', filters: Record<string, unknown>): void {
  push('quiz_complete', { branch, filters: JSON.stringify(filters) });
}

/**
 * LA conversión principal del sitio (brief §10). Usa transport_type:'beacon'
 * para no perder el evento cuando el usuario navega a Mercado Libre.
 */
export function trackAffiliateClick(item_id: string, extra: EventParams = {}): void {
  const params = { event: 'affiliate_click', item_id, ...extra };
  (window as any).dataLayer = (window as any).dataLayer ?? [];
  (window as any).dataLayer.push(params);

  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'affiliate_click', {
      item_id,
      ...extra,
      transport_type: 'beacon',
    });
  }
}
