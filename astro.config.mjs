import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// SSR is required: product price/stock/specs are fetched live from the
// Mercado Libre API at request time, and the OAuth2 token must never reach
// the browser. Marketing pages opt back into static via `export const prerender = true`.
export default defineConfig({
  // ÚNICA fuente de la URL base del sitio. Canonical, OG/Twitter, JSON-LD,
  // robots.txt y sitemap.xml derivan todos de acá (Astro.site / context.site).
  // El día que migres a dominio propio: cambiá SOLO esta línea y redeployá.
  site: 'https://quenotebookcompro.netlify.app',
  // Una sola URL por página (/blog, nunca /blog/): evita contenido duplicado.
  trailingSlash: 'never',
  output: 'server',
  adapter: netlify(),
  build: {
    // Todo el CSS va inline en el HTML (~10 KiB): elimina requests que
    // bloquean el primer render y acorta la cadena crítica de las fuentes.
    inlineStylesheets: 'always',
  },
  integrations: [
    preact({ compat: false }),
    tailwind({ applyBaseStyles: false }),
  ],
});
