import type { APIRoute } from 'astro';
import { allProducts } from '../lib/catalog-data';
import { BLOG_TOPICS } from '../data/blog';

/**
 * Sitemap con fechas REALES:
 * - Productos: su último refresh de precio (fetchedAt del snapshot). Solo se
 *   listan los mostrables (con link de afiliado Y stock) — los demás darían 404.
 * - Blog/home: el último refresh global del catálogo (los rankings cambian con él).
 * - Estáticas: fecha fija del último cambio real de la página.
 * Nunca `new Date()` para todo: un lastmod siempre "fresco" hace que Google
 * ignore la señal por completo.
 */

// Última edición real de las páginas estáticas (actualizar al cambiarlas).
const STATIC_UPDATED = '2026-07-03';
const TERMS_UPDATED = '2026-06-25';

const day = (iso: string | undefined, fallback: string): string =>
  iso && iso.length >= 10 ? iso.slice(0, 10) : fallback;

export const GET: APIRoute = async ({ site }) => {
  // `site` viene de astro.config.mjs — única fuente de la URL base.
  const base = site!.toString().replace(/\/$/, '');

  const products = allProducts();
  // Último refresh global del catálogo (rige home y rankings del blog).
  const catalogUpdated = products.reduce((max, p) => (p.fetchedAt > max ? p.fetchedAt : max), '');
  const catalogDay = day(catalogUpdated, STATIC_UPDATED);

  const staticPages = [
    { url: `${base}/`, lastmod: catalogDay, priority: '1.0', changefreq: 'daily' },
    { url: `${base}/blog`, lastmod: catalogDay, priority: '0.9', changefreq: 'daily' },
    { url: `${base}/comparar`, lastmod: STATIC_UPDATED, priority: '0.7', changefreq: 'monthly' },
    // /quiz/tecnico y /quiz/general NO van: son redirects 301 al quiz único.
    { url: `${base}/quiz`, lastmod: STATIC_UPDATED, priority: '0.8', changefreq: 'monthly' },
    ...BLOG_TOPICS.map((t) => ({
      url: `${base}/blog/${t.slug}`,
      // El ranking del artículo se recalcula con el catálogo; su publicación es fija.
      lastmod: catalogDay > t.datePublished ? catalogDay : t.datePublished,
      priority: '0.8',
      changefreq: 'daily',
    })),
    { url: `${base}/terminos`, lastmod: TERMS_UPDATED, priority: '0.3', changefreq: 'yearly' },
  ];

  const productPages = products.map((p) => ({
    url: `${base}/notebook/${p.id}`,
    lastmod: day(p.fetchedAt, catalogDay),
    priority: '0.7',
    changefreq: 'daily',
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...productPages]
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
