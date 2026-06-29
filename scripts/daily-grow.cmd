@echo off
rem ─────────────────────────────────────────────────────────────────────────────
rem  Crecimiento diario del catálogo (corre solo al iniciar sesión, 1 vez por día).
rem    1) suma productos nuevos de a poco (grow, tope seguro: --scan/--max)
rem    2) rebuildea el sitio para que tome el catálogo actualizado
rem  Los precios NO se refrescan acá: se consultan en vivo solo para los equipos
rem  que "ganan" (se muestran) — ver src/lib/enrich.ts.
rem  Log: data\daily.log
rem ─────────────────────────────────────────────────────────────────────────────
setlocal
cd /d "D:\Bambo\Proyectos\Que Notebook Comprar\astro-site"

rem ── Guard: una sola corrida por día (aunque inicies sesión varias veces) ──────
node -e "const fs=require('fs');const f='data/.last-daily.txt';const t=new Date().toISOString().slice(0,10);let l='';try{l=fs.readFileSync(f,'utf8').trim()}catch{}if(l===t)process.exit(9);fs.writeFileSync(f,t)"
if errorlevel 9 (
  echo [%DATE% %TIME%] ya corrio hoy, salteando >> data\daily.log
  exit /b 0
)

echo. >> data\daily.log
echo ============================================================ >> data\daily.log
echo [%DATE% %TIME%] INICIO crecimiento diario >> data\daily.log
call npm run catalog:grow -- --scan=300 --max=30 >> data\daily.log 2>&1
call npm run build >> data\daily.log 2>&1
echo [%DATE% %TIME%] FIN >> data\daily.log
endlocal
