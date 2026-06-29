# ¿Qué Notebook Comprar? — Recomendador de notebooks con afiliados de Mercado Libre

Sitio de nicho que recomienda y compara notebooks reales de **Mercado Libre Argentina**,
monetizado 100% con links de afiliado. El usuario responde un quiz corto (o filtra por
specs) y obtiene notebooks concretas con botón de compra.

**Stack:** Astro 4 (SSR) · Tailwind · Preact (quiz island) · Netlify · Node 20.

---

## Las dos mitades (importante)

Hay **dos credenciales distintas** y dos procesos separados — no mezclar:

| | Datos de producto | Links de afiliado |
|---|---|---|
| **Endpoint** | `api.mercadolibre.com` | panel de afiliados (`mercadolibre.com.ar/affiliate-program/...`) |
| **Auth** | OAuth2 (Bearer, vence 6 h, se refresca solo) | sesión de navegador (cookie + `x-csrf-token`, vence seguido) |
| **Cuándo** | en vivo, en cada request del sitio | job on-demand (`npm run mint`), nunca en vivo |
| **Velocidad** | rápido, batch de 20 | 1 request por producto, secuencial |

El sitio **sirve siempre desde el store ya minteado** y trae precio/stock/specs en vivo.
Nunca acuña links en vivo (expondría la sesión y sería lento/frágil).

```
JOB (on-demand)                          SITIO (serving, SSR)
─────────────                            ────────────────────
refresh token → buscar notebooks →       universo = keys de affiliate_links.json
mintear faltantes → guardar short_url     → GET /items?ids=… (batch 20, live)
generar descripciones faltantes           → merge: data viva + link + descripción
        │                                  → filtra/quiz en memoria → fichas
        ▼
data/affiliate_links.json  +  data/descriptions.json   (los ÚNICOS archivos de estado)
```

### Lo único que se persiste: dos archivos de TEXTO

- `data/affiliate_links.json` — `{ "MLA123…": { short_url, regex, minted_at } }`
- `data/descriptions.json` — `{ "MLA123…": { text, generated_at } }`

No se guarda **nada** más: ni precios, ni stock, ni specs, ni imágenes (todo eso es
efímero y sale de la API en vivo). Ambos stores son **upsert**: si la key existe, se
respeta (no se re-mintea ni se regenera).

Las keys son **ids de PRODUCTO de catálogo** (ej. `MLA22826188`), no de publicación.

### Por qué catálogo (`/products`) y no items

Probado contra la API real (jun 2026): Mercado Libre **bloquea con 403** la búsqueda de
publicaciones (`/sites/MLA/search`) y el acceso a items de terceros (`/items`). Lo que SÍ
funciona con el token OAuth2 es la API de **catálogo**:

- **Descubrir:** `/products/search?status=active&site_id=MLA&q=<query>` (filtrando
  `domain_id === "MLA-NOTEBOOKS"` para quedarnos con notebooks y no cuadernos).
- **Datos del producto:** `/products/{id}` (nombre, fotos, ficha técnica/atributos).
- **Precio/stock/envío:** `/products/{id}/items` (ofertas → tomamos la **más barata con
  envío local**; el precio se muestra como "desde $X").
- **Comprar:** se mintea/abre la URL de catálogo `/p/{id}`.

Para una web comparadora esto es incluso mejor: las fichas de catálogo son canónicas,
limpias y deduplicadas.

---

## Setup

```bash
cd astro-site
npm install
cp .env.example .env      # completá los valores (ver abajo)
```

### Credenciales (`.env`, NO se commitea)

**OAuth2 (datos):** `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`.
Obtené el refresh token una vez:

```bash
npm run get-refresh-token            # imprime la URL de autorización
# abrís la URL, autorizás, te redirige a tu redirect_uri con ?code=XXXX
npm run get-refresh-token -- XXXX    # intercambia el code → imprime el refresh_token
```

Verificá que anda:

```bash
npm run refresh-token                # debería imprimir "Access token OK"
```

**Sesión de afiliados (solo para mintear):** `ML_AFFILIATE_COOKIE`, `ML_AFFILIATE_CSRF`,
`ML_AFFILIATE_TAG`. Ver **"Recapturar la sesión de afiliados"** más abajo.

---

## 🔴 Paso 0 — Validar la costura (brief §12)

**Antes de poblar todo el catálogo**, validá el flujo punta a punta con UN producto:

```bash
npm run validate
```

Hace: refresca token → busca 1 notebook de envío local → mintea su link → **imprime el
`meli.la`** → trae datos vivos + genera descripción → escribe los dos stores → muestra la
ficha resultante.

> **Verificá a mano (caveat §6):** abrí el `meli.la` que imprime **en una ventana de
> incógnito** y confirmá que aterriza en el producto correcto. El link es
> `SOCIAL_PROFILE_ENCRYPTED` (apunta a un perfil social con `ref` encriptado), así que esta
> verificación manual es obligatoria antes de escalar. Si aterriza mal, no escales: evaluá
> el endpoint `createLink` para los de catálogo.

Si esos pasos cierran, la idea está validada y el resto es escalar.

---

## Escalar (poblar el catálogo)

```bash
# 1) (Opcional) Ver el schema real de atributos de la categoría — brief §5.2
npm run inspect-attributes
#    Los IDs ya están confirmados en src/shared/constants.mjs → ATTRIBUTE_IDS.

# 2) Mintear links de afiliado para notebooks que no estén en el store
npm run mint                              # queries por defecto (marcas), 2 páginas c/u
npm run mint -- --pages=4                 # más páginas por query
npm run mint -- --q="notebook gamer rtx"  # una query puntual
npm run mint -- --max=50                  # tope de links nuevos por corrida

# 3) Generar descripciones para las notebooks minteadas que no tengan una
npm run describe
```

- `mint` **respeta el store** (no re-mintea), solo procesa productos con **oferta de envío
  local** (excluye internacionales/CBT y listings sin stock — §5.3.1), va secuencial con
  delay, y **frena con aviso** si la sesión vence (401/403).
- `describe` genera **una sola vez** y reutiliza. Usa la API de Anthropic si está
  `ANTHROPIC_API_KEY`; si no, una plantilla determinística desde las specs.

---

## Recapturar la sesión de afiliados (cuando el minteo da 401/403)

La cookie/csrf de afiliados **vencen seguido**. Cuando `npm run mint` corta con
`Sesión de afiliados vencida`, recapturá (toma 30 segundos):

1. Logueado en `https://www.mercadolibre.com.ar`, abrí **DevTools → Network**.
2. Generá/compartí un link de cualquier producto (dispara una request al endpoint
   `.../affiliate-program/api/v2/stripe/user/links`).
3. Click derecho sobre la request **`links`** → **Copy → Copy as cURL**.
4. Pegá ese cURL en **`scripts/_curl.txt`** y corré:

   ```bash
   npm run session
   ```

   Eso decodifica la cookie + `x-csrf-token` y los guarda en
   `data/.affiliate-session.json` (gitignored). Acepta el formato cURL de Windows
   (cmd) y el de bash. El `tag` sale de `ML_AFFILIATE_TAG` en `.env`.
5. Volvé a correr `npm run mint` — el progreso anterior ya quedó guardado.

> La sesión también puede setearse por env vars (`ML_AFFILIATE_COOKIE`,
> `ML_AFFILIATE_CSRF`, `ML_AFFILIATE_TAG`) si preferís; el archivo JSON tiene
> prioridad. No automatices ni saltees captchas/anti-bot: si el endpoint pide
> verificación, resolvelo a mano.

---

## Correr el sitio

```bash
npm run dev        # http://localhost:4321  (SSR; sin catálogo muestra estado vacío)
npm run build      # build SSR para Netlify
npm run preview
npm run check       # type-check de Astro
```

El frontend **nunca** habla directo con `api.mercadolibre.com`: todo pasa por el servidor
(SSR), que tiene el token cacheado en memoria. El token nunca llega al browser.

### Deploy en Netlify

`netlify.toml` está preconfigurado y `astro.config.mjs` usa el adapter `@astrojs/netlify`
(`output: 'server'`). En **Site settings → Environment variables** cargá las mismas vars
de `.env` (al menos las de OAuth2; la sesión de afiliados solo hace falta para correr el
job, no para servir). Tras cada corrida de `mint`/`describe`, commiteá los dos JSON y
redeployá para que el sitio vea las notebooks nuevas.

---

## El quiz (dos ramas → un solo motor)

`/quiz/tecnico` (rama A, "sé lo que busco") y `/quiz/general` (rama B, "no tengo idea")
producen el **mismo objeto de filtros internos** (`src/shared/quiz-map.mjs`) que alimenta
**un único motor** (`src/shared/filter-engine.mjs`). La rama B traduce respuestas en
criollo a specs según la tabla del brief §9. Si no hay match exacto, el motor **relaja
progresivamente** (GPU → almacenamiento → RAM → procesador → pantalla → precio) en vez de
devolver vacío.

---

## Estructura

```
astro-site/
├─ .env / .env.example          # credenciales (NO commitear .env)
├─ astro.config.mjs             # SSR + adapter Netlify
├─ data/
│  ├─ affiliate_links.json      # store de links (texto, keyed by item id)
│  ├─ descriptions.json         # store de descripciones (texto)
│  └─ .token-cache.json         # cache del access token (gitignored)
├─ scripts/                     # JOBS (Node, corren con --env-file=.env)
│  ├─ get-refresh-token.mjs · refresh-token.mjs · inspect-attributes.mjs
│  ├─ validate-seam.mjs         # ⭐ §12 — correr PRIMERO
│  ├─ mint-links.mjs · generate-descriptions.mjs
│  └─ _shared/                  # ml-client · stores · mint · describe · env
└─ src/
   ├─ shared/                   # lógica PURA (.mjs) usada por jobs Y sitio
   │  ├─ constants.mjs · ml-fields.mjs (predicado envío local §5.3.1)
   │  ├─ attributes.mjs (normalizador de specs §5.2)
   │  ├─ filter-engine.mjs (motor único §9) · quiz-map.mjs (traducción §9)
   ├─ lib/                      # capa SSR: ml-api.ts · catalog.ts · types.ts · analytics.ts
   ├─ data/copy.ts             # TODO el copy visible (es-AR)
   ├─ components/ · layouts/
   └─ pages/
      ├─ index.astro            # home + bifurcación del quiz + featured (live)
      ├─ quiz/[branch].astro    # ramas A/B (prerender)
      ├─ resultado.astro        # SSR: filtros → motor → grid
      └─ notebook/[id].astro    # ficha (SSR) + JSON-LD
```

---

## Caveats (brief §14)

- **No se fabrican links** por concatenación de URL: el `meli.la` y el `ref` encriptado los
  emite ML. La única vía es el endpoint del job de minteo.
- **Solo envío local.** Internacionales/CBT (`logistic_type "remote"` o vendedor fuera de
  AR) se excluyen en el minteo **y** en el serving. Confirmá los nombres/valores exactos de
  esos campos contra una respuesta real de `/items` al correr `npm run validate`.
- **Recategorización automática de ML** (desde 29/10/2025): no asumas que un id puntual sigue
  en `MLA1652` para siempre — el sitio trabaja siempre con la respuesta viva.
- **Precios = referencia.** Se muestran etiquetados como "precio de referencia — puede variar".
- **IDs de atributos:** confirmалos con `npm run inspect-attributes` en vez de asumirlos.

---

## GA4 / tracking

El evento principal es `affiliate_click` (con `transport_type:'beacon'`, dispara en cada
click al botón de compra, incluye `item_id` y precio de referencia). Poné tu Measurement ID
en `src/layouts/BaseLayout.astro` (`GA4_ID`); el snippet se activa solo cuando deja de ser
el placeholder.
