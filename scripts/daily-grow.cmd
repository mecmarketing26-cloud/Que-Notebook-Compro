@echo off
rem ─────────────────────────────────────────────────────────────────────────────
rem  Crecimiento diario del catálogo (corre solo al iniciar sesión, 1 vez por día).
rem    1) suma productos nuevos de a poco (grow, tope seguro: --scan/--max)
rem    2) rebuildea el sitio para que tome el catálogo actualizado
rem    3) commitea + pushea data/ -> dispara redeploy en Netlify (los nuevos suben solos)
rem  Los precios NO se refrescan acá: se consultan en vivo solo para los equipos
rem  que "ganan" (se muestran) — ver src/lib/enrich.ts.
rem  Log: data\daily.log
rem ─────────────────────────────────────────────────────────────────────────────
setlocal
cd /d "D:\Bambo\Proyectos\Que Notebook Comprar\astro-site"

rem ── Guard: una sola corrida EXITOSA por día. Solo LEE acá; la fecha se graba al
rem    FINAL, así un corte/error a mitad permite reintentar en el próximo logon.
node -e "const fs=require('fs');const f='data/.last-daily.txt';const t=new Date().toISOString().slice(0,10);let l='';try{l=fs.readFileSync(f,'utf8').trim()}catch{}process.exit(l===t?9:0)"
if errorlevel 9 (
  echo [%DATE% %TIME%] ya corrio hoy, salteando >> data\daily.log
  exit /b 0
)

echo. >> data\daily.log
echo ============================================================ >> data\daily.log
echo [%DATE% %TIME%] INICIO crecimiento diario >> data\daily.log
call npm run catalog:grow -- --scan=300 --max=30 >> data\daily.log 2>&1
call npm run build >> data\daily.log 2>&1

rem ── Publicar: commitear el catálogo y pushear (dispara el redeploy en Netlify) ─
git add data/catalog.json data/affiliate_links.json data/descriptions.json >> data\daily.log 2>&1
git diff --staged --quiet
if errorlevel 1 (
  git commit -m "chore(catalog): crecimiento diario %DATE%" >> data\daily.log 2>&1
  git push >> data\daily.log 2>&1
  echo [%DATE% %TIME%] pusheado a GitHub - Netlify redeploya >> data\daily.log
) else (
  echo [%DATE% %TIME%] sin productos nuevos, nada que pushear >> data\daily.log
)

rem ── Recién ahora marcamos el día como hecho (un fallo antes de acá reintenta) ──
node -e "require('fs').writeFileSync('data/.last-daily.txt', new Date().toISOString().slice(0,10))"
echo [%DATE% %TIME%] FIN >> data\daily.log
endlocal
