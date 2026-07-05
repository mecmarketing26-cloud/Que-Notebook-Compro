import type { APIRoute } from 'astro';

// Se genera en build como archivo estático, derivando la URL base de `site`
// (astro.config.mjs) — así nunca vuelve a quedar apuntando a un dominio viejo.
export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
