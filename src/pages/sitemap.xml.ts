import type { APIRoute } from 'astro';
import linksStore from '../../data/affiliate_links.json';
import { BLOG_TOPICS } from '../data/blog';

// Product universe for the sitemap = minted ids that have an affiliate link.
// (No live API call needed — we only need the ids/keys.)
const links = linksStore as Record<string, { short_url?: string | null }>;

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, '') ?? 'https://quenotebookcomprar.com';
  const now = new Date().toISOString();

  const staticPages = [
    { url: `${base}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${base}/blog`, priority: '0.9', changefreq: 'weekly' },
    { url: `${base}/quiz/tecnico`, priority: '0.8', changefreq: 'monthly' },
    { url: `${base}/quiz/general`, priority: '0.8', changefreq: 'monthly' },
    ...BLOG_TOPICS.map((t) => ({ url: `${base}/blog/${t.slug}`, priority: '0.8', changefreq: 'weekly' })),
    { url: `${base}/terminos`, priority: '0.3', changefreq: 'yearly' },
  ];

  const productPages = Object.entries(links)
    .filter(([, v]) => Boolean(v?.short_url))
    .map(([id]) => ({ url: `${base}/notebook/${id}`, priority: '0.8', changefreq: 'daily' }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...productPages]
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
