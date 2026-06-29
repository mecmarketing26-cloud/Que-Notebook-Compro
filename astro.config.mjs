import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// SSR is required: product price/stock/specs are fetched live from the
// Mercado Libre API at request time, and the OAuth2 token must never reach
// the browser. Marketing pages opt back into static via `export const prerender = true`.
export default defineConfig({
  site: 'https://quenotebookcomprar.com',
  output: 'server',
  adapter: netlify(),
  integrations: [
    preact({ compat: false }),
    tailwind({ applyBaseStyles: false }),
  ],
});
