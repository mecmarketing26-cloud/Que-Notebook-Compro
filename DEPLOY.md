# Puesta en producción — Que Notebook Comprar

El repo Git ya está inicializado en `astro-site/` con todo listo. Faltan los pasos
que necesitan **tu login** (crear el repo en GitHub y conectar Netlify).

## Cómo se mantiene actualizado online (resumen)

- **Precios** → los refresca solo una **GitHub Action cada 6 h** (`.github/workflows/refresh-prices.yml`):
  re-precia `data/catalog.json` y lo commitea → el push dispara el **deploy automático** en Netlify. 24/7, sin tu PC.
- **Productos nuevos** → se suman **local** con `npm run session` + `npm run catalog:grow` y un `git push`
  (mintear necesita la sesión de afiliado, que no se puede automatizar en la nube). Es ocasional.

---

## 1) Subir a GitHub

```bash
cd astro-site
# crear el repo en https://github.com/new  (PRIVADO recomendado), luego:
git remote add origin https://github.com/<TU_USUARIO>/que-notebook-comprar.git
git branch -M main
git push -u origin main
```

## 2) Secrets para la Action (refresco de precios)

En el repo → **Settings → Secrets and variables → Actions → New repository secret**, cargá:

| Secret | Valor (lo tenés en tu `.env` local) |
|---|---|
| `ML_CLIENT_ID` | `2079676575954606` |
| `ML_CLIENT_SECRET` | (tu client secret) |
| `ML_REFRESH_TOKEN` | (tu refresh token actual del `.env`) |

> El refresh token de ML dura ~6 meses. Si en algún momento el refresco falla por
> auth, generá uno nuevo (`npm run get-refresh-token`) y actualizá este secret.

Probá la Action a mano: pestaña **Actions → Refrescar precios → Run workflow**.

## 3) Conectar Netlify (deploy automático)

1. https://app.netlify.com → **Add new site → Import an existing project** → elegí el repo.
2. Build command y publish ya salen de `netlify.toml` (`npm run build` / `dist`). Dejá el resto por defecto.
3. **NO cargues** `ML_CLIENT_ID/SECRET/REFRESH_TOKEN` en las variables de entorno de Netlify.
   - Así el sitio público **no hace llamadas a la API por visita** → a salvo de crawlers y de re-bloqueos.
   - Los precios se muestran desde `catalog.json` (que la Action mantiene fresco ≤6 h).
4. Deploy. Cada `git push` (tuyo o del bot de precios) redeploya solo.

## 4) Dominio

`astro.config.mjs` tiene `site: 'https://quenotebookcomprar.com'` (usado en canonical/sitemap/JSON-LD).
- Si ese es tu dominio: apuntá el DNS a Netlify (Netlify → Domain settings).
- Si vas a usar otro: cambiá `site` en `astro.config.mjs` antes de deployar.

## 5) Antes de promocionarlo (opcional pero recomendado)

- **Google Analytics**: poné tu Measurement ID real en `src/layouts/BaseLayout.astro`
  (`GA4_ID = 'G-XXXXXXXXXX'`) — hoy el tracking de `affiliate_click` (tu conversión) está apagado.
- **Email de contacto**: reemplazá el placeholder `contacto@quenotebookcomprar.com` en `src/data/copy.ts` (`LEGAL.contactEmail`).

---

## Tareas locales que siguen siendo tuyas

```bash
npm run session                 # recapturás la sesión de afiliado (cookie DevTools)
npm run catalog:grow -- --scan=300 --max=30   # sumás notebooks nuevas
npm run describe                # (si cargaste ANTHROPIC_API_KEY) descripciones de las nuevas
git add data/ && git commit -m "feat(catalog): nuevos productos" && git push   # → deploy
```

> El refresco de **precios** NO lo hagas a mano: ya corre solo en la nube.
